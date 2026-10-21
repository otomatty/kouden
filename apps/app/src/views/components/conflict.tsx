import type { FC } from "hono/jsx";
import { ui } from "../ui.ts";
import type { FormValues } from "./form.tsx";

export interface ConflictField {
	name: string;
	label: string;
	/** 値 → 表示名（選択肢の項目） */
	options?: Record<string, string>;
}

function show(f: ConflictField, v: string | undefined): string {
	const value = v?.trim() ?? "";
	if (value === "") return "（なし）";
	return f.options?.[value] ?? value;
}

/**
 * 保存時の競合（E8-3）。開いた後に他の人が更新していた場合に、自分の入力と最新の内容の違いを示す。
 * フォームには自分の入力と最新の version が入っているので、そのまま保存すれば上書きになる。
 */
export const ConflictDiff: FC<{
	fields: readonly ConflictField[];
	mine: FormValues;
	latest: FormValues;
	discardHref: string;
}> = ({ fields, mine, latest, discardHref }) => {
	const changed = fields.filter(
		(f) => (mine[f.name]?.trim() ?? "") !== (latest[f.name]?.trim() ?? ""),
	);
	return (
		<div role="alert" class="space-y-3 rounded-lg border border-danger/40 bg-danger/5 p-4 text-sm">
			<p class="font-medium text-danger">
				開いている間に他の人がこの記録を更新しました。違いを確認して、自分の入力で上書きするか、破棄してください。
			</p>
			{changed.length > 0 ? (
				<table class={`${ui.table} bg-surface`}>
					<thead>
						<tr>
							<th class={ui.th} scope="col">
								項目
							</th>
							<th class={ui.th} scope="col">
								あなたの入力
							</th>
							<th class={ui.th} scope="col">
								最新の内容
							</th>
						</tr>
					</thead>
					<tbody>
						{changed.map((f) => (
							<tr>
								<th scope="row" class={`${ui.td} text-left font-normal`}>
									{f.label}
								</th>
								<td class={`${ui.td} whitespace-pre-wrap`}>{show(f, mine[f.name])}</td>
								<td class={`${ui.td} whitespace-pre-wrap`}>{show(f, latest[f.name])}</td>
							</tr>
						))}
					</tbody>
				</table>
			) : (
				<p>入力内容と最新の内容に違いはありません。</p>
			)}
			<p>
				下の「保存する」で自分の入力を保存します。{" "}
				<a href={discardHref} class={ui.link}>
					自分の入力を破棄して最新の内容を表示
				</a>
			</p>
		</div>
	);
};
