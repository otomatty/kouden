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
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback${
						invitationToken ? `?invitation_token=${invitationToken}` : ""
					}`,
				},
			});

			if (error) {
				throw error;
			}
		} catch (error) {
			console.error("Error logging in:", error);
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
