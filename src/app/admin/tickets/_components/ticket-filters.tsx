"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function TicketFilters() {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			<div className="space-y-2">
				<Label>ステータス</Label>
				<Select defaultValue="all">
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">すべて</SelectItem>
						<SelectItem value="open">未対応</SelectItem>
						<SelectItem value="in_progress">対応中</SelectItem>
						<SelectItem value="resolved">解決済み</SelectItem>
						<SelectItem value="closed">完了</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>優先度</Label>
				<Select defaultValue="all">
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">すべて</SelectItem>
						<SelectItem value="urgent">緊急</SelectItem>
						<SelectItem value="high">高</SelectItem>
						<SelectItem value="normal">中</SelectItem>
						<SelectItem value="low">低</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>担当者</Label>
				<Select defaultValue="all">
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">すべて</SelectItem>
						<SelectItem value="unassigned">未割り当て</SelectItem>
						<SelectItem value="assigned">割り当て済み</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
