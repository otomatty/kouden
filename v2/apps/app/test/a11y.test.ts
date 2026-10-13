import { describe, expect, it } from "vitest";
import { formPost, makeApp, TARO } from "./helpers.ts";

/** ログインして香典帳を 1 冊作り、その ID と、受付で使う行事の ID を返す */
async function setup() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎", title: "" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const reception = await (await taro.request(`/k/${koudenId}/reception`)).text();
	const eventId = /name="eventId" value="([^"]+)"/.exec(reception)?.[1] ?? "";
	return { taro, koudenId, eventId };
}

/** 読み上げ領域（SrStatus）を out-of-band で差し替える要素の中身 */
const srStatusOob = (html: string) =>
	/<p id="sr-status" role="status" class="sr-only" hx-swap-oob="innerHTML">([^<]*)<\/p>/.exec(
		html,
	)?.[1];

describe("読み上げとフォーカス（02 非機能要件: アクセシビリティ）", () => {
	it("香典帳の画面には、最初から空の読み上げ領域がある", async () => {
		const { taro, koudenId } = await setup();
		const html = await (await taro.request(`/k/${koudenId}/reception`)).text();
		expect(html).toContain('<p id="sr-status" role="status" class="sr-only"></p>');
	});

	it("受付で登録すると、受付番号と差出人を読み上げ領域に入れる", async () => {
		const { taro, koudenId, eventId } = await setup();
		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "佐藤 一郎", amount: "10000" }, { htmx: true }),
		);
		expect(res.status).toBe(200);
		expect(srStatusOob(await res.text())).toBe(
			"登録しました。通夜 の受付番号 1、佐藤 一郎 様、香典 ¥10,000。",
		);
	});

	it("差出人の候補の件数を読み上げ領域に入れ、検索語がなければ空にする", async () => {
		const { taro, koudenId, eventId } = await setup();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "佐藤 一郎", amount: "10000" }),
		);
		const found = await (
			await taro.request(`/k/${koudenId}/persons/candidates?name=${encodeURIComponent("佐藤")}`)
		).text();
		expect(srStatusOob(found)).toBe("同じ人の候補が 1 件あります。");
		const none = await (
			await taro.request(`/k/${koudenId}/persons/candidates?name=${encodeURIComponent("鈴木")}`)
		).text();
		expect(srStatusOob(none)).toBe("");
		const empty = await (await taro.request(`/k/${koudenId}/persons/candidates?name=`)).text();
		expect(srStatusOob(empty)).toBe("");
	});

	it("入力エラーがあるときは autofocus を付けない（最初のエラーの欄へ app.js が移す）", async () => {
		const { taro, koudenId, eventId } = await setup();
		const ok = await (await taro.request(`/k/${koudenId}/reception`)).text();
		expect(ok).toMatch(/<input[^>]*name="name"[^>]*autofocus/);

		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "佐藤 一郎", amount: "" }, { htmx: true }),
		);
		expect(res.status).toBe(422);
		const html = await res.text();
		expect(html).toMatch(/<input[^>]*name="amount"[^>]*aria-invalid="true"/);
		expect(html).not.toContain("autofocus");
	});

	it("差出人の行の編集を閉じると、その行の「編集」にフォーカスを戻す", async () => {
		const { taro, koudenId, eventId } = await setup();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "佐藤 一郎", amount: "10000" }),
		);
		const list = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const personId = /id="person-([0-9a-f-]{36})"/.exec(list)?.[1] ?? "";
		// 一覧を開いたときは、どの行の「編集」にもフォーカスを当てない
		expect(list).not.toMatch(/aria-label="佐藤 一郎 を編集"[^>]*autofocus/);

		const row = await (
			await taro.request(`/k/${koudenId}/persons/${personId}/row`, {
				headers: { "hx-request": "true" },
			})
		).text();
		expect(row).toMatch(
			/autofocus[^>]*aria-label="佐藤 一郎 を編集"|aria-label="佐藤 一郎 を編集"[^>]*autofocus/,
		);

		const saved = await (
			await taro.request(
				`/k/${koudenId}/persons/${personId}`,
				formPost({ version: "1", mode: "row", go: "stay", name: "佐藤 一郎" }, { htmx: true }),
			)
		).text();
		expect(saved).toContain("autofocus");
		expect(srStatusOob(saved)).toBe("佐藤 一郎 を保存しました。");
	});

	it("必須の項目のラベルは「（必須）」と読み上げられる", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const html = await (await taro.request("/k/new")).text();
		expect(html).toContain(
			'<span class="ml-1 text-xs text-danger" aria-hidden="true">必須</span><span class="sr-only">（必須）</span>',
		);
	});
});
