"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { Telegram } from "@/types/telegram";

interface MobileFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
	table: Table<Telegram>;
}

export function MobileFilters({
	searchQuery,
	onSearchChange,
	searchField,
	onSearchFieldChange,
	sortOrder,
	onSortOrderChange,
	table,
}: MobileFiltersProps) {
	return (
		<div className="flex items-center gap-2 p-4 border-b">
			<div className="flex-1">
				<Input
					placeholder="検索..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full"
				/>
			</div>
			<Drawer>
				<DrawerTrigger asChild>
					<Button variant="outline" size="icon">
						<SlidersHorizontal className="h-4 w-4" />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>検索と並び替え</DrawerTitle>
					</DrawerHeader>
					<div className="p-4 space-y-4">
						<div className="space-y-2">
							<Label>検索対象</Label>
							<Select value={searchField} onValueChange={onSearchFieldChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="senderName">差出人名</SelectItem>
									<SelectItem value="senderOrganization">差出人組織</SelectItem>
									<SelectItem value="message">メッセージ</SelectItem>
									<SelectItem value="notes">備考</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>並び替え</Label>
							<Select value={sortOrder} onValueChange={onSortOrderChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="created_at_desc">
										登録日時（新しい順）
									</SelectItem>
									<SelectItem value="created_at_asc">
										登録日時（古い順）
									</SelectItem>
									<SelectItem value="sender_name_asc">
										差出人名（昇順）
									</SelectItem>
									<SelectItem value="sender_name_desc">
										差出人名（降順）
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
