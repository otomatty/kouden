import {
	can,
	type FieldErrors,
	formatYen,
	personLabel,
	RETURN_METHODS,
	RETURN_STATUSES,
} from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { Caller, History, ReturnDetail, ReturnItemView } from "../../ledger/types.ts";
import { ConflictDiff, type ConflictField } from "../components/conflict.tsx";
import {
	EmptyState,
	Field,
	FormAlert,
	type FormValues,
	Hidden,
	Input,
	Select,
	Textarea,
	ui,
} from "@kouden/ui";
import { HistoryList } from "../components/history.tsx";
import { formatDate } from "../format.ts";
import { StatusBadge } from "./returns.tsx";

const STATUS_OPTIONS = Object.entries(RETURN_STATUSES).map(([value, label]) => ({ value, label }));
const METHOD_OPTIONS = Object.entries(RETURN_METHODS).map(([value, label]) => ({ value, label }));

export const RETURN_CONFLICT_FIELDS: readonly ConflictField[] = [
	{ name: "status", label: "状況", options: RETURN_STATUSES },
	{ name: "method", label: "渡し方", options: RETURN_METHODS },
	{ name: "onDayAmount", label: "当日返しの額" },
	{ name: "dueDate", label: "期限" },
	{ name: "arrangedAt", label: "手配日" },
	{ name: "shippedAt", label: "発送日" },
	{ name: "shipName", label: "送付先の宛名" },
	{ name: "shipPostalCode", label: "送付先の郵便番号" },
	{ name: "shipAddress", label: "送付先の住所" },
	{ name: "shipPhone", label: "送付先の電話番号" },
	{ name: "notes", label: "備考" },
];

/** 保存済みの内容をフォームの値にする */
export function returnFormValues(ret: ReturnDetail): FormValues {
	return {
		version: String(ret.version),
		status: ret.status,
		method: ret.method ?? undefined,
		onDayAmount: ret.onDayAmount > 0 ? String(ret.onDayAmount) : undefined,
		dueDate: ret.dueDate ?? undefined,
		arrangedAt: ret.arrangedAt ?? undefined,
		shippedAt: ret.shippedAt ?? undefined,
		shipName: ret.shipName ?? undefined,
		shipPostalCode: ret.shipPostalCode ?? undefined,
		shipAddress: ret.shipAddress ?? undefined,
		shipPhone: ret.shipPhone ?? undefined,
		notes: ret.notes ?? undefined,
	};
}

