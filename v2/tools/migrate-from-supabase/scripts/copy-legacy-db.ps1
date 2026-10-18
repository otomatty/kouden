# 旧本番 DB をリハーサル用プロジェクトへ複製する（ROLLBACK-REHEARSAL.md の 1）。
# Git 管理外の作業フォルダで実行する。接続文字列は環境変数 PROD_DB_URL / REHEARSAL_DB_URL で渡す。
# 本番には dump（読み取り）だけを行う。
$ErrorActionPreference = 'Stop'
$prodRef = 'tcqnsslsaizqwjuyvoyu'

function Invoke-Native([string]$label, [scriptblock]$block) {
	& $block
	if ($LASTEXITCODE -ne 0) { throw "$label failed (exit $LASTEXITCODE)" }
}

if (-not $env:PROD_DB_URL -or -not $env:REHEARSAL_DB_URL) { throw 'PROD_DB_URL と REHEARSAL_DB_URL を設定してください' }
if ($env:REHEARSAL_DB_URL -match $prodRef) { throw 'REHEARSAL_DB_URL が本番を指しています' }
if ($env:PROD_DB_URL -notmatch $prodRef) { throw 'PROD_DB_URL が本番を指していません' }

# 復元先が空であること（public にテーブルがない）を確かめる。
$tables = Invoke-Native 'psql (check)' { psql -X -A -t -d $env:REHEARSAL_DB_URL -c "select count(*) from pg_tables where schemaname = 'public'" }
if ([int]$tables -ne 0) { throw "リハーサル用の public にテーブルが $tables 個あります。空のプロジェクトに復元してください" }

# dump が既にあれば使い回す（復元だけをやり直す場合）。
$start = Get-Date
function Save-Dump([string]$file, [string[]]$options) {
	if (Test-Path $file) { return }
	supabase db dump --db-url $env:PROD_DB_URL -f "$file.part" @options
	if ($LASTEXITCODE -ne 0) { Remove-Item -ErrorAction SilentlyContinue "$file.part"; throw "dump $file failed (exit $LASTEXITCODE)" }
	Move-Item "$file.part" $file
}
Save-Dump roles.sql @('--role-only')
Save-Dump schema.sql @()
Save-Dump data.sql @('--use-copy', '--data-only', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes')
$dumped = Get-Date

Invoke-Native 'restore' {
	psql -X --single-transaction -v ON_ERROR_STOP=1 -f roles.sql -f schema.sql -c 'SET session_replication_role = replica' -f data.sql -d $env:REHEARSAL_DB_URL
}
$restored = Get-Date

# 複製された無料香典帳の自動アーカイブを止める。状態が変わると切り戻しの前提照合が崩れる。
Invoke-Native 'unschedule cron' {
	psql -X -v ON_ERROR_STOP=1 -d $env:REHEARSAL_DB_URL -c "do `$`$ begin if to_regclass('cron.job') is not null then perform cron.unschedule(jobid) from cron.job; end if; end `$`$"
}

"dump: {0:n0} 秒 / restore: {1:n0} 秒" -f ($dumped - $start).TotalSeconds, ($restored - $dumped).TotalSeconds
