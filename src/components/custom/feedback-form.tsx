"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendFeedback } from "@/app/_actions/feedback";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function FeedbackForm() {
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);

		try {
			const formData = new FormData(event.currentTarget);
			const result = await sendFeedback({
				title: formData.get("title") as string,
				description: formData.get("description") as string,
				userEmail: formData.get("email") as string,
			});

			if (result.success) {
				toast({
					title: "フィードバックを送信しました",
					description: "ご意見ありがとうございます。",
				});
				(event.target as HTMLFormElement).reset();
			} else {
				toast({
					title: "エラーが発生しました",
					description: result.error,
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description: "予期せぬエラーが発生しました。",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>フィードバック</CardTitle>
				<CardDescription>
					アプリについてのご意見・ご要望をお聞かせください
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">メールアドレス</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="your@email.com"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="title">件名</Label>
						<Input
							id="title"
							name="title"
							placeholder="フィードバックの件名"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">内容</Label>
						<Textarea
							id="description"
							name="description"
							placeholder="フィードバックの内容を入力してください"
							required
							rows={5}
						/>
					</div>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "送信中..." : "送信する"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
