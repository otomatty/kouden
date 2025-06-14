import { useState, useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types/additional-select";
import { getDefaultColorByVariant, type SelectColorConfig } from "@/types/select-colors";

interface ColoredSelectCellProps {
	value: string | number | boolean | null;
	options: SelectOption[];
	onSave: (value: string | boolean) => void;
	className?: string;
}

/**
 * 色付きセレクトボックスコンポーネント
 * 各オプションに独自の色を設定可能
 */
export function ColoredSelectCell({ value, options, onSave, className }: ColoredSelectCellProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleSelect = useCallback(
		(newValue: string) => {
			// boolean型の選択肢の場合
			if (typeof value === "boolean") {
				onSave(newValue === "true");
				return;
			}
			// その他の場合
			if (newValue !== value) {
				onSave(newValue);
			}
			setIsOpen(false);
		},
		[value, onSave],
	);

	const currentOption = options.find(
		(opt) => opt.value === (typeof value === "boolean" ? value.toString() : value),
	);

	/**
	 * オプションの色設定を取得
	 */
	const getOptionColors = (option: SelectOption): SelectColorConfig => {
		// カスタム色が設定されている場合はそれを使用
		if (option.colors) {
			return {
				background: option.colors.background || "transparent",
				text: option.colors.text || "currentColor",
				border: option.colors.border || "currentColor",
			};
		}

		// バリアントからデフォルト色を取得
		const defaultColors = getDefaultColorByVariant(option.variant);
		if (defaultColors) {
			return defaultColors;
		}

		// フォールバック
		return {
			background: "transparent",
			text: "currentColor",
			border: "currentColor",
		};
	};

	/**
	 * 色付きオプションアイテムコンポーネント
	 */
	const ColoredOptionItem = ({ option }: { option: SelectOption }) => {
		const colors = getOptionColors(option);

		return (
			<div
				className="flex items-center justify-center px-2 py-1 rounded text-xs font-medium min-w-0"
				style={{
					backgroundColor: colors.background,
					color: colors.text,
					border: `1px solid ${colors.border}`,
				}}
			>
				<span className="truncate">{option.label}</span>
			</div>
		);
	};

	return (
		<Select
			open={isOpen}
			onOpenChange={setIsOpen}
			value={value?.toString() ?? ""}
			onValueChange={handleSelect}
		>
			<SelectTrigger
				className={cn(
					"h-8 w-full border-none shadow-none bg-transparent hover:bg-accent hover:text-accent-foreground p-1",
					className,
				)}
			>
				<SelectValue>
					{currentOption ? (
						<ColoredOptionItem option={currentOption} />
					) : (
						<span className="text-muted-foreground">{value || "選択してください"}</span>
					)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => {
					const colors = getOptionColors(option);

					return (
						<SelectItem key={option.value} value={option.value} className="p-2">
							<div
								className="flex items-center justify-center px-3 py-1.5 rounded text-sm font-medium min-w-0 transition-colors w-full"
								style={{
									backgroundColor: colors.background,
									color: colors.text,
									border: `1px solid ${colors.border}`,
								}}
								onMouseEnter={(e) => {
									if (colors.hoverBackground) {
										e.currentTarget.style.backgroundColor = colors.hoverBackground;
									}
									if (colors.hoverText) {
										e.currentTarget.style.color = colors.hoverText;
									}
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = colors.background;
									e.currentTarget.style.color = colors.text;
								}}
							>
								<span className="truncate">{option.label}</span>
							</div>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
