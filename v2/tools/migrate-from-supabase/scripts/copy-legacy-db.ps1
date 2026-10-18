# 旧本番 DB をリハーサル用プロジェクトへ複製する（ROLLBACK-REHEARSAL.md の 1）。
# Git 管理外の作業フォルダで実行する。接続文字列は環境変数 PROD_DB_URL / REHEARSAL_DB_URL、
# CA 証明書は PGSSLROOTCERT で渡す。本番には dump（読み取り）と SELECT だけを行う。
$ErrorActionPreference = 'Stop'
$prodRef = 'tcqnsslsaizqwjuyvoyu'

if (-not $env:PROD_DB_URL -or -not $env:REHEARSAL_DB_URL) { throw 'PROD_DB_URL と REHEARSAL_DB_URL を設定してください' }
if (-not $env:PGSSLROOTCERT -or -not (Test-Path $env:PGSSLROOTCERT)) { throw 'PGSSLROOTCERT に Supabase の CA 証明書のパスを設定してください' }
if ($env:REHEARSAL_DB_URL -match $prodRef) { throw 'REHEARSAL_DB_URL が本番を指しています' }
if ($env:PROD_DB_URL -notmatch $prodRef) { throw 'PROD_DB_URL が本番を指していません' }

# psql にはパスワードを引数でなく PGPASSWORD で渡し、証明書を検証する。
$env:PGSSLMODE = 'verify-full'
function Invoke-Psql([string]$url, [string[]]$options) {
	$u = [Uri]$url
	$user, $password = $u.UserInfo -split ':', 2
	$env:PGPASSWORD = [Uri]::UnescapeDataString("$password")
	try { psql -X -v ON_ERROR_STOP=1 -h $u.Host -p $u.Port -U ([Uri]::UnescapeDataString($user)) -d $u.AbsolutePath.TrimStart('/') @options }
	finally { Remove-Item Env:PGPASSWORD }
	if ($LASTEXITCODE -ne 0) { throw "psql failed (exit $LASTEXITCODE)" }
}

# 復元先が作ったばかりの空のプロジェクトであること（public の表、Auth のユーザー、Storage のバケット・ファイルがない）を確かめる。
$used = Invoke-Psql $env:REHEARSAL_DB_URL @('-A', '-t', '-c', "select (select count(*) from pg_tables where schemaname = 'public') + (select count(*) from auth.users) + (select count(*) from storage.buckets) + (select count(*) from storage.objects)")
if ([int]$used -ne 0) { throw 'リハーサル用のプロジェクトに既存の表・ユーザー・ファイルがあります。作ったばかりの空のプロジェクトに復元してください' }

# supabase db dump は Docker 内の pg_dump を使うため、ホストの CA 証明書で検証できない。
# --dry-run で同じ絞り込みの pg_dump スクリプトだけを出させ、ホストの pg_dump（Git Bash）で verify-full のまま実行する。
# パスワードは URL から外して PGPASSWORD で渡し、スクリプトにもコマンドの引数にも残さない。
$prod = [Uri]$env:PROD_DB_URL
$prodUser, $prodPassword = $prod.UserInfo -split ':', 2
$dumpUrl = 'postgresql://{0}@{1}:{2}{3}' -f $prodUser, $prod.Host, $prod.Port, $prod.AbsolutePath
# WSL の bash を避け、git.exe（cmd\ や mingw64\bin\ にある）から上へ Git for Windows の bin\bash.exe を探す。
$gitBash = $null
for ($d = Split-Path (Get-Command git).Source; $d; $d = Split-Path $d) {
	if (Test-Path (Join-Path $d 'bin\bash.exe')) { $gitBash = Join-Path $d 'bin\bash.exe'; break }
}
if (-not $gitBash) { throw 'Git for Windows の bash.exe が見つかりません' }
function Save-Dump([string]$file, [string[]]$options) {
	if (Test-Path $file) { return }  # 復元だけをやり直す場合は使い回す
	$script = supabase db dump --workdir $PWD --db-url $dumpUrl --dry-run @options  # リポジトリの supabase/config.toml を読まない
	if ($LASTEXITCODE -ne 0) { throw "dump $file の準備に失敗しました (exit $LASTEXITCODE)" }
	# 出力は bash 側でファイルへ書く（PowerShell 5.1 のリダイレクトは UTF-16 になるため）。
	$script = @($script | Where-Object { $_ -notmatch '^export PGPASSWORD=' }) -replace '^set -euo pipefail$', ('set -euo pipefail' + "`n" + 'exec > "$DUMP_OUT"')
	[IO.File]::WriteAllText("$PWD\$file.sh", ($script -join "`n") + "`n")
	$env:PGPASSWORD = [Uri]::UnescapeDataString("$prodPassword")
	$env:DUMP_OUT = "$file.part"
	try { & $gitBash "$file.sh" }
	finally { Remove-Item Env:PGPASSWORD, Env:DUMP_OUT }
	if ($LASTEXITCODE -ne 0) { Remove-Item -ErrorAction SilentlyContinue "$file.part"; throw "dump $file failed (exit $LASTEXITCODE)" }
	Move-Item "$file.part" $file
}

