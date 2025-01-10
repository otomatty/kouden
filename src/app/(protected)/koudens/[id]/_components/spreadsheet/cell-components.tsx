import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { SpreadsheetData } from "./types";

interface CellProps<T> {
	getValue: () => T;
	row: { original: SpreadsheetData };
	onValueChange: (value: T) => void;
	minWidth?: string;
}

export function TextCell({
	getValue,
	onValueChange,
	minWidth,
}: CellProps<string>) {
	const value = getValue();
	const [localValue, setLocalValue] = useState(value);

	return (
		<Input
			type="text"
			value={localValue || ""}
			onChange={(e) => setLocalValue(e.target.value)}
			onBlur={() => {
				if (localValue === value) return;
				onValueChange(localValue);
			}}
			className="w-full"
			style={{ minWidth }}
		/>
	);
}

export function PopoverTextCell({
	getValue,
	onValueChange,
	minWidth,
}: CellProps<string>) {
	const value = getValue();
	const [localValue, setLocalValue] = useState(value);
	const [open, setOpen] = useState(false);

	const handleSave = () => {
		onValueChange(localValue || "");
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="w-full h-9 px-3 py-1 text-left border rounded  bg-gray-50"
					style={{
						minWidth,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{value || ""}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<Input
					value={localValue || ""}
					onChange={(e) => setLocalValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleSave();
						}
					}}
					onBlur={handleSave}
					autoFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

export function NumberCell({
	getValue,
	onValueChange,
	minWidth,
}: CellProps<number>) {
	const value = getValue();
	const [localValue, setLocalValue] = useState(value);

	return (
		<Input
			type="number"
			value={localValue || 0}
			min={0}
			step={1000}
			onChange={(e) => setLocalValue(Number(e.target.value))}
			onBlur={() => {
				if (localValue === value) return;
				onValueChange(localValue);
			}}
			className="w-full text-right"
			style={{ minWidth }}
		/>
	);
}

interface SelectCellProps<T> extends CellProps<T | undefined | null> {
	options: Array<{ value: string; label: string }>;
}

export function SelectCell({
	getValue,
	onValueChange,
	options,
	minWidth,
}: SelectCellProps<string>) {
	const value = getValue();
	const [localValue, setLocalValue] = useState(value);
	const defaultValue = options[0]?.value ?? "";

	return (
		<Select
			value={String(localValue || defaultValue)}
			onValueChange={(newValue: string) => {
				setLocalValue(newValue);
				onValueChange(newValue);
			}}
		>
			<SelectTrigger className="w-full" style={{ minWidth }}>
				<SelectValue />
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
