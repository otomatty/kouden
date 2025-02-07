import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { AddOptionInputProps, SelectOption } from "@/types/additional-select";

export function AddOptionInput({
	onSubmit,
	existingOptions,
	placeholder = "新しい項目名を入力",
	onCancel,
}: AddOptionInputProps) {
	const [label, setLabel] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = () => {
		if (!label.trim()) {
			setError("項目名を入力してください");
			return;
		}

		if (existingOptions.some((option) => option.label === label.trim())) {
			setError("この項目名は既に存在します");
			return;
		}

		const newOption: SelectOption = {
			value: label.trim(),
			label: label.trim(),
		};

		onSubmit(newOption);
		setLabel("");
		setError(null);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center gap-2">
				<Input
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="h-8"
					autoFocus
				/>
				<Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
					<X className="h-4 w-4" />
				</Button>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
