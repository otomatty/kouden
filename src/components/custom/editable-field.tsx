// library
import { useState } from "react";
// ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Check, X } from "lucide-react";

export interface EditableFieldProps {
	label: string;
	value: string;
	onSave: (value: string) => Promise<void>;
	canEdit: boolean;
}

export function EditableField({ label, value, onSave, canEdit }: EditableFieldProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);

	const handleSave = async () => {
		await onSave(editValue);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditValue(value);
		setIsEditing(false);
	};

	if (!isEditing) {
		return (
			<div className="flex justify-between items-center group">
				<span className="text-sm text-muted-foreground">{label}</span>
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">{value}</span>
					{canEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
							onClick={() => setIsEditing(true)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex items-center gap-2">
				<Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
				<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
					<Check className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
