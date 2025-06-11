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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdminUser } from "@/types/admin";

interface AdminUsersTableProps {
	adminUsers: AdminUser[];
	updateAdminRole: (
		adminId: string,
		role: "admin" | "super_admin",
	) => Promise<void>;
	removeAdminUser: (adminId: string) => Promise<void>;
}

export function AdminUsersTable({
	adminUsers,
	updateAdminRole,
	removeAdminUser,
}: AdminUsersTableProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const { toast } = useToast();

	const handleRoleChange = async (
		adminId: string,
		role: "admin" | "super_admin",
	) => {
		setLoading(adminId);
		try {
			await updateAdminRole(adminId, role);
			toast({
				title: "成功",
				description: "権限を更新しました。",
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "エラー",
				description: "権限の更新に失敗しました。",
				variant: "destructive",
			});
		} finally {
			setLoading(null);
		}
	};

	const handleDelete = async (adminId: string) => {
		setLoading(adminId);
		try {
			await removeAdminUser(adminId);
			toast({
				title: "成功",
				description: "管理者を削除しました。",
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "エラー",
				description: "管理者の削除に失敗しました。",
				variant: "destructive",
			});
		} finally {
			setLoading(null);
		}
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>メールアドレス</TableHead>
					<TableHead>権限</TableHead>
					<TableHead>作成日時</TableHead>
					<TableHead className="w-[100px]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{adminUsers.map((admin) => (
					<TableRow key={admin.id}>
						<TableCell>{admin.user.display_name}</TableCell>
						<TableCell>
							<Select
								value={admin.role}
								onValueChange={(value: "admin" | "super_admin") =>
									handleRoleChange(admin.id, value)
								}
								disabled={loading === admin.id}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">管理者</SelectItem>
									<SelectItem value="super_admin">スーパー管理者</SelectItem>
								</SelectContent>
							</Select>
						</TableCell>
						<TableCell>
							{admin.created_at
								? new Date(admin.created_at).toLocaleString("ja-JP")
								: "-"}
						</TableCell>
						<TableCell>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="destructive"
										size="sm"
										disabled={loading === admin.id}
									>
										削除
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>管理者を削除</AlertDialogTitle>
										<AlertDialogDescription>
											この操作は取り消せません。本当に削除しますか？
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>キャンセル</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleDelete(admin.id)}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											削除
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
