import { personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { PersonView } from "../../ledger/types.ts";

/**
 * 既存の差出人の候補（E5-1）。氏名・カナ・団体名の入力に合わせて htmx で差し替える。
 * 候補がなければ何も出さない（= 新しい差出人として登録）。
 */
export const PersonCandidates: FC<{ persons: PersonView[]; selected?: string | undefined }> = ({
	persons,
	selected,
}) => {
	if (persons.length === 0) return null;
	const radio = "h-4 w-4 accent-accent";
	return (
		<fieldset class="space-y-2 rounded-lg border border-line bg-paper p-3">
			<legend class="px-1 text-sm font-medium">同じ人が登録されていませんか？</legend>
			<label class="flex items-center gap-2 text-sm">
				<input type="radio" name="personId" value="" checked={!selected} class={radio} />
				新しい差出人として登録する
			</label>
			{persons.map((p) => (
				<label class="flex items-center gap-2 text-sm">
					<input
						type="radio"
						name="personId"
						value={p.id}
						checked={selected === p.id}
						class={radio}
					/>
					<span>
						<span class="font-medium">{personLabel(p)}</span>
						<span class="ml-2 text-muted">
							{[p.nameKana, p.relationshipName, p.address, `${p.giftCount} 件`]
								.filter(Boolean)
								.join("・")}
						</span>
					</span>
				</label>
			))}
		</fieldset>
	);
};
