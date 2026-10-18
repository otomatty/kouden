# 本番とリハーサル用の件数・関数・トリガー・RLS ポリシーを比べる（ROLLBACK-REHEARSAL.md の 1）。
# 出力は件数と定義の md5 だけで、行の中身は含まない。結果は compare/ に保存する。
$ErrorActionPreference = 'Stop'
if (-not $env:PROD_DB_URL -or -not $env:REHEARSAL_DB_URL) { throw 'PROD_DB_URL と REHEARSAL_DB_URL を設定してください' }

$queries = @{
	counts    = "select table_schema || '.' || table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text from information_schema.tables where table_schema in ('public', 'auth', 'storage', 'common', 'gift', 'funeral', 'cron') and table_type = 'BASE TABLE' order by 1"
	functions = "select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', md5(pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind in ('f', 'p') order by 1"
	triggers  = "select c.relname || '.' || t.tgname, md5(pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal order by 1"
	policies  = "select tablename || '.' || policyname, md5(concat_ws('|', cmd, roles::text, qual, with_check)) from pg_policies where schemaname in ('public', 'storage') order by 1"
}

New-Item -ItemType Directory -Force compare | Out-Null
$diffs = 0
foreach ($name in $queries.Keys | Sort-Object) {
	foreach ($target in 'prod', 'rehearsal') {
		$url = if ($target -eq 'prod') { $env:PROD_DB_URL } else { $env:REHEARSAL_DB_URL }
		psql -X -A -t -F ' ' -d $url -c $queries[$name] -o "compare/$target-$name.txt"
		if ($LASTEXITCODE -ne 0) { throw "$target $name failed" }
	}
	$d = Compare-Object (Get-Content "compare/prod-$name.txt") (Get-Content "compare/rehearsal-$name.txt")
	$d | Out-File -Encoding utf8 "compare/diff-$name.txt"
	"{0}: 本番 {1} 行 / 差分 {2} 行" -f $name, (Get-Content "compare/prod-$name.txt").Count, @($d).Count
	$diffs += @($d).Count
}
if ($diffs -ne 0) { "差分があります。compare/diff-*.txt を確認してください（cron.job は止めたため差分になる）" }
