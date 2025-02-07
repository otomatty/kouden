import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { AddOptionInput } from "./add-option-input";
import type { AdditionalSelectProps } from "@/types/additional-select";

export function AdditionalSelect({
	label,
	options,
	value,
	placeholder = "選択してください",
	disabled = false,
	onValueChange,
	onAddOption,
	addOptionPlaceholder,
}: AdditionalSelectProps) {
	const [isAdding, setIsAdding] = useState(false);

	return (
		<div className="grid w-full items-center gap-1.5">
			<Label>{label}</Label>
			<div className="flex flex-col gap-2">
				<Select value={value ?? undefined} onValueChange={onValueChange} disabled={disabled}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={placeholder} />
					</SelectTrigger>
					<SelectContent>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
						{!isAdding && (
							<Button
								variant="ghost"
								className="relative w-full justify-start rounded-none font-normal"
								onClick={(e) => {
									e.preventDefault();
									setIsAdding(true);
								}}
							>
								<PlusCircle className="mr-2 h-4 w-4" />
								新しい項目を追加
							</Button>
						)}
					</SelectContent>
				</Select>
				{isAdding && (
					<AddOptionInput
						onSubmit={(option) => {
							onAddOption(option);
							setIsAdding(false);
						}}
						onCancel={() => setIsAdding(false)}
						existingOptions={options}
						placeholder={addOptionPlaceholder}
					/>
				)}
			</div>
		</div>
	);
}
