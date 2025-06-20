/**
 * 二要素認証設定完了フォーム
 * 認証コードを入力して2FAの設定を完了する
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { setupTwoFactorAuth } from "@/app/_actions/admin/admin-2fa";

interface TwoFactorSetupFormProps {
	secret: string;
	userId: string;
	returnUrl?: string;
	isRequired: boolean;
}

export default function TwoFactorSetupForm({
	secret,
	returnUrl,
	isRequired,
}: TwoFactorSetupFormProps) {
	const [verificationCode, setVerificationCode] = useState("");
	const [error, setError] = useState("");
	const [isVerified, setIsVerified] = useState(false);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (verificationCode.length !== 6) {
			setError("認証コードは6桁で入力してください");
			return;
		}

		startTransition(async () => {
			try {
				const result = await setupTwoFactorAuth(secret, verificationCode);

				if (result.success) {
					setIsVerified(true);

					// 成功後2秒待ってからリダイレクト
					setTimeout(() => {
						const redirectUrl = returnUrl || "/admin";
						router.push(redirectUrl);
						router.refresh();
					}, 2000);
				} else {
					setError(result.error || "設定に失敗しました");
				}
			} catch (error) {
				console.error("2FA setup error:", error);
				setError("設定中にエラーが発生しました");
			}
		});
	};

	if (isVerified) {
		return (
			<Card className="border-green-200 bg-green-50">
				<CardContent className="p-6">
					<div className="flex items-center space-x-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
							<Check className="h-4 w-4 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-green-800">設定完了！</h3>
							<p className="text-sm text-green-700">
								二要素認証の設定が正常に完了しました。リダイレクトしています...
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent className="p-6">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="verification-code">
							認証コード <span className="text-red-500">*</span>
						</Label>
						<Input
							id="verification-code"
							type="text"
							placeholder="123456"
							value={verificationCode}
							onChange={(e) => {
								const value = e.target.value.replace(/\D/g, "").slice(0, 6);
								setVerificationCode(value);
								setError("");
							}}
							disabled={isPending}
							maxLength={6}
							className="text-center text-lg tracking-widest font-mono"
							required
						/>
						<p className="text-xs text-muted-foreground">
							認証アプリに表示されている6桁のコードを入力してください
						</p>
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="flex flex-col space-y-3">
						<Button
							type="submit"
							disabled={isPending || verificationCode.length !== 6}
							className="w-full"
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									設定中...
								</>
							) : (
								"二要素認証を有効にする"
							)}
						</Button>

						{!isRequired && (
							<Button
								type="button"
								variant="ghost"
								onClick={() => router.back()}
								disabled={isPending}
								className="w-full"
							>
								後で設定する
							</Button>
						)}
					</div>

					<div className="text-xs text-muted-foreground space-y-1">
						<p>• 認証コードは30秒ごとに更新されます</p>
						<p>• コードが正しく入力されない場合は、アプリの時刻設定を確認してください</p>
						{isRequired && (
							<p className="text-orange-600 font-medium">
								※ 管理者アカウントでは二要素認証の設定が必須です
							</p>
						)}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
