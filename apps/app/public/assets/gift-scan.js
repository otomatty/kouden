// 写真で登録（docs/rebuild/08-gift-entry-ux.md 案 D、ADR-T16）。
// - カメラを開いたまま香典袋を 1 枚ずつ映す。袋を置いて映像が止まったら自動で撮る（「撮る」でも撮れる）
// - 撮った写真は順に読み取りの API に送り（2 枚ずつ同時に）、読み取りを待たずに次を撮れる
// - 読み取った内容は下書きに入る。写真と見比べて直してから登録する（表で入力と同じ API）
// - 写真はこの画面のメモリにだけ置き、登録するか捨てると消す。サーバーには保存しない
// CSP のため eval・インラインのイベントハンドラは使わない。
(() => {
	const root = document.querySelector("[data-gift-scan]");
	const template = document.querySelector("template[data-draft-template]");
	const list = document.querySelector("[data-drafts]");
	if (!root || !template || !list) return;
	const { readUrl, saveUrl, giftUrl, summaryUrl, eventId } = root.dataset;
	const video = root.querySelector("video");
	const viewer = root.querySelector("[data-scan-viewer]");
	const flash = root.querySelector("[data-scan-flash]");
	const message = root.querySelector("[data-scan-message]");
	const startButton = root.querySelector("[data-scan-start]");
	const stopButton = root.querySelector("[data-scan-stop]");
	const shootButton = root.querySelector("[data-scan-shoot]");
	const autoLabel = root.querySelector("[data-scan-auto-label]");
	const autoBox = root.querySelector("[data-scan-auto]");
	const fileInput = root.querySelector("[data-scan-files]");
	const countEl = document.querySelector("[data-draft-count]");
	const readingEl = document.querySelector("[data-reading-count]");
	const emptyEl = document.querySelector("[data-drafts-empty]");
	const saveAllButton = document.querySelector("[data-drafts-save-all]");

	const FIELDS = ["name", "nameKana", "organization", "amount", "postalCode", "address"];
	/** 送る写真の長い辺（読み取りに足りる大きさにして、送る量を減らす） */
	const MAX_SIDE = 1600;
	/** 同時に読み取る枚数 */
	const CONCURRENCY = 2;

	let stream = null;
	let shots = 0;
	/** 下書きごとの写真（Blob）と状態。キーは下書きの data-key */
	const drafts = new Map();

	function announce(text) {
		const status = document.getElementById("sr-status");
		if (status) status.textContent = text;
	}

	function say(text) {
		if (message) message.textContent = text;
	}

	function refreshCounts() {
		const open = [...drafts.values()].filter((d) => d.state !== "saved");
		const reading = open.filter((d) => d.state === "queued" || d.state === "reading").length;
		countEl.textContent = String(open.length);
		readingEl.textContent = reading > 0 ? `（読み取り中 ${reading} 枚）` : "";
		emptyEl.hidden = drafts.size > 0;
		saveAllButton.hidden = open.filter((d) => d.state === "ready").length < 2;
	}

	// ---- カメラ ----
	async function startCamera() {
		if (!navigator.mediaDevices?.getUserMedia) {
			say("この端末・ブラウザではカメラを使えません。「写真を選ぶ」から撮ってください。");
			return;
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: { ideal: "environment" },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});
		} catch {
			say(
				"カメラを使えませんでした。ブラウザの設定でカメラを許可するか、「写真を選ぶ」から撮ってください。",
			);
			return;
		}
		video.srcObject = stream;
		await video.play().catch(() => {});
		viewer.hidden = false;
		startButton.hidden = true;
		stopButton.hidden = false;
		shootButton.hidden = false;
		autoLabel.hidden = false;
		say("香典袋を枠に合わせてください。止まると自動で撮ります。");
		watch.start();
		shootButton.focus();
	}

	function stopCamera() {
		for (const track of stream?.getTracks() ?? []) track.stop();
		stream = null;
		video.srcObject = null;
		watch.stop();
		viewer.hidden = true;
		startButton.hidden = false;
		stopButton.hidden = true;
		shootButton.hidden = true;
		autoLabel.hidden = true;
	}

	startButton.addEventListener("click", () => void startCamera());
	stopButton.addEventListener("click", () => {
		stopCamera();
		say("");
		startButton.focus();
	});
	shootButton.addEventListener("click", () => void shoot(false));
	// 画面を離れたらカメラを止める（電池と、映し続けないため）
	document.addEventListener("visibilitychange", () => {
		if (document.hidden && stream) {
			stopCamera();
			say("画面を離れたので、カメラを止めました。");
		}
	});

	// ---- 自動シャッター ----
	// 映像を小さな濃淡の画像（64×48）にして、前の映像との差を見る。差が小さい状態が続いたら
	// （袋を置いて手ぶれが止まったら）撮る。撮った後は、映像が大きく変わる（次の袋に替える）まで撮らない。
	// 濃淡がほとんどない映像（何も映っていない）では撮らない。AI は使わず、端末の中だけで見る
	const watch = (() => {
		const W = 64;
		const H = 48;
		/** 止まっているとみなす差（画素の濃さの平均の差、0〜255） */
		const STILL = 4;
		/** 次の袋に替えたとみなす差 */
		const MOVED = 14;
		/** 止まっている状態がこの回数（× 200ms）続いたら撮る */
		const STILL_TICKS = 4;
		/** 何かが映っているとみなす濃淡のばらつき */
		const MIN_CONTRAST = 18;
		const canvas = document.createElement("canvas");
		canvas.width = W;
		canvas.height = H;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		let previous = null;
		let stillTicks = 0;
		// カメラを始めた直後の映像（机など）は撮らない。一度大きく動いてから撮る
		let armed = false;
		let timer = 0;

		function tick() {
			if (!stream || video.readyState < 2 || !ctx) return;
			ctx.drawImage(video, 0, 0, W, H);
			const { data } = ctx.getImageData(0, 0, W, H);
			const gray = new Float32Array(W * H);
			let sum = 0;
			for (let i = 0; i < gray.length; i++) {
				const v = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
				gray[i] = v;
				sum += v;
			}
			const mean = sum / gray.length;
			let variance = 0;
			let diff = 0;
			for (let i = 0; i < gray.length; i++) {
				variance += (gray[i] - mean) ** 2;
				if (previous) diff += Math.abs(gray[i] - previous[i]);
			}
			const contrast = Math.sqrt(variance / gray.length);
			diff = previous ? diff / gray.length : Number.POSITIVE_INFINITY;
			previous = gray;
			if (diff >= MOVED && Number.isFinite(diff)) armed = true;
			stillTicks = diff < STILL ? stillTicks + 1 : 0;
			if (autoBox.checked && armed && stillTicks >= STILL_TICKS && contrast >= MIN_CONTRAST) {
				armed = false;
				stillTicks = 0;
				void shoot(true);
			}
		}

		return {
			start() {
				previous = null;
				stillTicks = 0;
				armed = false;
				timer = window.setInterval(tick, 200);
			},
			stop() {
				window.clearInterval(timer);
			},
		};
	})();

	// ---- 撮る・写真を選ぶ ----
	/** 映像・写真を長い辺 MAX_SIDE の JPEG にする */
	function toJpeg(source, width, height) {
		const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(width * scale);
		canvas.height = Math.round(height * scale);
		canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
		return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
	}

	async function shoot(auto) {
		if (!stream || !video.videoWidth) return;
		const blob = await toJpeg(video, video.videoWidth, video.videoHeight);
		if (!blob) return;
		flash.classList.add("opacity-70");
		window.setTimeout(() => flash.classList.remove("opacity-70"), 150);
		navigator.vibrate?.(30);
		addDraft(blob, auto);
		say(`${shots} 枚目を撮りました。次の袋を映してください。`);
	}

	fileInput.addEventListener("change", async () => {
		const files = [...(fileInput.files ?? [])];
		fileInput.value = "";
		for (const file of files) {
			try {
				const bitmap = await createImageBitmap(file);
				const blob = await toJpeg(bitmap, bitmap.width, bitmap.height);
				bitmap.close();
				if (blob) addDraft(blob, false);
			} catch {
				say(`「${file.name}」は写真として読めませんでした。`);
			}
		}
		if (files.length > 0) say(`${files.length} 枚の写真を下書きに足しました。`);
	});

	// ---- 下書き ----
	function field(card, name) {
		return card.querySelector(`[data-field="${name}"]`);
	}

	function setStatus(card, text, isError = false) {
		const el = card.querySelector("[data-draft-status]");
		el.textContent = text;
		el.classList.toggle("text-danger", isError);
		el.classList.toggle("text-muted", !isError);
	}

	function addDraft(blob, auto) {
		shots++;
		const key = `d${shots}`;
		const html = template.innerHTML.replaceAll("__KEY__", key);
		const holder = document.createElement("template");
		holder.innerHTML = html.trim();
		const card = holder.content.firstElementChild;
		card.dataset.key = key;
		card.querySelector("[data-draft-title]").textContent = `${shots} 枚目`;
		const photo = card.querySelector("[data-draft-photo]");
		const url = URL.createObjectURL(blob);
		photo.src = url;
		photo.alt = `撮った写真（${shots} 枚目）`;
		list.append(card);
		drafts.set(key, { card, blob, url, auto, state: "queued", requestId: crypto.randomUUID() });
		setStatus(card, "読み取りを待っています…");
		queue.push(key);
		refreshCounts();
		pump();
	}

	function discard(key) {
		const draft = drafts.get(key);
		if (!draft) return;
		URL.revokeObjectURL(draft.url);
		draft.card.remove();
		drafts.delete(key);
		refreshCounts();
	}

	// ---- 読み取り（裏で順に。待たずに次を撮れる） ----
	const queue = [];
	let active = 0;

	function pump() {
		while (active < CONCURRENCY && queue.length > 0) {
			const key = queue.shift();
			const draft = drafts.get(key);
			if (!draft) continue;
			active++;
			void read(key, draft).finally(() => {
				active--;
				refreshCounts();
				pump();
			});
		}
	}

	async function read(key, draft) {
		draft.state = "reading";
		setStatus(draft.card, "読み取っています…");
		refreshCounts();
		let data = null;
		try {
			const res = await fetch(readUrl, {
				method: "POST",
				headers: { "Content-Type": draft.blob.type, Accept: "application/json" },
				body: draft.blob,
			});
			if (res.ok) data = await res.json();
		} catch {
			data = null;
		}
		if (!drafts.has(key)) return;
		if (!data?.draft) {
			draft.state = "failed";
			setStatus(
				draft.card,
				"読み取れませんでした。もう一度読み取るか、写真を見て入力してください",
				true,
			);
			draft.card.querySelector("[data-draft-retry]").hidden = false;
			draft.card.querySelector("[data-draft-save]").disabled = false;
			return;
		}
		const values = data.draft;
		const empty = FIELDS.every((f) => !values[f]);
		// 自動で撮った写真に文字がなければ（机などを撮った）、下書きにしない
		if (empty && draft.auto) {
			discard(key);
			say("読み取れる文字がなかったので、撮った写真を捨てました。");
			return;
		}
		for (const name of FIELDS) {
			const input = field(draft.card, name);
			// 読み取りを待つ間に入力した欄は書き換えない
			if (input && !input.dataset.touched && values[name]) input.value = values[name];
		}
		draft.state = "ready";
		draft.card.querySelector("[data-draft-retry]").hidden = true;
		draft.card.querySelector("[data-draft-save]").disabled = false;
		setStatus(
			draft.card,
			empty
				? "読み取れる文字がありませんでした。写真を見て入力してください"
				: "読み取りました。写真と見比べて確かめてください",
			empty,
		);
	}

	list.addEventListener("input", (e) => {
		if (e.target instanceof HTMLInputElement) e.target.dataset.touched = "1";
	});

	list.addEventListener("click", (e) => {
		const button = e.target instanceof Element ? e.target.closest("button") : null;
		const card = button?.closest("[data-draft]");
		if (!button || !card) return;
		const key = card.dataset.key;
		if (button.matches("[data-draft-save]")) void save([key]);
		else if (button.matches("[data-draft-discard]")) {
			if (drafts.get(key)?.state === "saving") return;
			const next = card.nextElementSibling ?? card.previousElementSibling;
			discard(key);
			announce("下書きを捨てました。");
			(next?.querySelector("input") ?? startButton).focus();
		} else if (button.matches("[data-draft-retry]")) {
			const draft = drafts.get(key);
			if (!draft) return;
			button.hidden = true;
			draft.state = "queued";
			queue.push(key);
			refreshCounts();
			pump();
		}
	});

	saveAllButton.addEventListener("click", () => {
		const keys = [...drafts.entries()].filter(([, d]) => d.state === "ready").map(([k]) => k);
		void save(keys);
	});

	// ---- 登録（表で入力と同じ API。1 回ずつ順に送り、番号を下書きの順に振る） ----
	let saving = Promise.resolve();

	function save(keys) {
		saving = saving.then(() => send(keys));
		return saving;
	}

	/** 登録中は直せない・捨てられないようにする（送った後の変更は保存されず、捨てても登録されてしまう） */
	function lockFields(card, locked) {
		for (const input of card.querySelectorAll("[data-field]")) input.readOnly = locked;
		const discardButton = card.querySelector("[data-draft-discard]");
		if (discardButton) discardButton.disabled = locked;
	}

	function clearErrors(card) {
		for (const el of card.querySelectorAll('[aria-invalid="true"]')) {
			el.removeAttribute("aria-invalid");
			el.removeAttribute("aria-describedby");
		}
	}

	async function send(keys) {
		const targets = keys
			.map((key) => [key, drafts.get(key)])
			.filter(([, d]) => d && d.state !== "saved" && d.state !== "saving");
		if (targets.length === 0) return;
		for (const [, draft] of targets) {
			draft.state = "saving";
			draft.card.querySelector("[data-draft-save]").disabled = true;
			lockFields(draft.card, true);
			setStatus(draft.card, "登録しています…");
		}
		const rows = targets.map(([key, draft]) => {
			// 送り直しても同じ値を送る（応答が届かずに送り直しても二重に登録しない）
			const row = { key, requestId: draft.requestId, relationshipId: "" };
			for (const name of FIELDS) row[name] = field(draft.card, name)?.value ?? "";
			return row;
		});
		let data = null;
		try {
			const res = await fetch(saveUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ eventId, rows }),
			});
			if (res.ok) data = await res.json();
		} catch {
			data = null;
		}
		let saved = 0;
		let failed = 0;
		for (const [key, draft] of targets) {
			const result = data?.rows?.find((r) => r.key === key);
			if (result?.status === "saved") {
				markSaved(draft, result);
				saved++;
				continue;
			}
			failed++;
			draft.state = "ready";
			draft.card.querySelector("[data-draft-save]").disabled = false;
			lockFields(draft.card, false);
			clearErrors(draft.card);
			if (result?.status === "invalid") {
				const statusId = draft.card.querySelector("[data-draft-status]").id;
				for (const name of Object.keys(result.errors)) {
					const input = field(draft.card, FIELDS.includes(name) ? name : "name");
					input?.setAttribute("aria-invalid", "true");
					input?.setAttribute("aria-describedby", statusId);
				}
				setStatus(
					draft.card,
					Object.values(result.errors)[0] ?? "入力内容を確かめてください",
					true,
				);
			} else if (result?.status === "skipped") {
				setStatus(draft.card, "氏名か団体名と、金額を入力してください", true);
			} else {
				setStatus(
					draft.card,
					result?.message ?? "登録できませんでした。通信を確かめて、もう一度登録してください",
					true,
				);
			}
		}
		refreshCounts();
		const parts = [];
		if (saved > 0) parts.push(`${saved} 件を登録しました。香典袋に番号を書いてください。`);
		if (failed > 0)
			parts.push(`${failed} 件は登録できませんでした。下書きの表示を確かめてください。`);
		if (parts.length > 0) announce(parts.join(""));
		if (saved > 0 && summaryUrl && window.htmx) {
			window.htmx.ajax("GET", summaryUrl, { target: "#entry-summary", swap: "outerHTML" });
		}
	}

	/** 登録した下書きは、写真を消して番号を大きく出す（香典袋に書き写す） */
	function markSaved(draft, result) {
		draft.state = "saved";
		URL.revokeObjectURL(draft.url);
		draft.blob = null;
		const card = draft.card;
		// 保存した形（「1万」→「10,000」など）で出す
		const values = result.values ?? {};
		const name = values.name || field(card, "organization").value;
		const amount = values.amount;
		card.replaceChildren();
		card.classList.add("bg-paper");
		const no = document.createElement("p");
		no.className = "text-3xl font-semibold tabular-nums";
		no.textContent = result.receiptNo !== null ? `No.${result.receiptNo}` : "登録しました";
		const text = document.createElement("p");
		text.className = "text-sm";
		text.textContent = `${name} 様${amount ? `、香典 ¥${amount}` : ""}を登録しました。香典袋に番号を書いてください。`;
		const link = document.createElement("a");
		link.href = `${giftUrl}${result.giftId}`;
		link.className = "text-sm text-accent underline underline-offset-4";
		link.textContent = "登録した内容を直す";
		card.append(no, text, link);
	}

	// 登録していない下書きがあるまま閉じない（写真は保存していないので、閉じると消える）
	window.addEventListener("beforeunload", (e) => {
		if ([...drafts.values()].some((d) => d.state !== "saved")) {
			e.preventDefault();
			e.returnValue = "";
		}
	});

	refreshCounts();
})();
