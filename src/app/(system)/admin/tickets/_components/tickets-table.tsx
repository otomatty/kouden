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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/types/admin";

interface TicketsTableProps {
	tickets: Ticket[];
	updateTicketStatus: (id: string, status: Ticket["status"]) => Promise<void>;
	updateTicketPriority: (id: string, priority: Ticket["priority"]) => Promise<void>;
	assignTicket: (id: string, adminId: string | null) => Promise<void>;
}

const priorityColors = {
	low: "bg-gray-500",
	normal: "bg-blue-500",
	high: "bg-yellow-500",
	urgent: "bg-red-500",
};

const statusColors = {
	open: "bg-green-500",
	in_progress: "bg-blue-500",
	resolved: "bg-gray-500",
	closed: "bg-gray-700",
};

export function TicketsTable({ tickets, updateTicketStatus }: TicketsTableProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<string | null>(null);

	const handleUpdateStatus = async (ticketId: string, status: Ticket["status"]) => {
		try {
			setLoading(ticketId);
			await updateTicketStatus(ticketId, status);
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
						<TableHead>作成者</TableHead>
						<TableHead>担当者</TableHead>
						<TableHead>作成日時</TableHead>
						<TableHead className="w-[50px]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{tickets.map((ticket) => (
						<TableRow key={ticket.id}>
							<TableCell>{ticket.subject}</TableCell>
							<TableCell>
								<Badge variant="secondary" className={statusColors[ticket.status]}>
									{ticket.status === "open" && "未対応"}
									{ticket.status === "in_progress" && "対応中"}
									{ticket.status === "resolved" && "解決済み"}
									{ticket.status === "closed" && "完了"}
								</Badge>
							</TableCell>
							<TableCell>
								<Badge variant="secondary" className={priorityColors[ticket.priority]}>
									{ticket.priority === "low" && "低"}
									{ticket.priority === "normal" && "中"}
									{ticket.priority === "high" && "高"}
									{ticket.priority === "urgent" && "緊急"}
								</Badge>
							</TableCell>
							<TableCell>{ticket.user.email}</TableCell>
							<TableCell>{ticket.assigned_admin?.email ?? "未割り当て"}</TableCell>
							<TableCell>{formatDate(ticket.created_at)}</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" disabled={loading === ticket.id}>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => router.push(`/admin/tickets/${ticket.id}`)}>
											詳細を表示
										</DropdownMenuItem>
										{ticket.status === "open" && (
											<DropdownMenuItem
												onClick={() => handleUpdateStatus(ticket.id, "in_progress")}
											>
												対応開始
											</DropdownMenuItem>
										)}
										{ticket.status === "in_progress" && (
											<DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "resolved")}>
												解決済みにする
											</DropdownMenuItem>
										)}
										{ticket.status === "resolved" && (
											<DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "closed")}>
												完了にする
											</DropdownMenuItem>
										)}
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
