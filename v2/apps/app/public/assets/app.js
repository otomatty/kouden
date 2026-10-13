// 全画面共通の小さな補助（CSP のため外部ファイルにする）
(() => {
	// 入力エラーのある画面・部分を表示したら、最初のエラーの欄にフォーカスを移す
	// （エラーの内容は aria-describedby で読み上げられる。閉じた <details> の中なら開く）
	function focusFirstInvalid(root) {
		const el = root.querySelector('[aria-invalid="true"]');
		if (!el) return;
		const details = el.closest("details");
		if (details) details.open = true;
		el.focus();
	}
	document.addEventListener("DOMContentLoaded", () => focusFirstInvalid(document));
	document.addEventListener("htmx:afterSettle", (e) => {
		const status = e.detail.xhr?.status;
		if (status !== 422 && status !== 409) return;
		// outerHTML で差し替えた場合、target は外れた古い要素になる
		const target = e.detail.target;
		focusFirstInvalid(target?.isConnected ? target : document);
	});
})();
