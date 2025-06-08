import type * as React from "react";
import type { MemberOption } from "./display-settings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterOption {
	/** フィルターオプションの値 */
	value: string;
	/** フィルターオプションのラベル */
	label: string;
	/** オプションのアイコン（任意） */
	icon?: React.ReactNode;
	/** オプションの説明文（任意） */
	description?: string;
}

export interface MobileDisplaySettingsProps {
	viewScope: "own" | "all" | "others";
	onViewScopeChange: (scope: "own" | "all" | "others") => void;
	members: MemberOption[];
	selectedMemberIds: string[];
	onMemberSelectionChange: (selectedIds: string[]) => void;
	showDateFilter?: boolean;
	dateRange?: { from?: Date; to?: Date };
	onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
	duplicateFilter?: boolean;
	onDuplicateFilterChange?: (value: boolean) => void;
	/** フィルタリングを表示するか */
	showFilter?: boolean;
	/** 選択中のフィルターカラム */
	filterColumn?: string;
	/** フィルターオプション一覧 */
	filterOptions?: FilterOption[];
	/** フィルターカラム変更時 */
	onFilterColumnChange?: (value: string) => void;
}

/**
 * モバイル向け表示設定コンポーネント
 *
 * メンバーや日付フィルターなどの表示設定を縦スクロール可能なモバイルUIで提供します。
 */
export function MobileDisplaySettings({
	viewScope,
	onViewScopeChange,
	members,
	selectedMemberIds,
	onMemberSelectionChange,
	showDateFilter = false,
	dateRange = {},
	onDateRangeChange,
	duplicateFilter = false,
	onDuplicateFilterChange,
	showFilter = true,
	filterColumn,
	filterOptions = [],
	onFilterColumnChange,
}: MobileDisplaySettingsProps) {
	// クリアボタンのハンドラー
	const handleClearAll = () => {
		onViewScopeChange("all");
		onMemberSelectionChange(members.map((m) => m.value));
		onDateRangeChange?.({});
		onDuplicateFilterChange?.(false);
	};

	return (
		<div className="p-4 space-y-6">
			{/* フィルタリング */}
			{showFilter && filterOptions && filterOptions.length > 0 && onFilterColumnChange && (
				<div>
					<div className="mb-2 text-sm font-semibold">フィルタリング</div>
					<RadioGroup
						value={filterColumn}
						onValueChange={(value) => {
							onFilterColumnChange(value);
						}}
						className="space-y-2"
					>
						{filterOptions.map((option) => (
							<div
								key={option.value}
								className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
							>
								<RadioGroupItem value={option.value} id={`mobile-filter-${option.value}`} />
								<Label
									htmlFor={`mobile-filter-${option.value}`}
									className="flex-1 cursor-pointer flex items-center gap-2"
								>
									{option.icon}
									<span>{option.label}</span>
								</Label>
							</div>
						))}
					</RadioGroup>
				</div>
			)}

			{/* 表示対象 */}
			<div>
				<div className="mb-2 text-sm font-semibold">表示対象</div>
				<RadioGroup value={viewScope} onValueChange={onViewScopeChange} className="space-y-2">
					{(["all", "own", "others"] as const).map((scope) => {
						const label = scope === "all" ? "全員" : scope === "own" ? "自分のみ" : "自分以外";
						return (
							<div
								key={scope}
								className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
							>
								<RadioGroupItem value={scope} id={`scope-${scope}`} />
								<Label htmlFor={`scope-${scope}`} className="flex-1 cursor-pointer">
									{label}
								</Label>
							</div>
						);
					})}
				</RadioGroup>
			</div>

			{/* メンバー */}
			<div>
				<div className="mb-2 text-sm font-semibold">メンバー</div>
				<div className="space-y-2 max-h-40 overflow-y-auto">
					{members.map((member) => (
						<div
							key={member.value}
							className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
						>
							<Checkbox
								checked={selectedMemberIds.includes(member.value)}
								onCheckedChange={(checked) => {
									const newSelected = checked
										? [...selectedMemberIds, member.value]
										: selectedMemberIds.filter((id) => id !== member.value);
									onMemberSelectionChange(newSelected);
								}}
							/>
							<button
								type="button"
								className="flex-1 text-left"
								onClick={() => {
									const checked = !selectedMemberIds.includes(member.value);
									const newSelected = checked
										? [...selectedMemberIds, member.value]
										: selectedMemberIds.filter((id) => id !== member.value);
									onMemberSelectionChange(newSelected);
								}}
							>
								{member.label}
							</button>
						</div>
					))}
				</div>
			</div>

			{/* 作成日フィルター */}
			{showDateFilter && onDateRangeChange && (
				<div>
					<div className="mb-2 text-sm font-semibold">作成日</div>
					<div className="flex items-center space-x-2">
						<Input
							type="date"
							value={dateRange.from ? dateRange.from.toISOString().split("T")[0] : ""}
							onChange={(e) =>
								onDateRangeChange({
									from: e.target.value ? new Date(e.target.value) : undefined,
									to: dateRange.to,
								})
							}
						/>
						<span>〜</span>
						<Input
							type="date"
							value={dateRange.to ? dateRange.to.toISOString().split("T")[0] : ""}
							onChange={(e) =>
								onDateRangeChange({
									from: dateRange.from,
									to: e.target.value ? new Date(e.target.value) : undefined,
								})
							}
						/>
					</div>
					<div className="flex justify-end mt-2">
						<Button variant="outline" size="sm" onClick={() => onDateRangeChange({})}>
							クリア
						</Button>
					</div>
				</div>
			)}

			{/* 重複フィルター */}
			{onDuplicateFilterChange && (
				<div>
					<div className="mb-2 text-sm font-semibold">重複のみ表示</div>
					<div className="flex items-center space-x-2">
						<Checkbox
							checked={duplicateFilter}
							onCheckedChange={(val) => onDuplicateFilterChange(val as boolean)}
						/>
						<span>重複のみ表示</span>
					</div>
				</div>
			)}

			{/* 全設定クリア */}
			<Button variant="outline" size="sm" className="w-full" onClick={handleClearAll}>
				設定をクリア
			</Button>
		</div>
	);
}
