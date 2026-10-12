import { can, formatYen, RETURN_RATIOS } from "@kouden/domain";
import type { FC } from "hono/jsx";
import { returnItemImageUrl } from "../../kouden/files.ts";
import type { KoudenContext } from "../../kouden/store.ts";
import type { Caller, ReturnItemView, ReturnRuleView } from "../../ledger/types.ts";
import { Field, Hidden, Input, Select, Textarea } from "../components/form.tsx";
import { ui } from "../ui.ts";
import { MoveButtons } from "./settings.tsx";
import { LiveRegion } from "./shell.tsx";

const RATIO_OPTIONS = Object.entries(RETURN_RATIOS).map(([value, label]) => ({ value, label }));

const ratioValue = (r: ReturnRuleView) => `${r.ratioNumerator}/${r.ratioDenominator}`;
const ratioLabel = (r: ReturnRuleView) =>
	RETURN_RATIOS[ratioValue(r) as keyof typeof RETURN_RATIOS] ?? ratioValue(r);

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp";

/** 香典返しの設定: 返礼品カタログ（E6-1）と金額帯ルール（E6-2） */
export const ReturnSettingsPage: FC<{
	kouden: KoudenContext;
	caller: Caller;
	items: ReturnItemView[];
	rules: ReturnRuleView[];
	error?: string | undefined;
	notice?: string | undefined;
}> = ({ kouden, caller, items, rules, error, notice }) => (
	<div class="mx-auto max-w-3xl space-y-8">
		<a href={`/k/${kouden.id}/returns`} class="text-sm text-muted hover:text-ink">
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
		<ReturnItemsSection kouden={kouden} caller={caller} items={items} />
		<ReturnRulesSection kouden={kouden} caller={caller} items={items} rules={rules} />
	</div>
);

export const ReturnItemsSection: FC<{
	kouden: KoudenContext;
	caller: Caller;
	items: ReturnItemView[];
}> = ({ kouden, caller, items }) => {
	const base = `/k/${kouden.id}`;
	const canEdit = can(caller.role, "settings.write");
	return (
		<LiveRegion
			id="return-items"
			entities={["return_item"]}
			url={`${base}/returns/settings?partial=items`}
		>
			<section aria-labelledby="items" class={`${ui.card} space-y-4`}>
				<h2 id="items" class={ui.h2}>
					返礼品カタログ
				</h2>
				<p class="text-sm text-muted">
					一括提案で選ばれる品です。無効にした品は提案・明細の選択肢に出ません。画像は
					JPEG・PNG・WebP（5 MB まで）です。
				</p>
				{items.length === 0 && <p class="text-sm text-muted">まだ品がありません。</p>}
				<ul class="space-y-4">
					{items.map((item, i) => {
						const image = returnItemImageUrl(kouden.id, item.imageKey);
						const prefix = `item-${item.id}`;
						return (
							<li class="space-y-3 border-b border-line pb-4">
								<div class="flex items-start gap-3">
									{image ? (
										<img
											src={image}
											alt={item.name}
											width="80"
											height="80"
											loading="lazy"
											class="size-20 shrink-0 rounded-lg border border-line object-cover"
										/>
									) : (
										<div class="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">
											画像なし
										</div>
									)}
									<div class="min-w-0 flex-1 text-sm">
										<p class="font-medium">
											{item.name}
											{!item.isActive && <span class={`${ui.badge} ml-2`}>無効</span>}
										</p>
										<p class="tabular-nums">{formatYen(item.price)}</p>
										{item.category && <p class="text-muted">{item.category}</p>}
										{item.description && (
											<p class="whitespace-pre-wrap text-muted">{item.description}</p>
										)}
									</div>
								</div>
								{canEdit && (
									<>
										<details>
											<summary class="cursor-pointer text-sm text-accent">編集する</summary>
											<form
												method="post"
												action={`${base}/return-items/${item.id}`}
												enctype="multipart/form-data"
												class="mt-3 space-y-3"
											>
												<Hidden name="version" value={item.version} />
												<ItemFields
													prefix={prefix}
													values={{
														name: item.name,
														category: item.category ?? undefined,
														price: String(item.price),
														description: item.description ?? undefined,
													}}
												/>
												{item.imageKey && (
													<label class="flex items-center gap-2 text-sm">
														<input
															type="checkbox"
															name="removeImage"
															value="1"
															class="size-4 accent-accent"
														/>
														画像を外す
													</label>
												)}
												<button type="submit" class={ui.buttonSmall}>
													保存
												</button>
											</form>
										</details>
										<div class="flex flex-wrap gap-2">
											<MoveButtons
												action={`${base}/return-items/${item.id}/move`}
												first={i === 0}
												last={i === items.length - 1}
												label={item.name}
											/>
											<form method="post" action={`${base}/return-items/${item.id}/active`}>
												<Hidden name="active" value={item.isActive ? "0" : "1"} />
												<button type="submit" class={ui.buttonSmall}>
													{item.isActive ? "無効にする" : "有効にする"}
												</button>
											</form>
											<form method="post" action={`${base}/return-items/${item.id}/delete`}>
												<button
													type="submit"
													class={ui.buttonSmall}
													disabled={item.usedCount > 0}
													title={
														item.usedCount > 0 ? "香典返し・ルールで使われています" : undefined
													}
												>
													削除
												</button>
											</form>
										</div>
									</>
								)}
							</li>
						);
					})}
				</ul>
				{canEdit && (
					<form
						method="post"
						action={`${base}/return-items`}
						enctype="multipart/form-data"
						class="space-y-3 border-t border-line pt-4"
					>
						<h3 class={ui.h3}>品を追加</h3>
						<ItemFields prefix="new-item" values={{}} />
						<button type="submit" class={ui.buttonSecondary}>
							追加する
						</button>
					</form>
				)}
			</section>
		</LiveRegion>
	);
};

