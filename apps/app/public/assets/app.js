// 全画面共通の小さな補助（CSP のため外部ファイルにする）
(() => {
	// htmx でフォームを送信するときは、その中の入力欄が出している要求（差出人の候補の検索）を取り消し、
	// 送信中は新しく出さない。送信の結果で差し替えた入力欄に、送信前の入力で求めた候補が出ないようにする
	document.addEventListener("htmx:beforeRequest", (e) => {
		const elt = e.detail.elt;
		if (elt instanceof HTMLFormElement) {
			for (const el of elt.querySelectorAll("[hx-get]")) window.htmx?.trigger(el, "htmx:abort");
			elt.dataset.submitting = "";
		} else if (elt?.form && "submitting" in elt.form.dataset) {
			e.preventDefault();
		}
	});
	document.addEventListener("htmx:afterRequest", (e) => {
		const elt = e.detail.elt;
		if (elt instanceof HTMLFormElement) delete elt.dataset.submitting;
	});

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
		// outerHTML で差し替えた場合、target は外れた古い要素になるので、同じ id の新しい要素を探す
		// （他の行の編集欄に残っているエラーへ移らないように）
		const target = e.detail.target;
		const root = target?.isConnected
			? target
			: (target?.id && document.getElementById(target.id)) || document;
		focusFirstInvalid(root);
	});

	// URL の # が開閉できる項目（よくある質問の <details>）を指していたら開く
	function openLinkedDetails() {
		let id = "";
		try {
			id = decodeURIComponent(location.hash.slice(1));
		} catch {
			return;
		}
		const el = id && document.getElementById(id);
		if (el instanceof HTMLDetailsElement) el.open = true;
	}
	document.addEventListener("DOMContentLoaded", openLinkedDetails);

	// ヘッダーのユーザーメニュー（<details data-user-menu>）は、外側を押すか Esc で閉じる
	document.addEventListener("click", (e) => {
		for (const menu of document.querySelectorAll("details[data-user-menu][open]")) {
			if (!(e.target instanceof Node && menu.contains(e.target))) menu.open = false;
		}
	});
	document.addEventListener("keydown", (e) => {
		if (e.key !== "Escape") return;
		for (const menu of document.querySelectorAll("details[data-user-menu][open]")) {
			menu.open = false;
			menu.querySelector("summary")?.focus();
		}
	});
	window.addEventListener("hashchange", openLinkedDetails);
})();
