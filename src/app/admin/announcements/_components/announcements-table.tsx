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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@/types/admin";

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

export function AnnouncementsTable({
	announcements,
	deleteAnnouncement,
}: AnnouncementsTableProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<string | null>(null);

	const handleDelete = async (id: string) => {
		if (!confirm("本当にこのお知らせを削除しますか？")) return;
		try {
			setLoading(id);
			await deleteAnnouncement(id);
			router.refresh();
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>タイトル</TableHead>
						<TableHead>ステータス</TableHead>
						<TableHead>優先度</TableHead>
						<TableHead>公開日時</TableHead>
						<TableHead>期限</TableHead>
						<TableHead className="w-[50px]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{announcements.map((announcement) => (
						<TableRow key={announcement.id}>
							<TableCell>{announcement.title}</TableCell>
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
								{announcement.published_at
									? formatDate(announcement.published_at)
									: "-"}
							</TableCell>
							<TableCell>
								{announcement.expires_at
									? formatDate(announcement.expires_at)
									: "-"}
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											disabled={loading === announcement.id}
										>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												router.push(
													`/admin/announcements/${announcement.id}/edit`,
												)
											}
										>
											編集
										</DropdownMenuItem>
										<DropdownMenuItem
											className="text-red-600"
											onClick={() => handleDelete(announcement.id)}
										>
											削除
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
