"use client";

import { Button } from "@/components/ui/button";
import { useCSRFToken } from "@/hooks/use-csrf-token";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { GoogleIcon } from "./icons/google";

interface LoginButtonProps {
	invitationToken?: string;
}

export function LoginButton({ invitationToken }: LoginButtonProps) {
	const [loading, setLoading] = useState(false);
	const supabase = createClient();
	const { fetchWithCSRF } = useCSRFToken();

	const handleLogin = async () => {
		try {
			setLoading(true);

			// 認証前に invitation_token を HttpOnly Cookie として保存する。
			// 書き込みは /api/auth/cookies/invitation-token 経由で行い、document.cookie
			// では付与できない HttpOnly を強制する。失敗時は OAuth を起動しない。
			if (invitationToken) {
				const res = await fetchWithCSRF("/api/auth/cookies/invitation-token", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token: invitationToken }),
				});
				if (!res.ok) {
					console.error("[DEBUG] Failed to store invitation token cookie:", await res.text());
					return;
				}
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
		<Button onClick={handleLogin} disabled={loading} className="w-full" variant="outline">
			<GoogleIcon />
			{loading ? "ログイン中..." : "Googleでログイン"}
		</Button>
	);
}
