// 表で入力（docs/rebuild/08-gift-entry-ux.md 案 C、ADR-P19）。PC だけで使う。
// - Tab で右の欄（ブラウザの標準）、Enter で次の行の氏名、↑↓ で同じ列の上下の行へ移る
// - 行を離れたら、その行を保存する。貼り付け（Excel などの表）は、入れた行をまとめて保存する
// - 保存は 1 回ずつ順に送る（保存を待つ間にもう一度送って、新しい行を二重に作らないように）
// CSP のため eval・インラインのイベントハンドラは使わない。
(() => {
	const table = document.querySelector("table[data-gift-sheet]");
	const template = document.querySelector("template[data-sheet-row]");
	if (!table || !template) return;
	const tbody = table.tBodies[0];
	const { endpoint, eventId, summaryUrl } = table.dataset;
	const COLUMNS = ["name", "nameKana", "amount", "postalCode", "address", "relationshipId"];
	/** 1 回に送る行の数（サーバーの上限と同じ） */
	const MAX_ROWS = 200;
	let nextKey = 0;

	const editableRows = () => [...tbody.querySelectorAll('tr[data-row][data-editable="1"]')];
	function cellOf(row, col) {
		return row.querySelector(`[data-col="${col}"]`);
	}

	function announce(text) {
		const status = document.getElementById("sr-status");
		if (status) status.textContent = text;
	}

	/** 欄の読み上げ名（「氏名（番号 12）」「氏名（3 行目）」）を、行の位置と番号に合わせる */
	function relabel() {
		editableRows().forEach((row, i) => {
			const where = row.dataset.no ? `番号 ${row.dataset.no}` : `${i + 1} 行目`;
			for (const el of row.querySelectorAll("[data-col]")) {
				el.setAttribute("aria-label", `${el.dataset.label}（${where}）`);
			}
		});
	}

	function addRow() {
		const row = template.content.firstElementChild.cloneNode(true);
		row.dataset.key = `added-${nextKey++}`;
		row.querySelector("[data-status]").id = `sheet-status-${row.dataset.key}`;
		tbody.append(row);
		relabel();
		return row;
	}

	function setStatus(row, text, isError = false) {
		const cell = row.querySelector("[data-status]");
		if (!cell) return;
		cell.textContent = text;
		cell.classList.toggle("text-danger", isError);
	}

	function clearErrors(row) {
		for (const el of row.querySelectorAll('[aria-invalid="true"]')) {
			el.removeAttribute("aria-invalid");
			el.removeAttribute("aria-describedby");
		}
	}

	// ---- キーボードでの移動 ----
	tbody.addEventListener("keydown", (e) => {
		const el = e.target;
		if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || !el.dataset.col)
			return;
		// かな漢字変換の確定・候補の選択（Enter・↑↓）では移らない
		if (e.isComposing || e.keyCode === 229 || e.altKey || e.ctrlKey || e.metaKey) return;
		const rows = editableRows();
		const i = rows.indexOf(el.closest("tr"));
		if (e.key === "Enter") {
			e.preventDefault();
			const next = rows[i + 1] ?? addRow();
			cellOf(next, "name").focus();
		} else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && el instanceof HTMLInputElement) {
			const target = rows[i + (e.key === "ArrowDown" ? 1 : -1)];
			if (!target) return;
			e.preventDefault();
			cellOf(target, el.dataset.col).focus();
		}
	});

	document.querySelector("[data-sheet-add]")?.addEventListener("click", () => {
		cellOf(addRow(), "name").focus();
	});

	// ---- 変更と保存 ----
	function markDirty(e) {
		const row = e.target instanceof Element ? e.target.closest("tr[data-row]") : null;
		if (row) row.dataset.dirty = "1";
	}
	tbody.addEventListener("input", markDirty);
	tbody.addEventListener("change", markDirty);

	// 行を離れたら保存する（同じ行の中での移動・郵便番号からの住所の入力では保存しない）
	tbody.addEventListener("focusout", (e) => {
		const row = e.target instanceof Element ? e.target.closest("tr[data-row]") : null;
		if (!row || (e.relatedTarget instanceof Node && row.contains(e.relatedTarget))) return;
		if (row.dataset.dirty) enqueue([row]);
	});

	const queue = new Set();
	let inflight = false;

	function enqueue(rows) {
		for (const row of rows) if (row.dataset.dirty) queue.add(row);
		void flush();
	}

	function payloadOf(row) {
		const data = { key: row.dataset.key };
		for (const col of COLUMNS) data[col] = cellOf(row, col)?.value ?? "";
		if (row.dataset.giftId) {
			data.giftId = row.dataset.giftId;
			data.giftVersion = Number(row.dataset.giftVersion);
			data.personId = row.dataset.personId;
			data.personVersion = Number(row.dataset.personVersion);
		} else {
			// 新しい行は、送り直しても同じ値を送る（応答が届かずに送り直しても二重に登録しない）
			row.dataset.requestId ||= crypto.randomUUID();
			data.requestId = row.dataset.requestId;
		}
		return data;
	}

	async function flush() {
		if (inflight || queue.size === 0) return;
		const rows = [...queue].slice(0, MAX_ROWS);
		for (const row of rows) {
			queue.delete(row);
			// 送った後にまた入力したら、もう一度保存する（応答の処理で消さない）
			delete row.dataset.dirty;
			setStatus(row, "保存しています…");
		}
		inflight = true;
		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ eventId, rows: rows.map(payloadOf) }),
			});
			if (!res.ok) throw new Error(`sheet: ${res.status}`);
			const data = await res.json();
			let saved = 0;
			let failed = 0;
			for (const result of data.rows) {
				const row = rows.find((r) => r.dataset.key === result.key);
				if (!row) continue;
				if (apply(row, result)) saved++;
				else if (result.status !== "skipped") failed++;
			}
			relabel();
			if (saved > 0 || failed > 0) {
				announce(
					`${saved > 0 ? `${saved} 行を保存しました。` : ""}${
						failed > 0 ? `${failed} 行は保存できませんでした。状態の欄を確かめてください。` : ""
					}`,
				);
			}
			if (saved > 0 && summaryUrl && window.htmx) {
				window.htmx.ajax("GET", summaryUrl, { target: "#entry-summary", swap: "outerHTML" });
			}
		} catch {
			for (const row of rows) {
				row.dataset.dirty = "1";
				setStatus(
					row,
					"保存できませんでした。通信を確かめてから、もう一度この行を離れてください",
					true,
				);
			}
			announce("保存できませんでした。通信を確かめてください。");
		} finally {
			inflight = false;
			if (queue.size > 0) void flush();
		}
	}

	/** 保存の結果を行に入れる。保存できたら true */
	function apply(row, result) {
		clearErrors(row);
		if (result.status === "saved") {
			row.dataset.giftId = result.giftId;
			row.dataset.giftVersion = String(result.giftVersion);
			row.dataset.personId = result.personId;
			row.dataset.personVersion = String(result.personVersion);
			if (result.receiptNo !== null) {
				row.dataset.no = String(result.receiptNo);
				row.querySelector("[data-no]").textContent = String(result.receiptNo);
			}
			// 保存した形（「1万」→「10,000」など）にそろえる。応答を待つ間に入力し直した行・入力中の欄は書き換えない
			if (!row.dataset.dirty) {
				for (const [col, value] of Object.entries(result.values ?? {})) {
					const el = cellOf(row, col);
					if (el && el !== document.activeElement) el.value = value;
				}
			}
			setStatus(row, "保存しました");
			return true;
		}
		if (result.status === "skipped") {
			setStatus(row, "");
			return false;
		}
		row.dataset.dirty = "1";
		if (result.status === "invalid") {
			const statusId = row.querySelector("[data-status]")?.id;
			for (const field of Object.keys(result.errors)) {
				const el = cellOf(row, COLUMNS.includes(field) ? field : "name");
				el?.setAttribute("aria-invalid", "true");
				if (statusId) el?.setAttribute("aria-describedby", statusId);
			}
			setStatus(row, Object.values(result.errors)[0] ?? "入力内容を確かめてください", true);
		} else {
			setStatus(row, result.message, true);
		}
		return false;
	}

	// 通信が戻ったら、保存できていない行を送り直す
	window.addEventListener("online", () => enqueue(editableRows()));

	// 保存していない行があるまま閉じない
	window.addEventListener("beforeunload", (e) => {
		if (inflight || queue.size > 0 || editableRows().some((r) => r.dataset.dirty)) {
			e.preventDefault();
			e.returnValue = "";
		}
	});

	// ---- 貼り付け ----
	/** Excel・スプレッドシートからコピーした表（タブ区切り。"" で囲んだセルの中の改行・タブに対応） */
	function parseTsv(text) {
		const rows = [];
		let row = [];
		let cell = "";
		let quoted = false;
		const s = text.replace(/\r\n?/g, "\n");
		for (let i = 0; i < s.length; i++) {
			const ch = s[i];
			if (quoted) {
				if (ch === '"' && s[i + 1] === '"') {
					cell += '"';
					i++;
				} else if (ch === '"') {
					quoted = false;
				} else {
					cell += ch;
				}
			} else if (ch === '"' && cell === "") {
				quoted = true;
			} else if (ch === "\t") {
				row.push(cell);
				cell = "";
			} else if (ch === "\n") {
				row.push(cell);
				rows.push(row);
				row = [];
				cell = "";
			} else {
				cell += ch;
			}
		}
		if (cell !== "" || row.length > 0) {
			row.push(cell);
			rows.push(row);
		}
		return rows;
	}

	function setCell(row, col, value) {
		const el = cellOf(row, col);
		if (!el) return;
		const text = value.trim();
		if (el instanceof HTMLSelectElement) {
			// 関係は名前で選ぶ（見つからなければ変えない）
			const option = [...el.options].find(
				(o) => o.text === text || (text === "" && o.value === ""),
			);
			if (option) el.value = option.value;
		} else {
			el.value = text;
		}
	}

	tbody.addEventListener("paste", (e) => {
		const el = e.target;
		if (!(el instanceof HTMLInputElement) || !el.dataset.col) return;
		const grid = parseTsv(e.clipboardData?.getData("text/plain") ?? "");
		// 1 つのセルだけなら、普通の貼り付け
		if (grid.length <= 1 && (grid[0]?.length ?? 0) <= 1) return;
		e.preventDefault();
		let rows = editableRows();
		const start = rows.indexOf(el.closest("tr"));
		const firstColumn = COLUMNS.indexOf(el.dataset.col);
		const touched = [];
		grid.forEach((cells, k) => {
			let row = rows[start + k];
			if (!row) {
				row = addRow();
				rows = editableRows();
			}
			cells.forEach((value, j) => {
				const col = COLUMNS[firstColumn + j];
				if (col) setCell(row, col, value);
			});
			row.dataset.dirty = "1";
			touched.push(row);
		});
		announce(`${touched.length} 行を貼り付けました。保存しています。`);
		enqueue(touched);
	});

	relabel();
})();
