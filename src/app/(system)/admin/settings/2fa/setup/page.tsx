/**
 * 管理者用 二要素認証設定ページ
 * QRコードを表示し、2FAの設定を完了させる
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateTwoFactorSetup, isTwoFactorEnabled } from "@/lib/security/two-factor-auth";
import {
	getTwoFactorSetupMessage,
	isTwoFactorRequired,
} from "@/lib/security/admin-2fa-enforcement";
import TwoFactorSetupForm from "../_components/TwoFactorSetupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Smartphone } from "lucide-react";

interface PageProps {
	searchParams: Promise<{ from?: string }>;
}

export default async function TwoFactorSetupPage({ searchParams }: PageProps) {
	const resolvedSearchParams = await searchParams;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	// 管理者かどうかを確認
	const { data: isAdmin } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	if (!isAdmin) {
		redirect("/");
	}

	// 既に2FAが設定済みの場合
	const twoFactorEnabled = await isTwoFactorEnabled(user.id);
	if (twoFactorEnabled) {
		const returnUrl = resolvedSearchParams.from || "/admin";
		redirect(returnUrl);
	}

	// 2FA設定情報を生成
	const twoFactorSetup = await generateTwoFactorSetup(user.id);
	const isRequired = isTwoFactorRequired();
	const setupMessage = getTwoFactorSetupMessage(isRequired);

	return (
		<div className="container max-w-2xl mx-auto py-8">
			<Card>
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
						<ShieldCheck className="h-6 w-6 text-blue-600" />
					</div>
					<CardTitle className="text-2xl font-bold">二要素認証の設定</CardTitle>
					<CardDescription className="text-base">{setupMessage}</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{isRequired && (
						<Alert>
							<ShieldCheck className="h-4 w-4" />
							<AlertTitle>必須設定</AlertTitle>
							<AlertDescription>
								セキュリティ強化のため、管理者アカウントには二要素認証の設定が必須です。
							</AlertDescription>
						</Alert>
					)}

					<div className="grid gap-6 md:grid-cols-2">
						{/* QRコード表示エリア */}
						<div className="space-y-4">
							<div className="text-center">
								<h3 className="text-lg font-semibold mb-2">1. アプリでQRコードをスキャン</h3>
								<div className="bg-white p-4 rounded-lg border inline-block">
									<img src={twoFactorSetup.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
								</div>
								<p className="text-sm text-muted-foreground mt-2">
									Google Authenticator、Authy等のアプリを使用
								</p>
							</div>
						</div>

						{/* 手動入力エリア */}
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold mb-2">手動入力の場合</h3>
								<div className="bg-gray-50 p-3 rounded border">
									<p className="text-xs text-muted-foreground mb-1">シークレットキー:</p>
									<code className="text-sm font-mono break-all">
										{twoFactorSetup.manualEntryKey}
									</code>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Smartphone className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">推奨アプリ</span>
								</div>
								<ul className="text-sm text-muted-foreground space-y-1 ml-6">
									<li>• Google Authenticator</li>
									<li>• Microsoft Authenticator</li>
									<li>• Authy</li>
									<li>• 1Password</li>
								</ul>
							</div>
						</div>
					</div>

					{/* 設定完了フォーム */}
					<div className="border-t pt-6">
						<h3 className="text-lg font-semibold mb-4">2. 認証コードを入力して設定完了</h3>
						<Suspense fallback={<div>Loading...</div>}>
							<TwoFactorSetupForm
								secret={twoFactorSetup.secret}
								userId={user.id}
								returnUrl={resolvedSearchParams.from}
								isRequired={isRequired}
							/>
						</Suspense>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
