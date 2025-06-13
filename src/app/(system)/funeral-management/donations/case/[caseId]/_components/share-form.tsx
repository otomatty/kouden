"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";

interface ShareFormProps {
	caseId: string;
	shareUrl: string;
	funeralCase: {
		deceased_name: string;
		venue: string | null;
		start_datetime: string | null;
	};
}

export function ShareForm({ shareUrl, funeralCase }: ShareFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		recipientEmail: "",
		recipientName: "",
		subject: `${funeralCase.deceased_name}様の香典帳について`,
		message: `${funeralCase.deceased_name}様の香典帳をお送りいたします。

以下のURLより香典帳をご確認いただけます。
${shareUrl}

ご不明な点がございましたら、お気軽にお問い合わせください。`,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.recipientEmail) {
			toast.error("送信先メールアドレスを入力してください");
			return;
		}

		if (!formData.recipientName) {
			toast.error("送信先のお名前を入力してください");
			return;
		}

		setIsLoading(true);

		try {
			// ここで実際のメール送信APIを呼び出す
			// 現在はモックとして成功を返す
			await new Promise((resolve) => setTimeout(resolve, 2000));

			toast.success(`${formData.recipientName}様に香典帳を共有しました`);

			// フォームリセット
			setFormData((prev) => ({
				...prev,
				recipientEmail: "",
				recipientName: "",
			}));
		} catch (error) {
			console.error("Error sending share email:", error);
			toast.error("メール送信に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* 受信者情報 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="recipientName">送信先のお名前 *</Label>
					<Input
						id="recipientName"
						type="text"
						placeholder="例: 田中花子"
						value={formData.recipientName}
						onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="recipientEmail">送信先メールアドレス *</Label>
					<Input
						id="recipientEmail"
						type="email"
						placeholder="例: hanako@example.com"
						value={formData.recipientEmail}
						onChange={(e) => setFormData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
						required
					/>
				</div>
			</div>

			{/* 件名 */}
			<div className="space-y-2">
				<Label htmlFor="subject">件名</Label>
				<Input
					id="subject"
					type="text"
					value={formData.subject}
					onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
				/>
			</div>

			{/* メッセージ */}
			<div className="space-y-2">
				<Label htmlFor="message">メッセージ</Label>
				<Textarea
					id="message"
					rows={8}
					value={formData.message}
					onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
					className="resize-none"
				/>
				<p className="text-sm text-muted-foreground">
					香典帳のURLが自動的に含まれます。必要に応じてメッセージをカスタマイズしてください。
				</p>
			</div>

			{/* プレビュー */}
			<div className="border rounded-lg p-4 bg-muted/50">
				<h4 className="font-medium mb-2">メールプレビュー</h4>
				<div className="space-y-2 text-sm">
					<div>
						<span className="font-medium">宛先:</span> {formData.recipientName} &lt;
						{formData.recipientEmail}&gt;
					</div>
					<div>
						<span className="font-medium">件名:</span> {formData.subject}
					</div>
					<div>
						<span className="font-medium">本文:</span>
						<div className="mt-1 p-2 bg-background rounded border whitespace-pre-wrap">
							{formData.message}
						</div>
					</div>
				</div>
			</div>

			{/* 送信ボタン */}
			<div className="flex gap-4 pt-4">
				<Button type="submit" disabled={isLoading} className="min-w-32">
					{isLoading ? (
						"送信中..."
					) : (
						<>
							<Send className="h-4 w-4 mr-2" />
							メール送信
						</>
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						// URLをクリップボードにコピー
						navigator.clipboard.writeText(shareUrl);
						toast.success("URLをクリップボードにコピーしました");
					}}
				>
					URLをコピー
				</Button>
			</div>

			{/* 送信履歴（将来の拡張用） */}
			<div className="border-t pt-4">
				<h4 className="font-medium mb-2">送信履歴</h4>
				<p className="text-sm text-muted-foreground">まだ送信履歴がありません</p>
			</div>
		</form>
	);
}
