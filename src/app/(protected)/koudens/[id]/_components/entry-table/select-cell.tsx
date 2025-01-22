import { useState, useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Option {
	value: string;
	label: string;
}

interface SelectCellProps {
	value: string;
	options: Option[];
	onSave: (value: string) => void;
	className?: string;
}

export function SelectCell({
	value,
	options,
	onSave,
	className,
}: SelectCellProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleSelect = useCallback(
		(newValue: string) => {
			if (newValue !== value) {
				onSave(newValue);
			}
			setIsOpen(false);
		},
		[value, onSave],
	);

	const currentOption = options.find((opt) => opt.value === value);

	return (
		<Select
			open={isOpen}
			onOpenChange={setIsOpen}
			value={value}
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
