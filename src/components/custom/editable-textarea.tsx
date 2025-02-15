/**
 * 編集可能なテキストエリアコンポーネント
 *
 * @example
 * ```tsx
 * <EditableTextArea
 *   label="備考"
 *   value={notes}
 *   onSave={handleSave}
 *   canEdit={true}
 *   minHeight="200px" // オプション: 最小の高さを指定
 * />
 * ```
 *
 * @param props
 * @param props.label - フィールドのラベル
 * @param props.value - 表示/編集する値
 * @param props.onSave - 保存時のコールバック関数
 * @param props.canEdit - 編集可能かどうか
 * @param props.minHeight - テキストエリアの最小の高さ (デフォルト: 100px)
 */

// library
import { useState } from "react";
// ui
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Check, X } from "lucide-react";

export interface EditableTextAreaProps {
	label: string;
	value: string;
	onSave: (value: string) => Promise<void>;
	canEdit: boolean;
	minHeight?: string;
}

export function EditableTextArea({
	label,
	value,
	onSave,
	canEdit,
	minHeight = "100px",
}: EditableTextAreaProps) {
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
			<div className="flex flex-col group">
				<span className="text-sm text-muted-foreground mb-2">{label}</span>
				<div className="relative p-2 rounded-md border bg-muted/50" style={{ minHeight }}>
					<div className="whitespace-pre-wrap text-sm">{value}</div>
					{canEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
			<div className="flex flex-col gap-2">
				<Textarea
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					className="resize-none"
					style={{ minHeight }}
				/>
				<div className="flex justify-end gap-2">
					<Button variant="ghost" size="sm" onClick={handleSave}>
						<Check className="h-4 w-4 mr-2" />
						保存
					</Button>
					<Button variant="ghost" size="sm" onClick={handleCancel}>
						<X className="h-4 w-4 mr-2" />
						キャンセル
					</Button>
				</div>
			</div>
		</div>
	);
}
