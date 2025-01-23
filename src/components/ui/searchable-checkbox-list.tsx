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

interface SearchableCheckboxListProps {
	items: CheckboxListItem[];
	selectedItems: string[];
	onSelectionChange: (selectedValues: string[]) => void;
	searchPlaceholder?: string;
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
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
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
			.filter((item) =>
				item.label.toLowerCase().includes(searchQuery.toLowerCase()),
			)
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
						<Badge
							key={item.value}
							variant="secondary"
							className="flex items-center gap-1"
						>
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
						{selectedItems.length > 0
							? `${selectedItems.length}件選択中`
							: "香典情報を選択"}
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
