"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ReturnStatus } from "@/types/return-records/return-records";
import { returnStatusMap } from "@/components/ui/status-badge";

interface StatusSelectProps {
	/** 現在の値 */
	value: ReturnStatus;
	/** 値変更ハンドラー */
	onValueChange: (value: ReturnStatus) => void;
	/** 無効化フラグ */
	disabled?: boolean;
}

/**
 * ステータス選択コンポーネント
 */
export function StatusSelect({ value, onValueChange, disabled = false }: StatusSelectProps) {
	return (
		<Select value={value} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger className="w-full min-w-[120px]">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Object.entries(returnStatusMap).map(([key, label]) => (
					<SelectItem key={key} value={key}>
						{String(label)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
