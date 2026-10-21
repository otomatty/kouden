import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatPostalCode } from "@/utils/postal-code";

interface EditableCellProps {
	value: string | number | null;
	onSave: (value: string | number) => void;
	type?: "text" | "number";
	format?: "currency" | "postal_code";
	className?: string;
}

export function EditableCell({
	value: initialValue,
	onSave,
	type = "text",
	format,
	className,
}: EditableCellProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(initialValue ?? "");
	const [isComposing, setIsComposing] = useState(false);

	useEffect(() => {
		setValue(initialValue ?? "");
	}, [initialValue]);

	const handleDoubleClick = useCallback(() => {
		setIsEditing(true);
	}, []);

	const handleBlur = useCallback(() => {
		if (!isComposing) {
			setIsEditing(false);
			if (value !== initialValue) {
				const numericValue =
					type === "number" ? Number(String(value).replace(/[^\d]/g, "")) : value;
				onSave(numericValue);
			}
		}
	}, [value, initialValue, onSave, isComposing, type]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && !isComposing) {
				setIsEditing(false);
				if (value !== initialValue) {
					const numericValue =
						type === "number" ? Number(String(value).replace(/[^\d]/g, "")) : value;
					onSave(numericValue);
				}
			} else if (e.key === "Escape") {
				setIsEditing(false);
				setValue(initialValue ?? "");
			}
		},
		[value, initialValue, onSave, isComposing, type],
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		if (type === "number") {
			const numericValue = inputValue.replace(/[^\d]/g, "");
			setValue(numericValue);
		} else {
			setValue(inputValue);
		}
	};

	const displayValue =
		format === "currency"
			? formatCurrency(Number(value))
			: format === "postal_code"
				? formatPostalCode(value)
				: value;

	if (isEditing) {
		return (
			<Input
				type={type}
				value={String(value)}
				onChange={handleChange}
				onCompositionStart={() => setIsComposing(true)}
				onCompositionEnd={() => setIsComposing(false)}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				className={cn("h-8 w-full", className)}
				autoFocus
			/>
		);
	}

	return (
		<div onDoubleClick={handleDoubleClick} className={cn("cursor-pointer px-2 py-1", className)}>
			{displayValue}
		</div>
	);
}
