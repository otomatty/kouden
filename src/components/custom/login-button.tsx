"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginButtonProps {
	invitationToken?: string;
}

export function LoginButton({ invitationToken }: LoginButtonProps) {
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const supabase = createClient();

	const handleLogin = async () => {
		try {
			setLoading(true);

			// 認証前にinvitation_tokenをクッキーに保存
			if (invitationToken) {
				console.log(
					"[DEBUG] Setting invitation token cookie:",
					invitationToken,
				);
				document.cookie = `invitation_token=${invitationToken}; path=/; max-age=3600; SameSite=Lax`;

				// クッキーが正しく設定されたか確認
				console.log("[DEBUG] Cookies after setting:", document.cookie);
			} else {
				console.log("[DEBUG] No invitation token provided");
			}

			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) {
				console.error("[DEBUG] OAuth error:", error);
				throw error;
			}
		} catch (error) {
			console.error("[DEBUG] Login error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			onClick={handleLogin}
			disabled={loading}
			className="w-full"
			variant="outline"
		>
			{loading ? "ログイン中..." : "Googleでログイン"}
		</Button>
	);
}
