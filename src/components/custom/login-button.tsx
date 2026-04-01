"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./icons/google";

interface LoginButtonProps {
	invitationToken?: string;
}

export function LoginButton({ invitationToken }: LoginButtonProps) {
	const [loading, setLoading] = useState(false);
	const supabase = createClient();

	const handleLogin = async () => {
		try {
			setLoading(true);

			// 認証前にinvitation_tokenをクッキーに保存
			if (invitationToken) {
				// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not widely supported; direct cookie assignment is necessary for auth token storage
				document.cookie = `invitation_token=${invitationToken}; path=/; max-age=3600; SameSite=Lax`;
			}

			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) {
				throw error;
			}
		} catch (_error) {
			// TODO: Display user-facing error feedback (e.g. toast notification)
			return;
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
