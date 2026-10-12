import { type FieldErrors, formatYen, GIFT_KINDS, personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { History, LedgerRelationship, PersonDetail, PersonView } from "../../ledger/types.ts";
import {
	Field,
	FormAlert,
	type FormValues,
	Hidden,
	Input,
	Select,
	Textarea,
} from "../components/form.tsx";
import { yen } from "../format.ts";
import { ui } from "../ui.ts";
import { LiveRegion } from "./shell.tsx";
import { type ConflictField, ConflictDiff } from "../components/conflict.tsx";
import { HistoryList } from "../components/history.tsx";

const COLUMNS = 8;

function personConflictFields(relationships: LedgerRelationship[]): ConflictField[] {
	return [
		{ name: "name", label: "氏名" },
		{ name: "nameKana", label: "ふりがな" },
		{ name: "organization", label: "団体名" },
		{ name: "position", label: "役職" },
		{
			name: "relationshipId",
			label: "関係",
			options: Object.fromEntries(relationships.map((r) => [r.id, r.name])),
		},
		{ name: "postalCode", label: "郵便番号" },
		{ name: "address", label: "住所" },
		{ name: "phone", label: "電話番号" },
		{ name: "notes", label: "備考" },
	];
}

export function personFormValues(p: PersonView): FormValues {
	return {
		name: p.name ?? undefined,
		nameKana: p.nameKana ?? undefined,
		organization: p.organization ?? undefined,
		position: p.position ?? undefined,
		relationshipId: p.relationshipId ?? undefined,
		postalCode: p.postalCode ?? undefined,
		address: p.address ?? undefined,
		phone: p.phone ?? undefined,
		notes: p.notes ?? undefined,
	};
}

/** 関係の選択肢。非表示の関係は、その差出人に設定済みの場合だけ出す */
function relationshipOptions(relationships: LedgerRelationship[], current: string | undefined) {
	return relationships
		.filter((r) => !r.isHidden || r.id === current)
		.map((r) => ({ value: r.id, label: r.isHidden ? `${r.name}（非表示）` : r.name }));
}

/**
 * 差出人一覧（E4-5）。PC ではキーボードで連続編集できる:
 * 「編集」で行が入力欄になり、Enter で保存すると次の行が編集状態で開く。
 */
export const PersonsPage: FC<{
	kouden: KoudenContext;
	persons: PersonView[];
	canWrite: boolean;
	q: string | undefined;
}> = ({ kouden, persons, canWrite, q }) => {
	const base = `/k/${kouden.id}`;
	return (
		<div class="space-y-4">
			<form
				method="get"
				action={`${base}/persons`}
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
			{canWrite && (
				<p class="text-sm text-muted">
					「編集」で行を開き、Enter で保存すると次の人の編集に進みます。
				</p>
			)}
			<PersonsTable kouden={kouden} persons={persons} canWrite={canWrite} q={q} />
		</div>
	);
};

/** 一覧の表。他の人の変更を受けると取り直す（行を編集中なら取り直さずにお知らせを出す） */
export const PersonsTable: FC<{
	kouden: KoudenContext;
	persons: PersonView[];
	canWrite: boolean;
	q: string | undefined;
}> = ({ kouden, persons, canWrite, q }) => (
	<LiveRegion
		id="person-table"
		entities={["person", "gift", "relationship"]}
		url={`/k/${kouden.id}/persons?partial=table${q ? `&q=${encodeURIComponent(q)}` : ""}`}
		class="space-y-3"
	>
		<p class="text-sm text-muted" role="status">
			{persons.length} 人
		</p>
		<div class="overflow-x-auto rounded-xl border border-line bg-surface">
			<table class={ui.table}>
				<thead>
					<tr>
						<th class={ui.th} scope="col">
							氏名
						</th>
						<th class={ui.th} scope="col">
							団体・役職
						</th>
						<th class={ui.th} scope="col">
							関係
						</th>
						<th class={ui.th} scope="col">
							住所
						</th>
						<th class={ui.th} scope="col">
							電話
						</th>
						<th class={`${ui.th} text-right`} scope="col">
							件数
						</th>
						<th class={`${ui.th} text-right`} scope="col">
							香典
						</th>
						<th class={ui.th} scope="col">
							<span class="sr-only">操作</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{persons.map((p) => (
						<PersonRow kouden={kouden} person={p} canWrite={canWrite} q={q} />
					))}
				</tbody>
			</table>
		</div>
	</LiveRegion>
);

export const PersonRow: FC<{
	kouden: KoudenContext;
	person: PersonView;
	canWrite: boolean;
	q: string | undefined;
	/** 他の行の差し替え（htmx の out-of-band swap）として返す場合 */
	oob?: boolean;
}> = ({ kouden, person: p, canWrite, q, oob }) => {
	const base = `/k/${kouden.id}`;
	const query = q ? `&q=${encodeURIComponent(q)}` : "";
	return (
		<tr id={`person-${p.id}`} hx-swap-oob={oob ? "outerHTML" : undefined}>
			<td class={ui.td}>
				<a href={`${base}/persons/${p.id}`} class="font-medium hover:underline">
					{p.name ?? p.organization}
				</a>
				{p.nameKana && <div class="text-xs text-muted">{p.nameKana}</div>}
				<span data-editing-target={`person:${p.id}`} class="block text-xs text-danger"></span>
			</td>
			<td class={ui.td}>
				{p.name ? p.organization : ""}
				{p.position && <div class="text-xs text-muted">{p.position}</div>}
			</td>
			<td class={`${ui.td} whitespace-nowrap`}>{p.relationshipName ?? ""}</td>
			<td class={ui.td}>
				{p.postalCode && <span class="mr-1 text-muted">〒{p.postalCode}</span>}
				{p.address}
			</td>
			<td class={`${ui.td} whitespace-nowrap`}>{p.phone}</td>
			<td class={`${ui.td} text-right tabular-nums`}>{p.giftCount}</td>
			<td class={`${ui.td} text-right tabular-nums whitespace-nowrap`}>
				{formatYen(p.kodenTotal)}
			</td>
			<td class={`${ui.td} text-right`}>
				{canWrite && (
					<a
						href={`${base}/persons/${p.id}`}
						hx-get={`${base}/persons/${p.id}/row?edit=1${query}`}
						hx-target="closest tr"
						hx-swap="outerHTML"
						class={ui.buttonSmall}
					>
						編集
					</a>
				)}
			</td>
		</tr>
	);
};

export const PersonEditRow: FC<{
	kouden: KoudenContext;
	person: PersonView;
	relationships: LedgerRelationship[];
	values: FormValues;
	errors?: FieldErrors;
	message?: string | undefined;
	q: string | undefined;
	hasNext: boolean;
	oob?: boolean;
	conflictLatest?: FormValues | undefined;
}> = ({
	kouden,
	person,
	relationships,
	values,
	errors = {},
	message,
	q,
	hasNext,
	oob,
	conflictLatest,
}) => {
	const base = `/k/${kouden.id}`;
	const prefix = `p-${person.id}`;
	const query = q ? `?q=${encodeURIComponent(q)}` : "";
	const field = (
		name: string,
		label: string,
		extra: { inputmode?: "numeric" | "tel"; autofocus?: boolean } = {},
	) => (
		<Field label={label} name={name} idPrefix={prefix} error={errors[name]}>
			<Input name={name} idPrefix={prefix} values={values} errors={errors} {...extra} />
		</Field>
	);
	return (
		<tr id={`person-${person.id}`} class="bg-paper" hx-swap-oob={oob ? "outerHTML" : undefined}>
			<td colspan={COLUMNS} class={ui.td}>
				<form
					method="post"
					action={`${base}/persons/${person.id}`}
					hx-post={`${base}/persons/${person.id}`}
					hx-target="closest tr"
					hx-swap="outerHTML"
					class="space-y-3"
					novalidate
					data-editing-entity="person"
					data-editing-id={person.id}
				>
					<Hidden name="version" value={person.version} />
					<Hidden name="mode" value="row" />
					{q && <Hidden name="q" value={q} />}
					{conflictLatest && (
						<ConflictDiff
							mine={values}
							latest={conflictLatest}
							discardHref={`${base}/persons${query}`}
							fields={personConflictFields(relationships)}
						/>
					)}
					<FormAlert errors={errors} message={message} />
					<div class="grid gap-3 sm:grid-cols-4">
						{field("name", "氏名", { autofocus: true })}
						{field("nameKana", "ふりがな")}
						{field("organization", "団体名")}
						{field("position", "役職")}
						<Field
							label="関係"
							name="relationshipId"
							idPrefix={prefix}
							error={errors.relationshipId}
						>
							<Select
								name="relationshipId"
								idPrefix={prefix}
								values={values}
								errors={errors}
								blank="（未選択）"
								options={relationshipOptions(relationships, values.relationshipId)}
							/>
						</Field>
						{field("postalCode", "郵便番号", { inputmode: "numeric" })}
						{field("phone", "電話番号", { inputmode: "tel" })}
						<div class="sm:col-span-4">{field("address", "住所")}</div>
					</div>
					<div class="flex flex-wrap gap-2">
						{/* Enter での送信は先頭の送信ボタンになる → 次の人へ進む */}
						{hasNext && (
							<button
								type="submit"
								name="go"
								value="next"
								class={ui.buttonSecondary}
								data-requires-online
							>
								保存して次へ
							</button>
						)}
						<button
							type="submit"
							name="go"
							value="stay"
							class={ui.buttonSecondary}
							data-requires-online
						>
							保存
						</button>
						<button
							type="button"
							hx-get={`${base}/persons/${person.id}/row${query}`}
							hx-target="closest tr"
							hx-swap="outerHTML"
							class={ui.buttonSmall}
						>
							取り消す
						</button>
					</div>
				</form>
			</td>
		</tr>
	);
};

/** 差出人の詳細（JavaScript なしでも編集できる画面） */
export const PersonPage: FC<{
	kouden: KoudenContext;
	person: PersonDetail;
	relationships: LedgerRelationship[];
	canWrite: boolean;
	values: FormValues;
	errors?: FieldErrors;
	message?: string | undefined;
	notice?: string | undefined;
	conflictLatest?: FormValues | undefined;
	history?: History | undefined;
}> = ({
	kouden,
	person,
	relationships,
	canWrite,
	values,
	errors = {},
	message,
	notice,
	conflictLatest,
	history,
}) => {
	const base = `/k/${kouden.id}`;
	const text = (
		name: string,
		label: string,
		opts: { inputmode?: "numeric" | "tel"; span?: boolean } = {},
	) => (
		<Field label={label} name={name} error={errors[name]} class={opts.span ? "sm:col-span-2" : ""}>
			<Input name={name} values={values} errors={errors} inputmode={opts.inputmode} />
		</Field>
	);
	return (
		<div class="mx-auto max-w-3xl space-y-6">
			<div class="flex flex-wrap items-baseline gap-3">
				<h2 class={ui.h2}>{personLabel(person)}</h2>
				<span data-editing-target={`person:${person.id}`} class="text-sm text-danger"></span>
			</div>
			<p data-live-watch={`person:${person.id}`} hidden role="status" class={ui.alert}>
				この差出人は他の人が更新しました。{" "}
				<a href="" class={ui.link}>
					最新の内容を表示
				</a>
			</p>
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}
			{canWrite ? (
				<form
					method="post"
					action={`${base}/persons/${person.id}`}
					class={`${ui.card} space-y-4`}
					novalidate
					data-editing-entity="person"
					data-editing-id={person.id}
				>
					<Hidden name="version" value={person.version} />
					{conflictLatest && (
						<ConflictDiff
							mine={values}
							latest={conflictLatest}
							discardHref={`${base}/persons/${person.id}`}
							fields={personConflictFields(relationships)}
						/>
					)}
					<FormAlert errors={errors} message={message} />
					<div class="grid gap-4 sm:grid-cols-2">
						{text("name", "氏名")}
						{text("nameKana", "ふりがな")}
						{text("organization", "団体名")}
						{text("position", "役職")}
						<Field label="関係" name="relationshipId" error={errors.relationshipId}>
							<Select
								name="relationshipId"
								values={values}
								errors={errors}
								blank="（未選択）"
								options={relationshipOptions(relationships, values.relationshipId)}
							/>
						</Field>
						{text("phone", "電話番号", { inputmode: "tel" })}
						{text("postalCode", "郵便番号", { inputmode: "numeric" })}
						{text("address", "住所", { span: true })}
						<Field label="備考" name="notes" error={errors.notes} class="sm:col-span-2">
							<Textarea name="notes" values={values} errors={errors} rows={2} />
						</Field>
					</div>
					<button type="submit" class={ui.buttonPrimary} data-requires-online>
						保存する
					</button>
				</form>
			) : (
				<dl class={`${ui.card} grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm`}>
					{(
						[
							["ふりがな", person.nameKana],
							["団体名", person.organization],
							["役職", person.position],
							["関係", person.relationshipName],
							["郵便番号", person.postalCode],
							["住所", person.address],
							["電話番号", person.phone],
							["備考", person.notes],
						] as const
					)
						.filter(([, v]) => v)
						.map(([k, v]) => (
							<>
								<dt class="text-muted">{k}</dt>
								<dd class="whitespace-pre-wrap">{v}</dd>
							</>
						))}
				</dl>
			)}

			<section aria-labelledby="person-gifts" class="space-y-3">
				<h2 id="person-gifts" class={ui.h2}>
					いただきもの（香典の合計 {formatYen(person.kodenTotal)}）
				</h2>
				<ul class="divide-y divide-line rounded-xl border border-line bg-surface">
					{person.gifts.map((g) => (
						<li>
							<a
								href={`${base}/gifts/${g.id}`}
								class="flex flex-wrap gap-x-3 px-4 py-3 hover:bg-paper"
							>
								<span class="text-muted">
									{g.eventName} {g.receiptNo !== null && `No.${g.receiptNo}`}
								</span>
								<span>{GIFT_KINDS[g.kind]}</span>
								<span class="tabular-nums">{yen(g.amount)}</span>
								{g.contributors.length > 1 && (
									<span class="text-muted">連名（{g.contributors.length} 名）</span>
								)}
							</a>
						</li>
					))}
				</ul>
			</section>

			{history && <HistoryList history={history} />}
			<p>
				<a href={`${base}/persons`} class={ui.link}>
					← 差出人一覧へ
				</a>
			</p>
		</div>
	);
};
