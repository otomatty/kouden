"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GoogleIcon } from "@/components/custom/icons/google";

export function LoginForm() {
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		console.log("🎯 LoginFormコンポーネントがマウントされました");
	}, []);

	const handleGoogleLogin = async () => {
		console.log("🔍 ログインボタンがクリックされました");
		console.log("📍 現在のURL:", window.location.origin);

		try {
			console.log("🔄 Google OAuth処理を開始します");
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) {
				console.error("❌ OAuth処理でエラーが発生:", error.message);
				throw error;
			}

			console.log("✅ OAuth処理が正常に完了しました");
		} catch (error) {
			console.error("🚨 エラーの詳細:", error);
			if (error instanceof Error) {
				console.error("エラーメッセージ:", error.message);
				console.error("エラースタック:", error.stack);
			}
		}
	};

	return (
		<div className="flex flex-col space-y-4">
			<Button
				type="button"
				variant="outline"
				onClick={(e) => {
					console.log("👆 ボタンがクリックされました - イベント:", e);
					handleGoogleLogin();
				}}
				className="flex items-center justify-center gap-2"
			>
				<GoogleIcon className="h-5 w-5" />
				<span>Googleでログイン</span>
			</Button>
		</div>
	);
}
