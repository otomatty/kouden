import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { AddOptionInput } from "../form/add-option-input";
import type { AdditionalSelectCellProps } from "@/types/additional-select";

export function AdditionalSelectCell({
	options,
	value,
	placeholder = "選択してください",
	disabled = false,
	onValueChange,
	onAddOption,
	addOptionPlaceholder,
}: AdditionalSelectCellProps) {
	const [isAdding, setIsAdding] = useState(false);

	return (
		<div className="flex flex-col gap-1">
			<Select value={value ?? undefined} onValueChange={onValueChange} disabled={disabled}>
				<SelectTrigger className="h-8 w-full">
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
	);
}
