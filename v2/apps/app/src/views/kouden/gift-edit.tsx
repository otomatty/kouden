import { ATTENDANCES, type FieldErrors, GIFT_KINDS, personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { GiftView, LedgerEvent, PersonView } from "../../ledger/types.ts";
import {
	Field,
	FormAlert,
	type FormValues,
	Hidden,
	Input,
	Select,
	Textarea,
} from "../components/form.tsx";
import { formatDateTime, yen } from "../format.ts";
import { ui } from "../ui.ts";
import { PersonCandidates } from "./person-candidates.tsx";

/** フォームの初期値（保存済みの内容） */
export function giftFormValues(g: GiftView): FormValues {
	return {
		eventId: g.eventId,
		kind: g.kind,
		amount: g.amount?.toString(),
		itemName: g.itemName ?? undefined,
		quantity: g.quantity?.toString(),
		message: g.message ?? undefined,
		attendance: g.attendance ?? undefined,
		notes: g.notes ?? undefined,
	};
}

/** いただきものの詳細・編集（E4-3, E4-4）。閲覧者には内容だけを表示する */
export const GiftEditPage: FC<{
	kouden: KoudenContext;
	gift: GiftView;
	events: LedgerEvent[];
	canWrite: boolean;
	values: FormValues;
	errors?: FieldErrors;
	message?: string | undefined;
	notice?: string | undefined;
	contributorErrors?: FieldErrors;
	contributorValues?: FormValues;
	contributorCandidates?: PersonView[];
}> = ({
	kouden,
	gift,
	events,
	canWrite,
	values,
	errors = {},
	message,
	notice,
	contributorErrors = {},
	contributorValues = {},
	contributorCandidates = [],
}) => {
	const base = `/k/${kouden.id}`;
	const giftPath = `${base}/gifts/${gift.id}`;
	return (
		<div class="mx-auto max-w-3xl space-y-6">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 class={ui.h2}>
					{gift.eventName}
					{gift.receiptNo !== null && <span class="ml-2 tabular-nums">No.{gift.receiptNo}</span>}
				</h2>
				<p class="text-sm text-muted">最終更新 {formatDateTime(gift.updatedAt)}</p>
			</div>
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}

			{canWrite ? (
				<form method="post" action={giftPath} class={`${ui.card} space-y-4`} novalidate>
					<Hidden name="version" value={gift.version} />
					<FormAlert errors={errors} message={message} />
					<div class="grid gap-4 sm:grid-cols-2">
						<Field
							label="行事"
							name="eventId"
							error={errors.eventId}
							hint="行事を変えると、受付番号は移した先の行事で振り直します"
						>
							<Select
								name="eventId"
								values={values}
								errors={errors}
								options={events.map((e) => ({ value: e.id, label: e.name }))}
							/>
						</Field>
						<Field label="種別" name="kind" error={errors.kind}>
							<Select
								name="kind"
								values={values}
								errors={errors}
								options={Object.entries(GIFT_KINDS).map(([value, label]) => ({ value, label }))}
							/>
						</Field>
						<Field label="金額（円）" name="amount" error={errors.amount}>
							<Input
								name="amount"
								values={values}
								errors={errors}
								inputmode="numeric"
								class="text-right tabular-nums"
							/>
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
						<Field label="品名" name="itemName" error={errors.itemName}>
							<Input name="itemName" values={values} errors={errors} />
						</Field>
						<Field label="数量" name="quantity" error={errors.quantity}>
							<Input name="quantity" values={values} errors={errors} inputmode="numeric" />
						</Field>
						<Field label="弔電の文面" name="message" error={errors.message} class="sm:col-span-2">
							<Textarea name="message" values={values} errors={errors} rows={4} />
						</Field>
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
					<dt class="text-muted">種別</dt>
					<dd>{GIFT_KINDS[gift.kind]}</dd>
					<dt class="text-muted">金額</dt>
					<dd>{yen(gift.amount)}</dd>
					{gift.itemName && (
						<>
							<dt class="text-muted">品名</dt>
							<dd>
								{gift.itemName}
								{gift.quantity !== null && ` ×${gift.quantity}`}
							</dd>
						</>
					)}
					{gift.attendance && (
						<>
							<dt class="text-muted">参列</dt>
							<dd>{ATTENDANCES[gift.attendance]}</dd>
						</>
					)}
					{gift.message && (
						<>
							<dt class="text-muted">弔電の文面</dt>
							<dd class="whitespace-pre-wrap">{gift.message}</dd>
						</>
					)}
					{gift.notes && (
						<>
							<dt class="text-muted">備考</dt>
							<dd class="whitespace-pre-wrap">{gift.notes}</dd>
						</>
					)}
				</dl>
			)}

			<section aria-labelledby="contributors" class={`${ui.card} space-y-4`}>
				<h2 id="contributors" class={ui.h2}>
					差出人
				</h2>
				<p class="text-sm text-muted">
					連名の場合は差出人を追加します。負担額を入れない人は、残りの金額を均等に割って香典返しの目安に使います。
				</p>
				<FormAlert errors={contributorErrors._form ? { _form: contributorErrors._form } : {}} />
				<ul class="divide-y divide-line">
					{gift.contributors.map((p) => (
						<li class="flex flex-wrap items-center gap-3 py-3">
							<div class="min-w-40 flex-1">
								<a href={`${base}/persons/${p.personId}`} class="font-medium hover:underline">
									{personLabel(p)}
								</a>
								{p.isPrimary && <span class={`${ui.badge} ml-2`}>代表者</span>}
								{p.relationshipName && (
									<span class="ml-2 text-sm text-muted">{p.relationshipName}</span>
								)}
							</div>
							{canWrite ? (
								<>
									<form
										method="post"
										action={`${giftPath}/contributors/${p.personId}`}
										class="flex items-center gap-2"
									>
										<Hidden name="version" value={gift.version} />
										<label class="text-sm text-muted" for={`share-${p.personId}`}>
											負担額
										</label>
										<input
											id={`share-${p.personId}`}
											name="shareAmount"
											value={p.shareAmount?.toString() ?? ""}
											inputmode="numeric"
											class={`${ui.input} w-28 text-right tabular-nums`}
											placeholder="均等割り"
										/>
										{!p.isPrimary && (
											<label class="flex items-center gap-1 text-sm">
												<input type="checkbox" name="makePrimary" value="1" class="accent-accent" />
												代表者にする
											</label>
										)}
										<button type="submit" class={ui.buttonSmall}>
											更新
										</button>
									</form>
									{gift.contributors.length > 1 && (
										<form method="post" action={`${giftPath}/contributors/${p.personId}/delete`}>
											<Hidden name="version" value={gift.version} />
											<button type="submit" class={ui.buttonSmall}>
												外す
											</button>
										</form>
									)}
								</>
							) : (
								p.shareAmount !== null && <span class="text-sm">負担額 {yen(p.shareAmount)}</span>
							)}
						</li>
					))}
				</ul>

				{canWrite && (
					<form
						method="post"
						action={`${giftPath}/contributors`}
						class="space-y-3 border-t border-line pt-4"
						novalidate
					>
						<h3 class={ui.h3}>差出人を追加</h3>
						<Hidden name="version" value={gift.version} />
						<div class="grid gap-3 sm:grid-cols-3">
							<Field label="氏名" name="name" idPrefix="add" error={contributorErrors.name}>
								<Input
									name="name"
									idPrefix="add"
									values={contributorValues}
									errors={contributorErrors}
									extra={{
										"hx-get": `${base}/persons/candidates`,
										"hx-trigger": "input changed delay:300ms",
										"hx-target": "#contributor-candidates",
										"hx-swap": "innerHTML",
									}}
								/>
							</Field>
							<Field
								label="団体名"
								name="organization"
								idPrefix="add"
								error={contributorErrors.organization}
							>
								<Input
									name="organization"
									idPrefix="add"
									values={contributorValues}
									errors={contributorErrors}
								/>
							</Field>
							<Field
								label="負担額（任意）"
								name="shareAmount"
								idPrefix="add"
								error={contributorErrors.shareAmount}
							>
								<Input
									name="shareAmount"
									idPrefix="add"
									values={contributorValues}
									errors={contributorErrors}
									inputmode="numeric"
								/>
							</Field>
						</div>
						<div id="contributor-candidates">
							<PersonCandidates
								persons={contributorCandidates}
								selected={contributorValues.personId}
							/>
						</div>
						{contributorErrors.personId && (
							<p class="text-sm text-danger">{contributorErrors.personId}</p>
						)}
						<button type="submit" class={ui.buttonSecondary} data-requires-online>
							追加する
						</button>
					</form>
				)}
			</section>

			{canWrite && (
				<details class={`${ui.cardTight} text-sm`}>
					<summary class="cursor-pointer font-medium text-danger">
						このいただきものを削除する
					</summary>
					<form method="post" action={`${giftPath}/delete`} class="mt-3 space-y-2">
						<Hidden name="version" value={gift.version} />
						<p>削除すると一覧と合計から外れます。受付番号は再利用されません。</p>
						<button type="submit" class={ui.buttonDanger}>
							削除する
						</button>
					</form>
				</details>
			)}

			<p>
				<a href={`${base}/gifts`} class={ui.link}>
					← いただきもの一覧へ
				</a>
			</p>
		</div>
	);
};
