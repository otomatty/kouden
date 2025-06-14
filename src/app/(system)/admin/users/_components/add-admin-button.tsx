"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AddAdminButtonProps {
	findUserByEmail: (email: string) => Promise<User | undefined>;
	addAdminUser: (userId: string, role: "admin" | "super_admin") => Promise<void>;
}

export function AddAdminButton({ findUserByEmail, addAdminUser }: AddAdminButtonProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"admin" | "super_admin">("admin");
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		try {
			const user = await findUserByEmail(email);
			if (!user) {
				toast({
					title: "エラー",
					description: "指定されたメールアドレスのユーザーが見つかりませんでした。",
					variant: "destructive",
				});
				return;
			}

			await addAdminUser(user.id, role);
			toast({
				title: "成功",
				description: "管理者を追加しました。",
			});
			setEmail("");
			setOpen(false);
			router.refresh();
		} catch (error) {
			console.error(error);
			toast({
				title: "エラー",
				description: "管理者の追加に失敗しました。",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>管理者を追加</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>管理者を追加</DialogTitle>
					<DialogDescription>
						追加したいユーザーのメールアドレスを入力してください。
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">メールアドレス</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="user@example.com"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">権限</Label>
						<Select value={role} onValueChange={(value: "admin" | "super_admin") => setRole(value)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="admin">一般管理者</SelectItem>
								<SelectItem value="super_admin">スーパー管理者</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={loading}>
							{loading ? "追加中..." : "追加"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
