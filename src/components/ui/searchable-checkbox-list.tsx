/**
 * 検索可能なチェックボックスリストを提供するコンポーネント。
 * 複数選択が可能で、選択された項目はバッジとして表示されます。
 *
 * @example
 * ```tsx
 * const items = [
 *   { value: "1", label: "選択肢1" },
 *   { value: "2", label: "選択肢2" },
 * ];
 *
 * const [selectedItems, setSelectedItems] = useState<string[]>([]);
 *
 * return (
 *   <SearchableCheckboxList
 *     items={items}
 *     selectedItems={selectedItems}
 *     onSelectionChange={setSelectedItems}
 *     searchPlaceholder="アイテムを検索..."
 *   />
 * );
 * ```
 *
 * @param props
 * @param props.items - 選択可能な項目の配列。各項目はvalue（一意の識別子）とlabel（表示名）を持つ
 * @param props.selectedItems - 現在選択されている項目のvalue配列
 * @param props.onSelectionChange - 選択が変更された時に呼び出されるコールバック関数
 * @param props.searchPlaceholder - 検索入力欄のプレースホルダーテキスト（デフォルト: "検索..."）
 * @param props.className - コンポーネントのルート要素に適用されるカスタムクラス名
 *
 * @features
 * - 検索機能付きの複数選択可能なチェックボックスリスト
 * - 選択された項目はバッジとして表示され、個別に削除可能
 * - 最大10件までの検索結果を表示
 * - クリックアウトサイドで自動的にリストを閉じる
 * - アクセシビリティ対応（キーボード操作、スクリーンリーダー対応）
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, ChevronDown } from "lucide-react";

export type CheckboxListItem = {
	value: string;
	label: string;
};

export interface SearchableCheckboxListProps {
	/**
	 * 選択可能な項目の配列。各項目はvalue（一意の識別子）とlabel（表示名）を持つ
	 */
	items: CheckboxListItem[];
	/**
	 * 現在選択されている項目のvalue配列
	 */
	selectedItems: string[];
	/**
	 * 選択が変更された時に呼び出されるコールバック関数
	 */
	onSelectionChange: (selectedValues: string[]) => void;
	/**
	 * 検索入力欄のプレースホルダーテキスト（デフォルト: "検索..."）
	 */
	searchPlaceholder?: string;
	/**
	 * コンポーネントのルート要素に適用されるカスタムクラス名
	 */
	className?: string;
}

export function SearchableCheckboxList({
	items,
	selectedItems,
	onSelectionChange,
	searchPlaceholder = "検索...",
	className,
}: SearchableCheckboxListProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isOpen, setIsOpen] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	// クリックイベントのハンドラーを追加
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const filteredItems = React.useMemo(() => {
		return items
			.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
			.slice(0, 10);
	}, [items, searchQuery]);

	const selectedItemsData = React.useMemo(() => {
		return items.filter((item) => selectedItems.includes(item.value));
	}, [items, selectedItems]);

	const handleCheckboxChange = (value: string, checked: boolean) => {
		if (checked) {
			onSelectionChange([...selectedItems, value]);
		} else {
			onSelectionChange(selectedItems.filter((item) => item !== value));
		}
	};

	const handleRemoveItem = (value: string) => {
		onSelectionChange(selectedItems.filter((item) => item !== value));
	};

	return (
		<div className={cn("space-y-2", className)} ref={containerRef}>
			{selectedItemsData.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedItemsData.map((item) => (
						<Badge key={item.value} variant="secondary" className="flex items-center gap-1">
							{item.label}
							<button
								type="button"
								onClick={() => handleRemoveItem(item.value)}
								className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
							>
								<X className="h-3 w-3" />
								<span className="sr-only">削除</span>
							</button>
						</Badge>
					))}
				</div>
			)}
			<div className="relative">
				<Button
					type="button"
					variant="outline"
					className="w-full justify-between"
					onClick={() => setIsOpen(!isOpen)}
				>
					<span>
						{selectedItems.length > 0 ? `${selectedItems.length}件選択中` : "香典情報を選択"}
					</span>
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
				{isOpen && (
					<div className="absolute z-50 mt-2 w-full rounded-md bg-popover shadow-md">
						<div className="p-2">
							<Input
								type="search"
								placeholder={searchPlaceholder}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full"
							/>
						</div>
						<ScrollArea className="h-[200px] w-full">
							<div className="p-4 space-y-2">
								{filteredItems.map((item) => (
									<div key={item.value} className="flex items-center space-x-2">
										<Checkbox
											id={item.value}
											checked={selectedItems.includes(item.value)}
											onCheckedChange={(checked) =>
												handleCheckboxChange(item.value, checked as boolean)
											}
										/>
										<Label
											htmlFor={item.value}
											className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											{item.label}
										</Label>
									</div>
								))}
								{filteredItems.length === 0 && (
									<p className="text-sm text-muted-foreground text-center py-4">
										該当する項目がありません
									</p>
								)}
							</div>
						</ScrollArea>
						<div className="border-t px-4 py-2 text-xs text-muted-foreground">
							{filteredItems.length >= 10 && "※ 最大10件まで表示しています"}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