/** 香典返し 1 件（E6-4）: 状況・送付先・明細・変更履歴 */
export const ReturnEditPage: FC<{
	kouden: KoudenContext;
	caller: Caller;
	ret: ReturnDetail;
	items: ReturnItemView[];
	history: History;
	dueDate: string | null;
	values: FormValues;
	errors?: FieldErrors;
	lineValues?: FormValues;
	lineErrors?: FieldErrors;
	/** 競合したときの最新の内容（自分の入力は values） */
	conflictLatest?: FormValues | undefined;
	error?: string | undefined;
	notice?: string | undefined;
}> = ({
	kouden,
	caller,
	ret,
	items,
	history,
	dueDate,
	values,
	errors = {},
	lineValues = {},
	lineErrors = {},
	conflictLatest,
	error,
	notice,
}) => {
	const base = `/k/${kouden.id}`;
	const path = `${base}/returns/${ret.id}`;
	const canWrite = can(caller.role, "ledger.write");
	const person = ret.person;
	const label = personLabel(person);
	const activeItems = items.filter((i) => i.isActive);
	return (
		<div class="mx-auto max-w-3xl space-y-6">
			<a href={`${base}/returns`} class="text-sm text-muted hover:text-ink">
				← 香典返しの一覧
			</a>
			{error && (
				<p role="alert" class={ui.alert}>
					{error}
				</p>
			)}
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}
			<section class={`${ui.card} space-y-2`} aria-labelledby="return-person">
				<div class="flex flex-wrap items-center gap-2">
					<h2 id="return-person" class={ui.h2}>
						<a href={`${base}/persons/${person.id}`} class={ui.link}>
							{label}
						</a>{" "}
						様への香典返し
					</h2>
					<StatusBadge status={ret.status} />
				</div>
				<p data-live-watch={`return:${ret.id}`} hidden role="status" class={ui.notice}>
					他の人がこの香典返しを更新しました。保存すると、違いを確認する画面になります。
				</p>
				<span data-editing-target={`return:${ret.id}`} class="block text-sm text-danger"></span>
				<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
					<dt class="text-muted">いただいた額</dt>
					<dd class="tabular-nums">{formatYen(person.kodenTotal)}</dd>
					<dt class="text-muted">差出人の住所</dt>
					<dd>
						{person.postalCode && `〒${person.postalCode} `}
						{person.address ?? "（未入力）"}
					</dd>
					{dueDate && (
						<>
							<dt class="text-muted">香典帳の期限</dt>
							<dd>{formatDate(dueDate)}</dd>
						</>
					)}
				</dl>
			</section>

			<section class={`${ui.card} space-y-4`} aria-labelledby="return-lines">
				<h2 id="return-lines" class={ui.h2}>
					品
				</h2>
				{ret.lines.length === 0 ? (
					<EmptyState
						compact
						title="まだ品がありません"
						description={
							canWrite ? "下で、カタログから選ぶか品名と単価を入れて追加します。" : undefined
						}
					/>
				) : (
					<table class={ui.table}>
						<thead>
							<tr>
								<th class={ui.th} scope="col">
									品名
								</th>
								<th class={`${ui.th} text-right`} scope="col">
									単価
								</th>
								<th class={`${ui.th} text-right`} scope="col">
									数量
								</th>
								<th class={ui.th} scope="col">
									<span class="sr-only">操作</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{ret.lines.map((l) => (
								<tr>
									<td class={ui.td}>{l.name}</td>
									<td class={`${ui.td} text-right tabular-nums`}>{formatYen(l.unitPrice)}</td>
									<td class={`${ui.td} text-right tabular-nums`}>{l.quantity}</td>
									<td class={`${ui.td} text-right`}>
										{canWrite && (
											<form method="post" action={`${path}/lines/${l.id}/delete`}>
												<Hidden name="version" value={ret.version} />
												<button type="submit" class={ui.buttonSmall} aria-label={`${l.name}を外す`}>
													外す
												</button>
											</form>
										)}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<th scope="row" class={`${ui.td} text-left font-medium`}>
									合計
								</th>
								<td colspan={2} class={`${ui.td} text-right font-medium tabular-nums`}>
									{formatYen(ret.linesTotal)}
								</td>
								<td class={ui.td}></td>
							</tr>
						</tfoot>
					</table>
				)}
				{canWrite && (
					<form
						method="post"
						action={`${path}/lines`}
						class="space-y-3 border-t border-line pt-4"
						novalidate
					>
						<Hidden name="version" value={ret.version} />
						<FormAlert errors={lineErrors} />
						<div class="grid gap-3 sm:grid-cols-4">
							<Field
								label="カタログから選ぶ"
								name="itemId"
								idPrefix="line"
								class="sm:col-span-4"
								error={lineErrors.itemId}
							>
								<Select
									name="itemId"
									idPrefix="line"
									values={lineValues}
									errors={lineErrors}
									blank="選ばない（下に品名と単価を入力）"
									options={activeItems.map((i) => ({
										value: i.id,
										label: `${i.name}（${formatYen(i.price)}）`,
									}))}
								/>
							</Field>
							<Field
								label="品名"
								name="name"
								idPrefix="line"
								class="sm:col-span-2"
								error={lineErrors.name}
							>
								<Input name="name" idPrefix="line" values={lineValues} errors={lineErrors} />
							</Field>
							<Field
								label="単価（円）"
								name="unitPrice"
								idPrefix="line"
								error={lineErrors.unitPrice}
							>
								<Input
									name="unitPrice"
									idPrefix="line"
									values={lineValues}
									errors={lineErrors}
									inputmode="numeric"
								/>
							</Field>
							<Field label="数量" name="quantity" idPrefix="line" error={lineErrors.quantity}>
								<Input
									name="quantity"
									idPrefix="line"
									values={lineValues}
									errors={lineErrors}
									inputmode="numeric"
									placeholder="1"
								/>
							</Field>
						</div>
						<button type="submit" class={ui.buttonSecondary}>
							品を追加
						</button>
					</form>
				)}
			</section>

			<section class={`${ui.card} space-y-4`} aria-labelledby="return-status">
				<h2 id="return-status" class={ui.h2}>
					状況・送付先
				</h2>
				{conflictLatest && (
					<ConflictDiff
						fields={RETURN_CONFLICT_FIELDS}
						mine={values}
						latest={conflictLatest}
						discardHref={path}
					/>
				)}
				{canWrite ? (
					<form
						method="post"
						action={path}
						class="space-y-4"
						novalidate
						data-editing-entity="return"
						data-editing-id={ret.id}
					>
						<Hidden name="version" value={values.version ?? ret.version} />
						<FormAlert errors={errors} />
						<div class="grid gap-4 sm:grid-cols-3">
							<Field label="状況" name="status" error={errors.status}>
								<Select name="status" values={values} errors={errors} options={STATUS_OPTIONS} />
							</Field>
							<Field label="渡し方" name="method" error={errors.method}>
								<Select
									name="method"
									values={values}
									errors={errors}
									options={METHOD_OPTIONS}
									blank="未定"
								/>
							</Field>
							<Field label="当日返しの額（円）" name="onDayAmount" error={errors.onDayAmount}>
								<Input name="onDayAmount" values={values} errors={errors} inputmode="numeric" />
							</Field>
							<Field label="期限" name="dueDate" error={errors.dueDate} hint="空欄なら香典帳の期限">
								<Input name="dueDate" type="date" values={values} errors={errors} />
							</Field>
							<Field
								label="手配日"
								name="arrangedAt"
								error={errors.arrangedAt}
								hint="「手配済み」にすると今日の日付が入ります"
							>
								<Input name="arrangedAt" type="date" values={values} errors={errors} />
							</Field>
							<Field label="発送日" name="shippedAt" error={errors.shippedAt}>
								<Input name="shippedAt" type="date" values={values} errors={errors} />
							</Field>
						</div>
						<fieldset class="space-y-3">
							<legend class={ui.label}>送付先（空欄なら差出人の住所に送ります）</legend>
							<div class="grid gap-4 sm:grid-cols-3">
								<Field label="宛名" name="shipName" error={errors.shipName}>
									<Input name="shipName" values={values} errors={errors} placeholder={label} />
								</Field>
								<Field label="郵便番号" name="shipPostalCode" error={errors.shipPostalCode}>
									<Input
										name="shipPostalCode"
										values={values}
										errors={errors}
										inputmode="numeric"
										placeholder={person.postalCode ?? undefined}
									/>
								</Field>
								<Field label="電話番号" name="shipPhone" error={errors.shipPhone}>
									<Input
										name="shipPhone"
										values={values}
										errors={errors}
										inputmode="tel"
										placeholder={person.phone ?? undefined}
									/>
								</Field>
							</div>
							<Field label="住所" name="shipAddress" error={errors.shipAddress}>
								<Input
									name="shipAddress"
									values={values}
									errors={errors}
									placeholder={person.address ?? undefined}
								/>
							</Field>
						</fieldset>
						<Field label="備考" name="notes" error={errors.notes}>
							<Textarea name="notes" values={values} errors={errors} />
						</Field>
						<button type="submit" class={ui.buttonPrimary}>
							保存する
						</button>
					</form>
				) : (
					<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
						<dt class="text-muted">渡し方</dt>
						<dd>{ret.method ? RETURN_METHODS[ret.method] : "未定"}</dd>
						<dt class="text-muted">当日返しの額</dt>
						<dd class="tabular-nums">{ret.onDayAmount > 0 ? formatYen(ret.onDayAmount) : "—"}</dd>
						<dt class="text-muted">期限</dt>
						<dd>{formatDate(ret.dueDate ?? dueDate) || "—"}</dd>
						<dt class="text-muted">手配日</dt>
						<dd>{formatDate(ret.arrangedAt) || "—"}</dd>
						<dt class="text-muted">発送日</dt>
						<dd>{formatDate(ret.shippedAt) || "—"}</dd>
						<dt class="text-muted">送付先</dt>
						<dd>
							{ret.shipName ?? label} {ret.shipPostalCode && `〒${ret.shipPostalCode}`}{" "}
							{ret.shipAddress ?? person.address ?? ""}
						</dd>
						<dt class="text-muted">送付先の電話番号</dt>
						<dd>{ret.shipPhone ?? person.phone ?? "—"}</dd>
						{ret.notes && (
							<>
								<dt class="text-muted">備考</dt>
								<dd class="whitespace-pre-wrap">{ret.notes}</dd>
							</>
						)}
					</dl>
				)}
			</section>

			<HistoryList history={history} />

			{canWrite && (
				<form method="post" action={`${path}/delete`} class="text-right">
					<Hidden name="version" value={ret.version} />
					<button type="submit" class={ui.buttonSmall}>
						この香典返しを取り消す
					</button>
				</form>
			)}
		</div>
	);
};
