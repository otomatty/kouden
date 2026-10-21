"use client";

import * as React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { cn } from "@/lib/utils";

interface DateCellProps {
	value: string | null;
	onSave: (value: string | null) => Promise<void>;
	className?: string;
	trigger: React.ReactNode;
}

/**
 * 日付選択用のセルコンポーネント
 * @param value - 現在の日付値（ISO文字列）
 * @param onSave - 日付が選択された時のコールバック
 * @param className - スタイリング用のクラス名
 */
export function DateCell({ value, onSave, trigger }: DateCellProps) {
	const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined);
	const [, setIsOpen] = React.useState(false);

	const handleSelect = async (newDate: Date | undefined) => {
		setDate(newDate);
		if (newDate) {
			await onSave(newDate.toISOString());
		}
		setIsOpen(false);
	};

	const handleClear = async () => {
		setDate(undefined);
		await onSave(null);
		setIsOpen(false);
	};

	return (
		<ResponsiveDialog trigger={trigger} title="日付を選択">
			<div className="flex flex-col gap-4 p-3">
				<Calendar
					mode="single"
					selected={date}
					onSelect={handleSelect}
					locale={ja}
					className="rounded-md border"
				/>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={handleClear}>
						クリア
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
}
