import { ATTENDANCES, type FieldErrors, GIFT_KINDS, type GiftKind } from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { LedgerEvent, LedgerRelationship, PersonView } from "../../ledger/types.ts";
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
import { PersonCandidates } from "./person-candidates.tsx";

/** 登録直後に大きく表示する内容（E4-1） */
export interface ReceptionDone {
	giftId: string;
	receiptNo: number | null;
	eventName: string;
	personLabel: string;
	kind: GiftKind;
	amount: number | null;
}

export interface ReceptionProps {
	kouden: KoudenContext;
	events: LedgerEvent[];
	relationships: LedgerRelationship[];
	eventId: string;
	values: FormValues;
	errors?: FieldErrors;
	/** 項目に属さないメッセージ（上限に達した、など） */
	message?: Child;
	done?: ReceptionDone | undefined;
	candidates?: PersonView[];
}

/** 受付画面（スマホ向け）。行事の切り替え・登録結果・入力欄 */
export const ReceptionPage: FC<ReceptionProps> = (props) => {
	const base = `/k/${props.kouden.id}`;
	return (
		<div class="mx-auto max-w-xl space-y-4">
			<nav aria-label="行事" class="flex flex-wrap gap-2">
				{props.events.map((e) => (
					<a
						href={`${base}/reception?event=${e.id}`}
						aria-current={e.id === props.eventId ? "page" : undefined}
						class={`rounded-full border px-4 py-1.5 text-sm ${
							e.id === props.eventId
								? "border-accent bg-accent text-white"
								: "border-line bg-surface text-ink hover:bg-paper"
						}`}
					>
						{e.name}
					</a>
				))}
			</nav>
			<ReceptionPanel {...props} />
		</div>
	);
};

/** htmx で丸ごと差し替える部分（登録結果 + 次の入力欄） */
export const ReceptionPanel: FC<ReceptionProps> = ({
	kouden,
	relationships,
	eventId,
	values,
	errors = {},
	message,
	done,
	candidates = [],
}) => {
	const base = `/k/${kouden.id}`;
	const kind = (values.kind ?? "koden") as GiftKind;
	const detailKeys = [
		"itemName",
		"quantity",
		"message",
		"attendance",
		"position",
		"postalCode",
		"address",
		"phone",
		"notes",
	];
	const openDetails = detailKeys.some((k) => errors[k] || values[k]);
	return (
		<div id="reception-panel" class="space-y-4">
			{done && (
				<div
					role="status"
					class="rounded-xl border-2 border-accent bg-surface p-5 text-center shadow-sm"
				>
					<p class="text-sm text-muted">{done.eventName} の受付番号</p>
					<p class="text-7xl leading-tight font-bold tabular-nums text-accent">
						{done.receiptNo ?? "—"}
					</p>
					<p class="mt-1 text-lg font-medium">{done.personLabel} 様</p>
					<p class="text-sm text-muted">
						{GIFT_KINDS[done.kind]} {done.amount !== null && yen(done.amount)}
					</p>
					<p class="mt-2 text-sm">
						<a href={`${base}/gifts/${done.giftId}`} class={ui.link}>
							内容を訂正する
						</a>
					</p>
				</div>
			)}

			<form
				method="post"
				action={`${base}/reception`}
				hx-post={`${base}/reception`}
				hx-target="#reception-panel"
				hx-swap="outerHTML"
				class={`${ui.cardTight} space-y-4`}
				novalidate
			>
				<Hidden name="eventId" value={eventId} />
				<FormAlert errors={errors} message={message} />

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
								<span class="block cursor-pointer rounded-lg border border-line px-4 py-2 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
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
					hint="団体からの場合は団体名だけでも登録できます"
				>
					<Input
						name="name"
						values={values}
						errors={errors}
						autofocus
						class="text-lg"
						extra={{
							"hx-get": `${base}/persons/candidates`,
							"hx-trigger": "input changed delay:300ms",
							"hx-target": "#candidates",
							"hx-swap": "innerHTML",
						}}
					/>
				</Field>
				<div id="candidates">
					<PersonCandidates persons={candidates} selected={values.personId} />
				</div>

				<Field label="金額" name="amount" error={errors.amount} hint="香典は必須です">
					<div class="flex items-center gap-2">
						<Input
							name="amount"
							values={values}
							errors={errors}
							inputmode="numeric"
							class="text-right text-lg tabular-nums"
							placeholder="10000"
						/>
						<span>円</span>
					</div>
				</Field>

				<div class="grid gap-4 sm:grid-cols-2">
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
							extra={{
								"hx-get": `${base}/persons/candidates`,
								"hx-trigger": "input changed delay:300ms",
								"hx-target": "#candidates",
								"hx-swap": "innerHTML",
							}}
						/>
					</Field>
				</div>

				<details open={openDetails} class="rounded-lg border border-line px-3 py-2">
					<summary class="cursor-pointer text-sm font-medium">
						詳細（品名・弔電の文面・住所など）
					</summary>
					<div class="mt-3 grid gap-4 sm:grid-cols-2">
						<Field label="品名（供物・供花）" name="itemName" error={errors.itemName}>
							<Input name="itemName" values={values} errors={errors} />
						</Field>
						<Field label="数量" name="quantity" error={errors.quantity}>
							<Input name="quantity" values={values} errors={errors} inputmode="numeric" />
						</Field>
						<Field label="弔電の文面" name="message" error={errors.message} class="sm:col-span-2">
							<Textarea name="message" values={values} errors={errors} />
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
						<Field label="役職" name="position" error={errors.position}>
							<Input name="position" values={values} errors={errors} />
						</Field>
						<Field label="郵便番号" name="postalCode" error={errors.postalCode}>
							<Input
								name="postalCode"
								values={values}
								errors={errors}
								inputmode="numeric"
								autocomplete="off"
							/>
						</Field>
						<Field label="電話番号" name="phone" error={errors.phone}>
							<Input name="phone" values={values} errors={errors} type="tel" inputmode="tel" />
						</Field>
						<Field label="住所" name="address" error={errors.address} class="sm:col-span-2">
							<Input name="address" values={values} errors={errors} />
						</Field>
						<Field label="備考" name="notes" error={errors.notes} class="sm:col-span-2">
							<Textarea name="notes" values={values} errors={errors} rows={2} />
						</Field>
					</div>
					<p class="mt-2 text-xs text-muted">
						既存の差出人を選んだ場合、住所などの変更は差出人の画面で行ってください。
					</p>
				</details>

				<button type="submit" class={`${ui.buttonPrimary} w-full text-lg`} data-requires-online>
					登録する
				</button>
			</form>
		</div>
	);
};
