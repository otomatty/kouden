import { ATTENDANCES, type FieldErrors, GIFT_KINDS, type GiftKind } from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { LedgerEvent, LedgerRelationship, PersonView } from "../../ledger/types.ts";
import { Field, FormAlert, type FormValues, Hidden, Input, Select, Textarea, ui } from "@kouden/ui";
import { yen } from "../format.ts";
import { PersonCandidates } from "./person-candidates.tsx";

/** 直前に登録したもの。続けて入力できるよう同じ画面に戻り、上に知らせる */
export interface CreatedGiftNotice {
	giftId: string;
	receiptNo: number | null;
	eventName: string;
	personLabel: string;
	kind: GiftKind;
	amount: number | null;
}

export interface GiftNewProps {
	kouden: KoudenContext;
	events: LedgerEvent[];
	relationships: LedgerRelationship[];
	/** eventId を含む。行事は直前の登録と同じものを選んでおく */
	values: FormValues;
	errors?: FieldErrors;
	/** 項目に属さないメッセージ（上限に達した、など） */
	message?: Child;
	created?: CreatedGiftNotice | undefined;
	candidates?: PersonView[];
}

export const createdGiftMessage = (created: CreatedGiftNotice) =>
	`登録しました。${created.eventName}${
		created.receiptNo !== null ? ` No.${created.receiptNo}` : ""
	}、${created.personLabel} 様、${GIFT_KINDS[created.kind]}${
		created.amount !== null ? ` ${yen(created.amount)}` : ""
	}。`;

const CREATED_NOTICE_ID = "created-gift";

/** 差出人の候補を、入力に合わせて取り直す（E5-1）。候補の要求は新しい入力で置き換える */
const candidatesTrigger = (base: string) => ({
	"hx-get": `${base}/persons/candidates`,
	"hx-trigger": "input changed delay:300ms",
	"hx-target": "#candidates",
	"hx-swap": "innerHTML",
	"hx-sync": "this:replace",
});

/** いただきものの登録（E4-1, E4-3）。差出人といただきものを一度に入力する */
export const GiftNewPage: FC<GiftNewProps> = ({
	kouden,
	events,
	relationships,
	values,
	errors = {},
	message,
	created,
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
		<div class="mx-auto max-w-xl space-y-4">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 class={ui.h2}>いただきものの登録</h2>
				<a href={`${base}/gifts`} class={`${ui.link} text-sm`}>
					一覧に戻る
				</a>
			</div>

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
						<p id={CREATED_NOTICE_ID} role="status">
							{createdGiftMessage(created)}
						</p>
						<p class="text-xs text-muted">
							{created.receiptNo !== null && "香典袋にこの番号を書いておくと、あとで照合できます。"}{" "}
							<a href={`${base}/gifts/${created.giftId}`} class={ui.link}>
								内容を見る・訂正する
							</a>
						</p>
					</div>
				</div>
			)}

			<form method="post" action={`${base}/gifts`} class={`${ui.cardTight} space-y-4`} novalidate>
				<FormAlert errors={errors} message={message} />

				{/* 行事が 1 つ（既定の「葬儀」だけ）なら選ばせない */}
				{events.length > 1 ? (
					<Field label="行事" name="eventId" error={errors.eventId}>
						<Select
							name="eventId"
							values={values}
							errors={errors}
							options={events.map((e) => ({ value: e.id, label: e.name }))}
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
					hint="団体からの場合は団体名だけでも登録できます"
				>
					<Input
						name="name"
						values={values}
						errors={errors}
						autofocus
						class="text-lg"
						extra={{
							...candidatesTrigger(base),
							// 続けて入力するとき、氏名の欄に戻ったところで直前の登録結果を読み上げる
							...(created && !errors.name ? { "aria-describedby": CREATED_NOTICE_ID } : {}),
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
							placeholder="例: 10000"
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
							extra={candidatesTrigger(base)}
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

				<button type="submit" class={`${ui.buttonPrimary} w-full`} data-requires-online>
					登録する
				</button>
			</form>
		</div>
	);
};