const ItemFields: FC<{ prefix: string; values: Record<string, string | undefined> }> = ({
	prefix,
	values,
}) => (
	<>
		<div class="grid gap-3 sm:grid-cols-3">
			<Field label="品名" name="name" idPrefix={prefix} required class="sm:col-span-2">
				<Input name="name" idPrefix={prefix} values={values} />
			</Field>
			<Field label="価格（円）" name="price" idPrefix={prefix} required>
				<Input name="price" idPrefix={prefix} values={values} inputmode="numeric" />
			</Field>
			<Field label="分類" name="category" idPrefix={prefix}>
				<Input name="category" idPrefix={prefix} values={values} placeholder="例: お茶" />
			</Field>
			<Field label="画像" name="image" idPrefix={prefix} class="sm:col-span-2">
				<input
					id={`${prefix}-image`}
					name="image"
					type="file"
					accept={ACCEPT_IMAGES}
					class="block w-full text-sm"
				/>
			</Field>
		</div>
		<Field label="説明" name="description" idPrefix={prefix}>
			<Textarea name="description" idPrefix={prefix} values={values} rows={2} />
		</Field>
	</>
);

export const ReturnRulesSection: FC<{
	kouden: KoudenContext;
	caller: Caller;
	items: ReturnItemView[];
	rules: ReturnRuleView[];
}> = ({ kouden, caller, items, rules }) => {
	const base = `/k/${kouden.id}`;
	const canEdit = can(caller.role, "settings.write");
	const itemOptions = (current: string | null) =>
		items
			.filter((i) => i.isActive || i.id === current)
			.map((i) => ({ value: i.id, label: `${i.name}（${formatYen(i.price)}）` }));
	return (
		<LiveRegion
			id="return-rules"
			entities={["return_rule", "return_item"]}
			url={`${base}/returns/settings?partial=rules`}
		>
			<section aria-labelledby="rules" class={`${ui.card} space-y-4`}>
				<h2 id="rules" class={ui.h2}>
					金額帯ルール
				</h2>
				<p class="text-sm text-muted">
					いただいた額の帯ごとに、返礼の目安（半返しなど）と推奨品を決めます。当てはまるルールがなければ半返しで、目安額に近い品を提案します。帯が重なる場合は下限の高い方を使います。
				</p>
				{rules.length === 0 && <p class="text-sm text-muted">まだルールがありません。</p>}
				<ul class="space-y-3">
					{rules.map((r) =>
						canEdit ? (
							<li class="flex flex-wrap items-end gap-2 border-b border-line pb-3">
								<form
									method="post"
									action={`${base}/return-rules/${r.id}`}
									class="flex flex-1 flex-wrap items-end gap-2"
								>
									<Hidden name="version" value={r.version} />
									<RuleFields
										prefix={`rule-${r.id}`}
										values={{
											minAmount: String(r.minAmount),
											maxAmount: r.maxAmount === null ? undefined : String(r.maxAmount),
											ratio: ratioValue(r),
											suggestedItemId: r.suggestedItemId ?? undefined,
										}}
										itemOptions={itemOptions(r.suggestedItemId)}
									/>
									<button type="submit" class={ui.buttonSmall}>
										保存
									</button>
								</form>
								<form method="post" action={`${base}/return-rules/${r.id}/delete`}>
									<button type="submit" class={ui.buttonSmall}>
										削除
									</button>
								</form>
							</li>
						) : (
							<li class="text-sm">
								{formatYen(r.minAmount)} 〜 {r.maxAmount === null ? "" : formatYen(r.maxAmount)}:{" "}
								{ratioLabel(r)}
								{r.suggestedItemName && `・推奨品 ${r.suggestedItemName}`}
							</li>
						),
					)}
				</ul>
				{canEdit && (
					<form
						method="post"
						action={`${base}/return-rules`}
						class="flex flex-wrap items-end gap-2 border-t border-line pt-4"
					>
						<RuleFields
							prefix="new-rule"
							values={{ ratio: "1/2" }}
							itemOptions={itemOptions(null)}
						/>
						<button type="submit" class={ui.buttonSecondary}>
							ルールを追加
						</button>
					</form>
				)}
			</section>
		</LiveRegion>
	);
};

const RuleFields: FC<{
	prefix: string;
	values: Record<string, string | undefined>;
	itemOptions: { value: string; label: string }[];
}> = ({ prefix, values, itemOptions }) => (
	<>
		<Field label="下限（円）" name="minAmount" idPrefix={prefix} class="w-32">
			<Input name="minAmount" idPrefix={prefix} values={values} inputmode="numeric" />
		</Field>
		<Field label="上限（円・空欄で上限なし）" name="maxAmount" idPrefix={prefix} class="w-48">
			<Input name="maxAmount" idPrefix={prefix} values={values} inputmode="numeric" />
		</Field>
		<Field label="目安" name="ratio" idPrefix={prefix}>
			<Select name="ratio" idPrefix={prefix} values={values} options={RATIO_OPTIONS} />
		</Field>
		<Field label="推奨品" name="suggestedItemId" idPrefix={prefix} class="min-w-48 flex-1">
			<Select
				name="suggestedItemId"
				idPrefix={prefix}
				values={values}
				options={itemOptions}
				blank="なし（目安額に近い品）"
			/>
		</Field>
	</>
);
