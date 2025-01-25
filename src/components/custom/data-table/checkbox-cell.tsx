import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CheckboxCellProps {
	value: boolean;
	onSave: (value: boolean) => void;
	className?: string;
}

export function CheckboxCell({ value, onSave, className }: CheckboxCellProps) {
	return (
		<div className={cn("flex items-center justify-center", className)}>
			<Checkbox
				checked={value}
				onCheckedChange={(checked) => {
					if (checked !== value) {
						onSave(checked as boolean);
					}
				}}
			/>
		</div>
	);
}
