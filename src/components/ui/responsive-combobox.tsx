"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ComboboxItem = {
	value: string;
	label: string;
};

interface ComboboxListProps {
	items: ComboboxItem[];
	selectedItems: ComboboxItem[];
	setOpen: (open: boolean) => void;
	setSelectedItems: (items: ComboboxItem[]) => void;
	placeholder?: string;
	emptyMessage?: string;
	searchPlaceholder?: string;
}

function ComboboxList({
	items,
	selectedItems,
	setOpen,
	setSelectedItems,
	placeholder,
	emptyMessage = "該当する項目がありません",
	searchPlaceholder = "検索...",
}: ComboboxListProps) {
	return (
		<Command className="w-full">
			<CommandInput placeholder={searchPlaceholder} />
			<CommandList>
				<CommandEmpty>{emptyMessage}</CommandEmpty>
				<CommandGroup>
					{items.map((item) => {
						const isSelected = selectedItems.some(
							(i) => i.value === item.value,
						);
						return (
							<CommandItem
								key={item.value}
								value={item.label}
								onSelect={(currentValue) => {
									if (isSelected) {
										setSelectedItems(
											selectedItems.filter((i) => i.value !== item.value),
										);
									} else {
										setSelectedItems([...selectedItems, item]);
									}
								}}
							>
								<div className="flex items-center gap-2">
									<div
										className={`flex h-4 w-4 items-center justify-center rounded border ${
											isSelected
												? "border-primary bg-primary text-primary-foreground"
												: "border-input"
										}`}
									>
										{isSelected && <Check className="h-3 w-3" />}
									</div>
									{item.label}
								</div>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

interface ResponsiveComboboxProps {
	items: ComboboxItem[];
	selectedItems: ComboboxItem[];
	onSelect: (items: ComboboxItem[]) => void;
	placeholder?: string;
	emptyMessage?: string;
	searchPlaceholder?: string;
	triggerClassName?: string;
	contentClassName?: string;
}

export function ResponsiveCombobox({
	items,
	selectedItems,
	onSelect,
	placeholder = "選択してください",
	emptyMessage,
	searchPlaceholder,
	triggerClassName = "w-[200px] justify-start",
	contentClassName = "w-[200px] p-0",
}: ResponsiveComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleButtonClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setOpen(true);
	};

	const handleRemoveItem = (
		itemToRemove: ComboboxItem,
		e: React.MouseEvent,
	) => {
		e.preventDefault();
		e.stopPropagation();
		onSelect(selectedItems.filter((item) => item.value !== itemToRemove.value));
	};

	const SelectedItemsList = () => (
		<div
			className="flex flex-col gap-2"
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === "Space") {
					e.stopPropagation();
				}
			}}
		>
			<Button
				type="button"
				variant="outline"
				role="combobox"
				aria-expanded={open}
				className={`${triggerClassName} justify-between`}
				onClick={handleButtonClick}
			>
				{selectedItems.length === 0 ? (
					<span className="text-muted-foreground">{placeholder}</span>
				) : (
					<span className="text-left font-normal">
						{selectedItems.length}件選択中
					</span>
				)}
			</Button>
			{selectedItems.length > 0 && (
				<ScrollArea className="max-h-20">
					<div className="flex flex-wrap gap-1">
						{selectedItems.map((item) => (
							<Badge
								key={item.value}
								variant="secondary"
								className="flex items-center gap-1"
							>
								{item.label}
								<button
									type="button"
									className="badge-remove-button inline-flex items-center justify-center"
									onClick={(e) => handleRemoveItem(item, e)}
								>
									<X className="h-3 w-3" />
								</button>
							</Badge>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);

	if (isDesktop) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<div>
						<SelectedItemsList />
					</div>
				</PopoverTrigger>
				<PopoverContent
					className={contentClassName}
					align="start"
					onClick={(e) => e.stopPropagation()}
				>
					<ComboboxList
						items={items}
						selectedItems={selectedItems}
						setOpen={setOpen}
						setSelectedItems={onSelect}
						placeholder={placeholder}
						emptyMessage={emptyMessage}
						searchPlaceholder={searchPlaceholder}
					/>
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<div>
					<SelectedItemsList />
				</div>
			</DrawerTrigger>
			<DrawerContent>
				<div className="mt-4 border-t">
					<ComboboxList
						items={items}
						selectedItems={selectedItems}
						setOpen={setOpen}
						setSelectedItems={onSelect}
						placeholder={placeholder}
						emptyMessage={emptyMessage}
						searchPlaceholder={searchPlaceholder}
					/>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
