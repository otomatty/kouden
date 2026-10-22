import {
	ATTENDANCES,
	type FieldErrors,
	GIFT_KIND_FIELDS,
	GIFT_KIND_VALUES,
	GIFT_KINDS,
	type GiftKind,
	personLabel,
} from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { GiftView, LedgerEvent, LedgerRelationship, PersonView } from "../../ledger/types.ts";
import { Field, FormAlert, type FormValues, Hidden, Input, Select, Textarea, ui } from "@kouden/ui";
import { yen } from "../format.ts";
import { PersonCandidates } from "./person-candidates.tsx";
import { LiveRegion } from "./shell.tsx";

/** 直前に登録したもの。続けて入力できるよう同じ画面に残り、上に知らせる */
export interface CreatedGiftNotice {
	giftId: string;
	receiptNo: number | null;
	eventName: string;
	personLabel: string;
	kind: GiftKind;
	amount: number | null;
}

/** 選んでいる行事の件数と香典の合計（現金と照合する）。無料版なら残りの件数 */
export interface EntrySummaryData {
	eventId: string;
	eventName: string;
	count: number;
	kodenTotal: number;
	/** 無料版で登録できる残りの件数。有料版は null */
	remaining: number | null;
}

export interface GiftEntryProps {
	kouden: KoudenContext;
	events: LedgerEvent[];
	relationships: LedgerRelationship[];
	/** eventId を含む。行事は直前の登録と同じものを選んでおく */
	values: FormValues;
	errors?: FieldErrors;
	/** 項目に属さないメッセージ（上限に達した、など） */
	message?: Child;
	/** 取り消しなどの結果 */
	notice?: string | undefined;
	created?: CreatedGiftNotice | undefined;
	/**
	 * 画面全体を読み込んだとき（JS なしの登録・リダイレクトの後）は、登録結果を氏名の欄の説明にして読み上げる。
	 * htmx で差し替えたときは SrStatus が読み上げるので付けない（二重に読まれないように）
	 */
	describeCreated?: boolean;
	candidates?: PersonView[];
	/** 自分が最近登録した分（取り消し・訂正用） */
	recent: GiftView[];
}

export const createdGiftMessage = (created: CreatedGiftNotice) =>
	`登録しました。${created.eventName}${
		created.receiptNo !== null ? ` No.${created.receiptNo}` : ""
	}、${created.personLabel} 様、${GIFT_KINDS[created.kind]}${
		created.amount !== null ? ` ${yen(created.amount)}` : ""
	}。`;

const CREATED_NOTICE_ID = "created-gift";

/** よく使う香典の金額（押すと金額の欄に入る） */
const AMOUNT_PRESETS = [
	{ value: 3000, label: "3千" },
	{ value: 5000, label: "5千" },
	{ value: 10000, label: "1万" },
	{ value: 30000, label: "3万" },
	{ value: 50000, label: "5万" },
] as const;

/** その欄を使わない種別（app.css が、選んだ種別に要らない欄を隠す） */
const hideFor = (field: (typeof GIFT_KIND_FIELDS)[GiftKind][number]) =>
	GIFT_KIND_VALUES.filter((k) => !GIFT_KIND_FIELDS[k].includes(field)).join(" ");

/** 差出人の候補を、入力に合わせて取り直す（E5-1）。候補の要求は新しい入力で置き換える */
const candidatesTrigger = (base: string) => ({
	"hx-get": `${base}/persons/candidates`,
	"hx-trigger": "input changed delay:300ms",
	"hx-target": "#candidates",
	"hx-swap": "innerHTML",
	"hx-sync": "this:replace",
});

/** いただきものの登録（E4-1, E4-3。08 案 A）。行事の合計と、登録の欄・最近の登録 */
export const GiftNewPage: FC<GiftEntryProps & { summary: EntrySummaryData }> = ({
	summary,
	...props
}) => (
	<div class="mx-auto max-w-xl space-y-4">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 class={ui.h2}>いただきものの登録</h2>
			<a href={`/k/${props.kouden.id}/gifts`} class={`${ui.link} text-sm`}>
				一覧に戻る
			</a>
		</div>
		<EntrySummary kouden={props.kouden} summary={summary} />
		<GiftEntryPanel {...props} />
	</div>
);

