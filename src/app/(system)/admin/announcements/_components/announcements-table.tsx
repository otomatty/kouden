"use client";

import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@/types/admin";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditAnnouncementButton } from "./edit-announcement-button";

interface AnnouncementsTableProps {
	announcements: Announcement[];
	deleteAnnouncement: (id: string) => Promise<void>;
}

const priorityColors = {
	low: "bg-gray-500",
	normal: "bg-blue-500",
	high: "bg-yellow-500",
	urgent: "bg-red-500",
};

const statusColors = {
	draft: "bg-gray-500",
	published: "bg-green-500",
	archived: "bg-gray-700",
};

const categoryColors = {
	system: "bg-purple-500",
	feature: "bg-blue-500",
	important: "bg-red-500",
	event: "bg-green-500",
	other: "bg-gray-500",
};

const categoryLabels = {
	system: "システム関連",
	feature: "機能追加・変更",
	important: "重要なお知らせ",
	event: "イベント",
	other: "その他",
};

export function AnnouncementsTable({
	announcements,
	deleteAnnouncement,
}: AnnouncementsTableProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<
		string | null
	>(null);

	const handleDelete = async (id: string) => {
		setSelectedAnnouncementId(id);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!selectedAnnouncementId) return;
		try {
			await deleteAnnouncement(selectedAnnouncementId);
		} catch (error) {
			console.error("Failed to delete announcement:", error);
		}
		setIsDeleteDialogOpen(false);
		setSelectedAnnouncementId(null);
	};

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>タイトル</TableHead>
						<TableHead>カテゴリー</TableHead>
						<TableHead>ステータス</TableHead>
						<TableHead>優先度</TableHead>
						<TableHead>公開日時</TableHead>
						<TableHead>期限</TableHead>
						<TableHead>作成日時</TableHead>
						<TableHead>更新日時</TableHead>
						<TableHead className="text-right">アクション</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{announcements.map((announcement) => (
						<TableRow key={announcement.id}>
							<TableCell>{announcement.title}</TableCell>
							<TableCell>
								<Badge
									variant="secondary"
									className={categoryColors[announcement.category]}
								>
									{categoryLabels[announcement.category]}
								</Badge>
							</TableCell>
							<TableCell>
								<Badge
									variant="secondary"
									className={statusColors[announcement.status]}
								>
									{announcement.status === "draft" && "下書き"}
									{announcement.status === "published" && "公開中"}
									{announcement.status === "archived" && "アーカイブ"}
								</Badge>
							</TableCell>
							<TableCell>
								<Badge
									variant="secondary"
									className={priorityColors[announcement.priority]}
								>
									{announcement.priority === "low" && "低"}
									{announcement.priority === "normal" && "中"}
									{announcement.priority === "high" && "高"}
									{announcement.priority === "urgent" && "緊急"}
								</Badge>
							</TableCell>
							<TableCell>
								{announcement.publishedAt
									? formatDate(announcement.publishedAt)
									: "-"}
							</TableCell>
							<TableCell>
								{announcement.expiresAt
									? formatDate(announcement.expiresAt)
									: "-"}
							</TableCell>
							<TableCell>{formatDate(announcement.createdAt)}</TableCell>
							<TableCell>{formatDate(announcement.updatedAt)}</TableCell>
							<TableCell className="text-right space-x-2">
								<EditAnnouncementButton announcement={announcement} />
								<Button
									variant="destructive"
									size="sm"
									onClick={() => handleDelete(announcement.id)}
								>
									削除
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>お知らせを削除</AlertDialogTitle>
						<AlertDialogDescription>
							このお知らせを削除してもよろしいですか？この操作は取り消せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete}>削除</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
