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

	// いただきものの登録の金額のボタン（08 案 A）。押すと金額の欄に入る。JS がないときは隠したまま
	function digitsOf(value) {
		return value.normalize("NFKC").replace(/[\s,円¥]/g, "");
	}
	function syncAmountChips(root) {
		for (const group of root.querySelectorAll("[data-amount-chips]")) {
			group.hidden = false;
			const input = group.closest("form")?.querySelector('input[name="amount"]');
			const current = input ? digitsOf(input.value) : "";
			for (const chip of group.querySelectorAll("[data-amount]")) {
				chip.setAttribute("aria-pressed", String(chip.dataset.amount === current));
			}
		}
	}
	document.addEventListener("click", (e) => {
		const chip = e.target instanceof Element ? e.target.closest("[data-amount]") : null;
		const input = chip?.closest("form")?.querySelector('input[name="amount"]');
		if (!chip || !input) return;
		input.value = Number(chip.dataset.amount).toLocaleString("ja-JP");
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
	document.addEventListener("input", (e) => {
		if (e.target instanceof HTMLInputElement && e.target.name === "amount") {
			const form = e.target.closest("form");
			if (form) syncAmountChips(form);
		}
	});

	// 開閉を端末に覚えておく <details data-remember="名前">（登録画面の「＋」など）。
	// 覚えた「開く」だけを戻す（入力エラーで開いている欄は閉じない）
	function rememberKey(details) {
		return `kouden:details:${details.dataset.remember}`;
	}
	function restoreDetails(root) {
		for (const details of root.querySelectorAll("details[data-remember]")) {
			try {
				if (localStorage.getItem(rememberKey(details)) === "open") details.open = true;
			} catch {
				// 保存できない環境（プライベートブラウズなど）では覚えない
			}
		}
	}
	document.addEventListener(
		"toggle",
		(e) => {
			const details = e.target;
			if (!(details instanceof HTMLDetailsElement) || !details.dataset.remember) return;
			try {
				localStorage.setItem(rememberKey(details), details.open ? "open" : "closed");
			} catch {
				// 同上
			}
		},
		true,
	);

	// 郵便番号から住所を入れる（08 案 E）。データは /postal/<先頭 3 桁>.json（scripts/build-postal.ts が作る）。
	// 同じフォーム（表で入力では同じ行 [data-postal-scope]）の [data-postal-code] と [data-address] を組にする。
	// 自分で入れた住所は書き換えない
	const postalShards = new Map();
	function postalShard(prefix) {
		if (!postalShards.has(prefix)) {
			const shard = fetch(`/postal/${prefix}.json`)
				.then((res) => (res.ok ? res.json() : {}))
				.catch(() => {
					postalShards.delete(prefix);
					return {};
				});
			postalShards.set(prefix, shard);
		}
		return postalShards.get(prefix);
	}
	function postalDigits(value) {
		return value.normalize("NFKC").replace(/\D/g, "");
	}
	document.addEventListener("input", async (e) => {
		const input = e.target;
		if (!(input instanceof HTMLInputElement) || !("postalCode" in input.dataset)) return;
		const code = postalDigits(input.value);
		const address = (input.closest("[data-postal-scope]") ?? input.form)?.querySelector(
			"[data-address]",
		);
		if (code.length !== 7 || !(address instanceof HTMLInputElement)) return;
		const found = (await postalShard(code.slice(0, 3)))[code.slice(3)];
		// 待っている間に書き換えられていたら入れない
		if (!found || postalDigits(input.value) !== code) return;
		if (address.value !== "" && address.value !== address.dataset.filled) return;
		const text = found.join("");
		address.value = text;
		address.dataset.filled = text;
		// 入れたことを画面のスクリプトに知らせる（表で入力は、行を離れた後に入った住所も保存する）
		address.dispatchEvent(new Event("input", { bubbles: true }));
		address.dispatchEvent(new Event("change", { bubbles: true }));
		// 待つ間にほかの欄へ移っていたら、フォーカスを引き戻さない
		if (document.activeElement === input) {
			address.focus();
			address.setSelectionRange(text.length, text.length);
		}
		const status = document.getElementById("sr-status");
		if (status)
			status.textContent = `住所に「${text}」を入れました。続けて番地を入力してください。`;
	});

	function enhance(root) {
		syncAmountChips(root);
		restoreDetails(root);
	}
	document.addEventListener("DOMContentLoaded", () => enhance(document));
	document.addEventListener("htmx:afterSettle", () => enhance(document));

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