/** 行事の件数と香典の合計。他の人の登録でも取り直し、自分の登録では out-of-band で差し替える */
export const EntrySummary: FC<{
	kouden: KoudenContext;
	summary: EntrySummaryData;
	oob?: boolean;
}> = ({ kouden, summary, oob }) => (
	<LiveRegion
		id="entry-summary"
		entities={["gift", "event", "plan"]}
		url={`/k/${kouden.id}/gifts/new?partial=summary&eventId=${summary.eventId}`}
		oob={oob}
	>
		<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-line bg-surface px-4 py-3">
			<span class="font-medium">{summary.eventName}</span>
			<span class="tabular-nums">
				{summary.count} 件・香典{" "}
				<span class="text-lg font-semibold">{yen(summary.kodenTotal)}</span>
			</span>
			{summary.remaining !== null && (
				<span class="w-full text-xs text-muted">
					無料版: あと {summary.remaining} 件登録できます
				</span>
			)}
		</div>
	</LiveRegion>
);

/** htmx で丸ごと差し替える部分（登録結果・入力欄・最近の登録） */
export const GiftEntryPanel: FC<GiftEntryProps> = ({
	kouden,
	events,
	relationships,
	values,
	errors = {},
	message,
	notice,
	created,
	describeCreated,
	candidates = [],
	recent,
}) => {
	const base = `/k/${kouden.id}`;
	const kind = (values.kind ?? "koden") as GiftKind;
	// 「＋」の中の欄に入力やエラーがあれば開いておく
	const moreKeys = [
		"nameKana",
		"relationshipId",
		"organization",
		"position",
		"phone",
		"attendance",
		"notes",
	];
	const openMore = moreKeys.some((k) => errors[k] || values[k]);
	return (
		<div id="gift-entry" class="space-y-4">
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}
			{created && (
				<div class={`${ui.noticeEmphasis} flex items-center gap-4`}>
					{/* 香典袋に書き写す番号を大きく出す。読み上げは下の文で行う */}
					{created.receiptNo !== null && (
						<p aria-hidden="true" class="shrink-0 text-center">
							<span class="block text-xs text-muted">{created.eventName}</span>
							<span class="block text-4xl leading-tight font-bold tabular-nums">
								{created.receiptNo}
							</span>
						</p>
					)}
					<div class="space-y-1">
						<p id={CREATED_NOTICE_ID}>{createdGiftMessage(created)}</p>
						<p class="text-xs text-muted">
							{created.receiptNo !== null && "香典袋にこの番号を書いておくと、あとで照合できます。"}{" "}
							<a href={`${base}/gifts/${created.giftId}`} class={ui.link}>
								内容を見る・訂正する
							</a>
						</p>
					</div>
				</div>
			)}

			<form
				method="post"
				action={`${base}/gifts`}
				hx-post={`${base}/gifts`}
				hx-target="#gift-entry"
				hx-swap="outerHTML"
				class={`${ui.cardTight} space-y-4`}
				novalidate
			>
				<FormAlert errors={errors} message={message} />

				{/* 行事が 1 つ（既定の「葬儀」だけ）なら選ばせない。選び直したら上の合計を取り直す */}
				{events.length > 1 ? (
					<Field label="行事" name="eventId" error={errors.eventId}>
						<Select
							name="eventId"
							values={values}
							errors={errors}
							options={events.map((e) => ({ value: e.id, label: e.name }))}
							extra={{
								"hx-get": `${base}/gifts/new?partial=summary`,
								"hx-trigger": "change",
								"hx-target": "#entry-summary",
								"hx-swap": "outerHTML",
							}}
						/>
					</Field>
				) : (
					<Hidden name="eventId" value={values.eventId ?? ""} />
				)}

				<fieldset class="space-y-2">
					<legend class={ui.label}>種別</legend>
					<div class="flex flex-wrap gap-2">
						{(Object.entries(GIFT_KINDS) as [GiftKind, string][]).map(([value, label]) => (
							<label>
								<input
									type="radio"
									name="kind"
									value={value}
									checked={kind === value}
									class="peer sr-only"
								/>
								<span class="block cursor-pointer rounded-lg border border-line px-4 py-2 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
									{label}
								</span>
							</label>
						))}
					</div>
				</fieldset>

				<Field
					label="氏名"
					name="name"
					error={errors.name}
					hint="団体からの場合は、下の「＋」から団体名だけでも登録できます"
				>
					<Input
						name="name"
						values={values}
						errors={errors}
						autofocus
						class="text-lg"
						extra={{
							...candidatesTrigger(base),
							...(created && describeCreated && !errors.name
								? { "aria-describedby": CREATED_NOTICE_ID }
								: {}),
						}}
					/>
				</Field>
				<div id="candidates">
					<PersonCandidates persons={candidates} selected={values.personId} />
				</div>

				<div data-hide-for={hideFor("amount")}>
					<Field
						label="金額"
						name="amount"
						error={errors.amount}
						hint="香典は必須です。「1万」「五千円」でも入ります"
					>
						<div class="flex items-center gap-2">
							<Input
								name="amount"
								values={values}
								errors={errors}
								inputmode="numeric"
								class="text-right text-lg tabular-nums"
								placeholder="例: 10000"
							/>
							<span>円</span>
						</div>
						{/* 押すと金額の欄に入る（app.js）。JS がないときは出さない */}
						<div
							data-amount-chips
							hidden
							role="group"
							aria-label="よく使う金額"
							class="flex flex-wrap gap-2 pt-1"
						>
							{AMOUNT_PRESETS.map((p) => (
								<button
									type="button"
									data-amount={String(p.value)}
									aria-label={yen(p.value)}
									aria-pressed="false"
									class="rounded-full border border-line px-3 py-1 text-sm aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-surface"
								>
									{p.label}
								</button>
							))}
						</div>
					</Field>
				</div>

				<div class="grid gap-4 sm:grid-cols-2" data-hide-for={hideFor("itemName")}>
					<Field label="品名" name="itemName" error={errors.itemName}>
						<Input name="itemName" values={values} errors={errors} />
					</Field>
					<Field label="数量" name="quantity" error={errors.quantity}>
						<Input name="quantity" values={values} errors={errors} inputmode="numeric" />
					</Field>
				</div>

				<div data-hide-for={hideFor("message")}>
					<Field label="弔電の文面" name="message" error={errors.message}>
						<Textarea name="message" values={values} errors={errors} />
					</Field>
				</div>

				<fieldset class="space-y-2">
					<legend class={ui.label}>
						住所
						<span class="ml-1 text-xs font-normal text-muted">
							（香典返しの宛先。後からでも入れられます）
						</span>
					</legend>
					<div class="grid gap-2 sm:grid-cols-[10rem_1fr]">
						<Field
							label="郵便番号"
							name="postalCode"
							error={errors.postalCode}
							hint="7 桁で町域まで入り、住所の欄に移ります"
						>
							<Input
								name="postalCode"
								values={values}
								errors={errors}
								inputmode="numeric"
								placeholder="例: 1000001"
								extra={{ "data-postal-code": "" }}
							/>
						</Field>
						<Field label="住所" name="address" error={errors.address}>
							<Input
								name="address"
								values={values}
								errors={errors}
								extra={{ "data-address": "" }}
							/>
						</Field>
					</div>
				</fieldset>

				<details
					open={openMore}
					data-remember="gift-entry-more"
					class="rounded-lg border border-line px-3 py-2"
				>
					<summary class="cursor-pointer text-sm font-medium">
						＋ ふりがな・関係・団体名・電話・備考など
					</summary>
					<div class="mt-3 grid gap-4 sm:grid-cols-2">
						<Field label="ふりがな" name="nameKana" error={errors.nameKana}>
							<Input name="nameKana" values={values} errors={errors} />
						</Field>
						<Field label="関係" name="relationshipId" error={errors.relationshipId}>
							<Select
								name="relationshipId"
								values={values}
								errors={errors}
								blank="（未選択）"
								options={relationships
									.filter((r) => !r.isHidden)
									.map((r) => ({ value: r.id, label: r.name }))}
							/>
						</Field>
						<Field
							label="団体名・会社名"
							name="organization"
							error={errors.organization}
							class="sm:col-span-2"
						>
							<Input
								name="organization"
								values={values}
								errors={errors}
								extra={candidatesTrigger(base)}
							/>
						</Field>
						<Field label="役職" name="position" error={errors.position}>
							<Input name="position" values={values} errors={errors} />
						</Field>
						<Field label="電話番号" name="phone" error={errors.phone}>
							<Input name="phone" values={values} errors={errors} type="tel" inputmode="tel" />
						</Field>
						<Field label="参列" name="attendance" error={errors.attendance}>
							<Select
								name="attendance"
								values={values}
								errors={errors}
								blank="（未選択）"
								options={Object.entries(ATTENDANCES).map(([value, label]) => ({ value, label }))}
							/>
						</Field>
						<Field label="備考" name="notes" error={errors.notes} class="sm:col-span-2">
							<Textarea name="notes" values={values} errors={errors} rows={2} />
						</Field>
					</div>
					<p class="mt-2 text-xs text-muted">
						既存の差出人を選んだ場合、住所などの変更は差出人の画面で行ってください。
					</p>
				</details>

				<button type="submit" class={`${ui.buttonPrimary} w-full`} data-requires-online>
					登録して次へ
				</button>
			</form>

			<RecentEntries kouden={kouden} recent={recent} eventId={values.eventId ?? ""} />
		</div>
	);
};