$start = Get-Date
Save-Dump roles.sql @('--role-only')
Save-Dump schema.sql @()
Save-Dump data.sql @('--use-copy', '--data-only', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes')
# auth・storage の表に付けた独自トリガー（新規ユーザーの profiles 作成など）・RLS ポリシーは dump に含まれない。
# 本番の定義から、ないものだけ作る SQL を用意する。search_path を空にして、関数名などを schema 付きで出す（schema.sql も空にする）。
# トリガーは作れなければ失敗させる。ポリシーは Supabase が管理する表で作成を拒まれることがあり、その場合は飛ばして比較で差分として示す。
Invoke-Psql $env:PROD_DB_URL @('-q', '-A', '-t', '-o', 'managed-objects.sql', '-c', "set search_path = ''", '-c', @"
select format('do `$t`$ begin if not exists (select 1 from pg_trigger where tgrelid = %L::regclass and tgname = %L) then execute %L; end if; end `$t`$;',
  c.oid::regclass::text, t.tgname, pg_get_triggerdef(t.oid))
from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('auth', 'storage') and not t.tgisinternal
union all
select format('do `$t`$ begin if not exists (select 1 from pg_policies where schemaname = %L and tablename = %L and policyname = %L) then execute %L; end if; exception when insufficient_privilege then raise warning ''policy skipped: %%s.%%s'', %L, %L; end `$t`$;',
  schemaname, tablename, policyname,
  format('create policy %I on %I.%I as %s for %s to %s', policyname, schemaname, tablename, permissive, cmd,
    (select string_agg(quote_ident(r), ', ') from unnest(roles) r))
  || coalesce(' using (' || qual || ')', '') || coalesce(' with check (' || with_check || ')', ''),
  schemaname, tablename)
from pg_policies where schemaname in ('auth', 'storage')
"@)
$dumped = Get-Date

Invoke-Psql $env:REHEARSAL_DB_URL @('--single-transaction', '-f', 'roles.sql', '-f', 'schema.sql', '-c', 'SET session_replication_role = replica', '-f', 'data.sql', '-c', 'SET session_replication_role = origin', '-f', 'managed-objects.sql')
$restored = Get-Date

# 複製された無料香典帳の自動アーカイブを止める（状態が変わると切り戻しの前提照合が崩れる）。
# 複製したログインセッションも消す（本番のトークンでリハーサル用にログインできないようにする）。
Invoke-Psql $env:REHEARSAL_DB_URL @('-c', "do `$`$ begin if to_regclass('cron.job') is not null then perform cron.unschedule(jobid) from cron.job; end if; end `$`$", '-c', 'delete from auth.refresh_tokens', '-c', 'delete from auth.sessions')

"dump: {0:n0} 秒 / restore: {1:n0} 秒" -f ($dumped - $start).TotalSeconds, ($restored - $dumped).TotalSeconds
