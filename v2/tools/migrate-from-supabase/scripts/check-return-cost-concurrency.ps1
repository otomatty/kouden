# 返礼明細を複数の接続から同時に書き、return_items_cost が明細の合計と一致するかを確かめる（ROLLBACK-REHEARSAL.md の 4）。
# リハーサル用の DB にだけ使う。PG* の環境変数（PGHOST・PGUSER・PGPASSWORD など）で接続し、最後に追加した明細を消す。
param(
	[Parameter(Mandatory)][string]$Record1,
	[Parameter(Mandatory)][string]$Record2,
	[Parameter(Mandatory)][string]$ItemMaster,
	[Parameter(Mandatory)][string]$CreatedBy,
	[int]$Writers = 8
)
$ErrorActionPreference = 'Stop'
if ($env:PGUSER -notmatch '^postgres\.[a-z0-9]{20}$' -or $env:PGUSER -match 'tcqnsslsaizqwjuyvoyu') { throw 'PGUSER がリハーサル用ではありません' }
$tag = 'rehearsal-concurrency'
function Invoke-Sql([string]$sql) {
	$out = psql -X -q -A -t -v ON_ERROR_STOP=1 -c $sql
	if ($LASTEXITCODE -ne 0) { throw "psql failed: $sql" }
	$out
}
function Start-Sql([string]$sql) {
	$p = Start-Process psql -ArgumentList @('-X', '-q', '-v', 'ON_ERROR_STOP=1', '-c', "`"$sql`"") -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\$tag-$([guid]::NewGuid()).err"
	$null = $p.Handle  # 終了コードを読めるよう、終了前にハンドルを取っておく
	$p
}
function Wait-Sql($procs) {
	foreach ($p in $procs) { $p.WaitForExit() }
	@($procs | Where-Object { $_.ExitCode -ne 0 }).Count
}
$check = "select r.id || ' cost=' || r.return_items_cost || ' items=' || coalesce(sum(i.price * i.quantity), 0) || ' lines=' || count(i.id) from public.return_entry_records r left join public.return_record_items i on i.return_record_id = r.id where r.id in ('$Record1', '$Record2') group by r.id, r.return_items_cost order by r.id"

Invoke-Sql "delete from public.return_record_items where notes = '$tag'" | Out-Null
try {
	# 1. 同じ返礼記録へ同時に追加する。各トランザクションは追加後に待つので、互いに重なる。
	$procs = 1..$Writers | ForEach-Object {
		Start-Sql "begin; insert into public.return_record_items (return_record_id, return_item_master_id, price, quantity, notes, created_by) values ('$Record1', '$ItemMaster', $($_ * 100), 1, '$tag', '$CreatedBy'); select pg_sleep(2); commit;"
	}
	"同時追加（$Writers 件）: 失敗 $(Wait-Sql $procs) 件"
	Invoke-Sql $check

	# 2. 2 つの返礼記録の間で、逆向きに同時に付け替える。ID 順にロックするのでデッドロックしない。
	$a = Invoke-Sql "insert into public.return_record_items (return_record_id, return_item_master_id, price, quantity, notes, created_by) values ('$Record1', '$ItemMaster', 5000, 1, '$tag', '$CreatedBy') returning id"
	$b = Invoke-Sql "insert into public.return_record_items (return_record_id, return_item_master_id, price, quantity, notes, created_by) values ('$Record2', '$ItemMaster', 7000, 1, '$tag', '$CreatedBy') returning id"
	$procs = @(
		(Start-Sql "begin; update public.return_record_items set return_record_id = '$Record2' where id = '$a'; select pg_sleep(2); commit;"),
		(Start-Sql "begin; update public.return_record_items set return_record_id = '$Record1' where id = '$b'; select pg_sleep(2); commit;")
	)
	"逆向きの付け替え: 失敗 $(Wait-Sql $procs) 件"
	Get-ChildItem "$env:TEMP\$tag-*.err" | Get-Content | Select-Object -First 5
	Invoke-Sql $check
} finally {
	Invoke-Sql "delete from public.return_record_items where notes = '$tag'" | Out-Null
	Remove-Item "$env:TEMP\$tag-*.err" -ErrorAction SilentlyContinue
	'後片付け後:'
	Invoke-Sql $check
}
