// 香典帳のリアルタイム同期（docs/rebuild/04-architecture.md §5）
// - DO から「何が変わったか」だけを受け取り、該当する [data-live] 部分を htmx で取り直す
// - 閲覧中のメンバーと「○○さんが編集中」を表示する
// - 通信が切れたら警告を出し、保存・送信のボタン（POST のフォーム）を無効にする
// CSP のため eval・インラインのイベントハンドラは使わない。
(() => {
	const script = document.currentScript;
	const koudenId = script?.dataset.koudenId;
	const userId = script?.dataset.userId;
	if (!koudenId || !("WebSocket" in window)) return;

	const base = `/k/${koudenId}`;
	// この画面（タブ）の識別子。htmx の要求に付け、自分のタブの変更の通知だけを無視する
	// （同じユーザーが別のタブ・端末で開いている画面は取り直す）
	const tabId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
	document.addEventListener("htmx:configRequest", (e) => {
		e.detail.headers["X-Tab-Id"] = tabId;
	});
	let ws = null;
	// 画面を表示した時点の変更ログの位置。最初の接続時もここから取り直す
	let lastSeq = Number(script.dataset.seq) || 0;
	// 再接続時に取り直す必要がある変更の起点（取り直しに成功するまで保持する）
	let gapFrom = null;
	let retry = 0;
	let pingTimer = 0;
	let connected = false;
	let editingSent = "";
	let lastUsers = [];
	const timers = new Map();

	// ---- 接続状態 ----
	// 状態を変える操作（POST のフォームの送信ボタン）。GET の検索フォームは対象外
	const MUTATION_CONTROLS =
		'form[method="post" i] button:not([type="button"]), form[method="post" i] input[type="submit"], [data-requires-online]';

	function updateOnline() {
		const online = connected && navigator.onLine;
		const banner = document.querySelector("[data-connection]");
		if (banner) banner.hidden = online;
		for (const el of document.querySelectorAll(MUTATION_CONTROLS)) {
			if (!online && !el.disabled) {
				// 元から無効なボタン（先頭の「↑」など）は、復帰時に有効にしないよう印を付けたものだけ戻す
				el.disabled = true;
				el.dataset.offlineDisabled = "";
			} else if (online && "offlineDisabled" in el.dataset) {
				el.disabled = false;
				delete el.dataset.offlineDisabled;
			}
		}
	}
	window.addEventListener("online", updateOnline);
	window.addEventListener("offline", updateOnline);

	function connect() {
		const proto = location.protocol === "https:" ? "wss:" : "ws:";
		ws = new WebSocket(`${proto}//${location.host}${base}/ws`);
		ws.addEventListener("open", () => {
			retry = 0;
			connected = true;
			updateOnline();
			editingSent = "";
			sendEditing();
			clearInterval(pingTimer);
			pingTimer = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) ws.send("ping");
			}, 30000);
		});
		ws.addEventListener("message", (e) => {
			if (e.data === "pong") return;
			let message;
			try {
				message = JSON.parse(e.data);
			} catch {
				return;
			}
			handle(message);
		});
		ws.addEventListener("close", (e) => {
			clearInterval(pingTimer);
			connected = false;
			updateOnline();
			if (e.code === 4001) return; // 権限がなくなった
			const delay = Math.min(30000, 1000 * 2 ** retry++) + Math.random() * 500;
			setTimeout(connect, delay);
		});
	}

	function handle(m) {
		if (m.type === "hello") {
			// 再接続: 切れている間の変更を取り直す。取り直しに失敗しても起点を失わないよう gapFrom に残す
			if (lastSeq && m.seq > lastSeq && gapFrom === null) gapFrom = lastSeq;
			lastSeq = Math.max(lastSeq, m.seq);
			if (gapFrom !== null) catchUp();
		} else if (m.type === "changed") {
			lastSeq = Math.max(lastSeq, m.seq);
			applyChange(m);
		} else if (m.type === "presence") {
			lastUsers = m.users;
			renderPresence();
		} else if (m.type === "revoked") {
			location.href = "/";
		}
	}

	let catchUpTimer = 0;

	async function catchUp() {
		const since = gapFrom;
		if (since === null) return;
		clearTimeout(catchUpTimer);
		try {
			const res = await fetch(`${base}/changes?since=${since}`, {
				headers: { Accept: "application/json" },
			});
			if (!res.ok) throw new Error(`changes: ${res.status}`);
			const data = await res.json();
			if (data.reset) {
				for (const el of document.querySelectorAll("[data-live]")) refreshRegion(el);
			} else {
				for (const change of data.changes) applyChange(change);
			}
			if (gapFrom === since) gapFrom = null;
		} catch {
			// 起点は gapFrom に残っている。少し待って取り直す（次の再接続でも取り直す）
			catchUpTimer = setTimeout(catchUp, 5000);
		}
	}

	// ---- 変更の反映 ----
	function applyChange(m) {
		// 権限・アーカイブ状態の変更は画面全体に影響するので読み込み直す
		if (m.entity === "kouden" || (m.entity === "member" && m.id === userId && m.tab !== tabId)) {
			location.reload();
			return;
		}
		// このタブでの変更は、操作した画面に反映済み
		if (m.tab && m.tab === tabId) return;
		for (const el of document.querySelectorAll("[data-live-watch]")) {
			if (el.dataset.liveWatch === `${m.entity}:${m.id}`) el.hidden = false;
		}
		for (const el of document.querySelectorAll("[data-live]")) {
			if (el.dataset.live.split(",").includes(m.entity)) refreshRegion(el);
		}
	}

	/** 部分の中で入力中か（編集フォームが開いている・入力欄にフォーカスがある） */
	function isBusy(el) {
		const active = document.activeElement;
		return Boolean(
			el.querySelector("form[data-editing-entity]") ||
			(active && el.contains(active) && active.matches("input, select, textarea")),
		);
	}

	function showStale(el) {
		const notice = el.querySelector("[data-stale-notice]");
		if (notice) notice.hidden = false;
	}

	// 取り直し中の部分。応答が届いた時点で入力中なら差し替えない（取り直しを始めた後に入力を始めた場合）
	const refreshing = new Set();
	document.addEventListener("htmx:beforeSwap", (e) => {
		const target = e.detail.target;
		if (!target || !refreshing.has(target.id)) return;
		refreshing.delete(target.id);
		if (isBusy(target)) {
			e.detail.shouldSwap = false;
			showStale(target);
		}
	});

	function refreshRegion(el) {
		clearTimeout(timers.get(el.id));
		timers.set(
			el.id,
			setTimeout(() => {
				const url = el.dataset.liveUrl;
				if (isBusy(el) || !url || !window.htmx) {
					// 入力中は差し替えない
					showStale(el);
					return;
				}
				refreshing.add(el.id);
				window.htmx.ajax("GET", url, { target: `#${el.id}`, swap: "outerHTML" });
			}, 300),
		);
	}

	// ---- 閲覧中・編集中 ----
	function renderPresence() {
		const others = lastUsers.filter((u) => u.userId !== userId);
		const el = document.querySelector("[data-presence]");
		if (el)
			el.textContent = others.length > 0 ? `閲覧中: ${others.map((u) => u.name).join("、")}` : "";
		for (const target of document.querySelectorAll("[data-editing-target]")) {
			const editors = others.filter(
				(u) => u.editing && `${u.editing.entity}:${u.editing.id}` === target.dataset.editingTarget,
			);
			target.textContent =
				editors.length > 0 ? `${editors.map((u) => u.name).join("、")}さんが編集中` : "";
		}
	}

	function sendEditing() {
		const form = document.querySelector("[data-editing-entity]");
		const editing = form
			? { entity: form.dataset.editingEntity, id: form.dataset.editingId }
			: null;
		const key = JSON.stringify(editing);
		if (key === editingSent || !ws || ws.readyState !== WebSocket.OPEN) return;
		editingSent = key;
		ws.send(
			JSON.stringify({ type: "editing", entity: editing?.entity ?? null, id: editing?.id ?? null }),
		);
	}

	document.addEventListener("htmx:afterSettle", () => {
		sendEditing();
		renderPresence();
		updateOnline();
	});

	// ---- コピーボタン（招待リンク） ----
	document.addEventListener("click", (e) => {
		const button = e.target instanceof Element ? e.target.closest("[data-copy]") : null;
		if (!button) return;
		const input = document.querySelector(button.dataset.copy);
		if (!input || !navigator.clipboard) return;
		navigator.clipboard
			.writeText(input.value)
			.then(() => {
				button.textContent = "コピーしました";
				return undefined;
			})
			.catch(() => undefined);
	});

	connect();
})();
