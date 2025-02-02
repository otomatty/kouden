"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/custom/icons/google";

export function LoginForm() {
	const supabase = createClient();

	const handleGoogleLogin = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) {
				throw error;
			}
		} catch (error) {
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
				onClick={handleGoogleLogin}
				className="flex items-center justify-center gap-2"
			>
				<GoogleIcon className="h-5 w-5" />
				<span>Googleでログイン</span>
			</Button>
		</div>
	);
}
