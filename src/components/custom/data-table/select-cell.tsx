import { useState, useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types/table";

interface SelectCellProps {
	value: string | number | boolean | null;
	options: SelectOption[];
	onSave: (value: string | boolean) => void;
	className?: string;
}

export function SelectCell({ value, options, onSave, className }: SelectCellProps) {
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

	return (
		<Select
			open={isOpen}
			onOpenChange={setIsOpen}
			value={value?.toString() ?? ""}
			onValueChange={handleSelect}
		>
			<SelectTrigger
				className={cn(
					"h-8 w-full border-none shadow-none bg-transparent hover:bg-accent hover:text-accent-foreground",
					className,
				)}
			>
				<SelectValue>{currentOption?.label || value}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