/** 自分が最近登録した分。その場で取り消し（削除）・訂正ができる（08 案 A） */
const RecentEntries: FC<{ kouden: KoudenContext; recent: GiftView[]; eventId: string }> = ({
	kouden,
	recent,
	eventId,
}) => {
	if (recent.length === 0) return null;
	const base = `/k/${kouden.id}`;
	return (
		<section aria-labelledby="recent-entries" class="space-y-2">
			<h3 id="recent-entries" class="text-sm font-medium text-muted">
				自分が最近登録した分
			</h3>
			<ul class="divide-y divide-line rounded-xl border border-line bg-surface">
				{recent.map((g) => {
					const primary = g.contributors[0];
					const who = primary ? personLabel(primary) : "（差出人なし）";
					const label = `${g.receiptNo !== null ? `No.${g.receiptNo} ` : ""}${who}`;
					return (
						<li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
							<span class="w-12 shrink-0 text-muted tabular-nums">
								{g.receiptNo !== null ? `No.${g.receiptNo}` : "—"}
							</span>
							{/* 狭い画面では、氏名を詰めずにボタンを次の行へ送る */}
							<span class="min-w-[7em] flex-1 break-words">
								{who}
								{g.kind !== "koden" && (
									<span class="ml-1 text-muted">（{GIFT_KINDS[g.kind]}）</span>
								)}
							</span>
							<span class="tabular-nums">{yen(g.amount)}</span>
							<span class="ml-auto flex gap-2">
								<a
									href={`${base}/gifts/${g.id}`}
									class={ui.buttonSmall}
									aria-label={`${label} を直す`}
								>
									直す
								</a>
								<form
									method="post"
									action={`${base}/gifts/${g.id}/delete`}
									hx-post={`${base}/gifts/${g.id}/delete`}
									hx-target="#gift-entry"
									hx-swap="outerHTML"
								>
									<Hidden name="version" value={g.version} />
									<Hidden name="from" value="entry" />
									<Hidden name="eventId" value={eventId} />
									<button
										type="submit"
										class={ui.buttonSmall}
										aria-label={`${label} の登録を取り消す`}
									>
										取り消す
									</button>
								</form>
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
};
