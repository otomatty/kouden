import { formatYen, joinNotes, personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { PersonDetail, PersonView } from "../../ledger/types.ts";
import { Field, Hidden, Input, ui } from "@kouden/ui";

/**
 * 差出人の統合（E5-2）。同じ人が 2 人に分かれて登録されたとき、1 人にまとめる。
 * 選ぶ画面（候補と検索）→ 確かめる画面（2 人と、まとめた後を並べる）→ まとめる
 */

/** 比べる項目（差出人の画面と同じ順） */
const FIELDS = [
	["name", "氏名"],
	["nameKana", "ふりがな"],
	["organization", "団体名"],
	["position", "役職"],
	["relationshipName", "関係"],
	["postalCode", "郵便番号"],
	["address", "住所"],
	["phone", "電話番号"],
	["notes", "備考"],
] as const;

type FieldKey = (typeof FIELDS)[number][0];

/** まとめた後の値（ledger の mergePersons と同じ決め方: 残す側の空いている欄を埋め、備考はつなげる） */
function mergedValue(key: FieldKey, into: PersonView, from: PersonView): string | null {
	if (key === "notes") return joinNotes(into.notes, from.notes);
	return into[key] ?? from[key];
}

const rowHeader = `${ui.td} text-left font-normal whitespace-nowrap text-muted`;

const giftSummary = (p: PersonView) => `${p.giftCount} 件・香典 ${formatYen(p.kodenTotal)}`;

/** まとめる相手を選ぶ。同じ名前・ふりがなの候補と、検索の結果を出す */
export const PersonMergeChoosePage: FC<{
	kouden: KoudenContext;
	into: PersonDetail;
	candidates: PersonView[];
	results: PersonView[] | undefined;
	q: string | undefined;
}> = ({ kouden, into, candidates, results, q }) => {
	const base = `/k/${kouden.id}`;
	const choose = (p: PersonView) => `${base}/persons/${into.id}/merge?from=${p.id}`;
	return (
		<div class="mx-auto max-w-3xl space-y-6">
			<h2 class={ui.h2}>{personLabel(into)} とまとめる差出人を選ぶ</h2>
			<p class="text-sm text-muted">
				同じ人が 2 人に分かれて登録されているときに、1
				人にまとめます。選んだ差出人のいただきもの・香典返しは
				{personLabel(into)}{" "}
				に移り、選んだ差出人は一覧から消えます。次の画面で内容を確かめてからまとめます。
			</p>

			<section aria-labelledby="merge-candidates" class="space-y-3">
				<h3 id="merge-candidates" class={ui.h3}>
					同じ人かもしれない差出人
				</h3>
				{candidates.length > 0 ? (
					<PersonChoices persons={candidates} href={choose} />
				) : (
					<p class="text-sm text-muted">名前・ふりがなが同じ差出人はいません。</p>
				)}
			</section>

			<section aria-labelledby="merge-search" class="space-y-3">
				<h3 id="merge-search" class={ui.h3}>
					ほかの差出人を探す
				</h3>
				<form
					method="get"
					action={`${base}/persons/${into.id}/merge`}
					role="search"
					class="flex flex-wrap items-end gap-2"
				>
					<Field label="氏名・カナ・団体・住所で検索" name="q" class="min-w-60 flex-1">
						<Input name="q" values={{ q }} type="search" inputmode="search" />
					</Field>
					<button type="submit" class={ui.buttonSecondary}>
						検索
					</button>
				</form>
				{results !== undefined &&
					(results.length > 0 ? (
						<PersonChoices persons={results} href={choose} />
					) : (
						<p role="status" class="text-sm text-muted">
							「{q}」に一致する差出人はいません。
						</p>
					))}
			</section>

			<p>
				<a href={`${base}/persons/${into.id}`} class={ui.link}>
					← {personLabel(into)} に戻る
				</a>
			</p>
		</div>
	);
};

const PersonChoices: FC<{ persons: PersonView[]; href: (p: PersonView) => string }> = ({
	persons,
	href,
}) => (
	<ul class="divide-y divide-line rounded-xl border border-line bg-surface">
		{persons.map((p) => (
			<li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
				<div class="min-w-0 flex-1">
					<p class="font-medium">{personLabel(p)}</p>
					<p class="text-xs text-muted">
						{[p.nameKana, p.address, giftSummary(p)].filter(Boolean).join("・")}
					</p>
				</div>
				<a href={href(p)} class={ui.buttonSmall} aria-label={`${personLabel(p)} を選ぶ`}>
					選ぶ
				</a>
			</li>
		))}
	</ul>
);

/** 2 人と、まとめた後を並べて確かめる */
export const PersonMergeConfirmPage: FC<{
	kouden: KoudenContext;
	into: PersonDetail;
	from: PersonDetail;
	message?: string | undefined;
}> = ({ kouden, into, from, message }) => {
	const base = `/k/${kouden.id}`;
	const bothReturns = into.ret !== null && from.ret !== null;
	const giftIds = new Set([...into.gifts, ...from.gifts].map((g) => g.id));
	const intoLabel = personLabel(into);
	const fromLabel = personLabel(from);
	return (
		<div class="space-y-6">
			<h2 class={ui.h2}>差出人をまとめる</h2>
			<p class="text-sm">
				<strong>{fromLabel}</strong> を <strong>{intoLabel}</strong> にまとめます。
				{fromLabel} のいただきもの・香典返しは {intoLabel} に移り、{fromLabel} は一覧から消えます。
				{intoLabel} の空いている欄は {fromLabel} の内容で埋め、備考はつなげます。
			</p>
			{message && (
				<p role="alert" class={ui.alert}>
					{message}
				</p>
			)}
			<div class="overflow-x-auto rounded-xl border border-line bg-surface">
				<table class={ui.table}>
					<caption class="sr-only">まとめる 2 人と、まとめた後の内容</caption>
					<thead>
						<tr>
							<th class={ui.th} scope="col">
								項目
							</th>
							<th class={ui.th} scope="col">
								残す: {intoLabel}
							</th>
							<th class={ui.th} scope="col">
								まとめて消す: {fromLabel}
							</th>
							<th class={`${ui.th} bg-paper`} scope="col">
								まとめた後
							</th>
						</tr>
					</thead>
					<tbody>
						{/* どちらにも入っていない項目は出さない */}
						{FIELDS.filter(([key]) => into[key] || from[key]).map(([key, label]) => (
							<tr>
								<th class={rowHeader} scope="row">
									{label}
								</th>
								<td class={`${ui.td} whitespace-pre-wrap`}>{into[key] ?? ""}</td>
								<td class={`${ui.td} whitespace-pre-wrap`}>{from[key] ?? ""}</td>
								<td class={`${ui.td} bg-paper whitespace-pre-wrap`}>
									{mergedValue(key, into, from) ?? ""}
								</td>
							</tr>
						))}
						<tr>
							<th class={rowHeader} scope="row">
								いただきもの
							</th>
							<td class={ui.td}>{giftSummary(into)}</td>
							<td class={ui.td}>{giftSummary(from)}</td>
							<td class={`${ui.td} bg-paper`}>{giftIds.size} 件</td>
						</tr>
						<tr>
							<th class={rowHeader} scope="row">
								香典返し
							</th>
							<td class={ui.td}>{into.ret ? "あり" : "なし"}</td>
							<td class={ui.td}>{from.ret ? "あり" : "なし"}</td>
							<td class={`${ui.td} bg-paper`}>
								{bothReturns ? "（まとめられません）" : into.ret || from.ret ? "あり" : "なし"}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{bothReturns ? (
				<p role="alert" class={ui.alert}>
					2 人とも香典返しの記録があるため、まとめられません。片方の香典返し（
					<a href={`${base}/returns/${into.ret?.id}`} class={ui.link}>
						{intoLabel}
					</a>
					・
					<a href={`${base}/returns/${from.ret?.id}`} class={ui.link}>
						{fromLabel}
					</a>
					）を削除してから、もう一度まとめてください。
				</p>
			) : (
				<form
					method="post"
					action={`${base}/persons/${into.id}/merge`}
					class={`${ui.card} space-y-3`}
				>
					<Hidden name="intoVersion" value={into.version} />
					<Hidden name="fromId" value={from.id} />
					<Hidden name="fromVersion" value={from.version} />
					<p class="text-sm">まとめると元に戻せません。同じ人であることを確かめてください。</p>
					<button type="submit" class={ui.buttonPrimary} data-requires-online>
						{fromLabel} を {intoLabel} にまとめる
					</button>
				</form>
			)}

			<p class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
				<a href={`${base}/persons/${from.id}/merge?from=${into.id}`} class={ui.link}>
					残す差出人を入れ替える（{fromLabel} を残す）
				</a>
				<a href={`${base}/persons/${into.id}/merge`} class={ui.link}>
					まとめる相手を選び直す
				</a>
				<a href={`${base}/persons/${into.id}`} class={ui.link}>
					やめる
				</a>
			</p>
		</div>
	);
};
