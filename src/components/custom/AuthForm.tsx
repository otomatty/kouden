"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/custom/icons/google";
import { useRouter } from "next/navigation";

interface AuthFormProps {
	invitationToken?: string;
}

export function AuthForm({ invitationToken }: AuthFormProps) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [redirectTo, setRedirectTo] = useState<string>("");
	const supabase = createClient();

	useEffect(() => {
		const origin = window.location.origin;
		const baseUrl = `${origin}/auth/callback`;
		setRedirectTo(invitationToken ? `${baseUrl}?token=${invitationToken}` : baseUrl);
	}, [invitationToken]);

	const handleMagicLinkLogin = async () => {
		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: { emailRedirectTo: redirectTo },
			});
			if (error) throw error;
			router.push(`/auth/sent?email=${encodeURIComponent(email)}`);
			return;
		} catch (error) {
			if (error instanceof Error) {
				console.error("Magic Link エラー:", error.message);
				setMessage(`エラーが発生しました: ${error.message}`);
			}
		}
	};

	const handleGoogleLogin = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo },
			});
			if (error) throw error;
		} catch (error) {
			if (error instanceof Error) {
				console.error("エラーメッセージ:", error.message);
				console.error("エラースタック:", error.stack);
			}
		}
	};

	return (
		<div className="flex flex-col space-y-4">
			{/* Magic Link Login Section */}
			<div className="flex flex-col space-y-2">
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="メールアドレス"
					className="w-full px-3 py-2 border rounded"
				/>
				<Button type="button" variant="outline" onClick={handleMagicLinkLogin} disabled={!email}>
					メールでログイン
				</Button>
				{message && <p className="text-sm text-gray-500">{message}</p>}
			</div>

			{/* Separator */}
			<div className="relative flex items-center py-5">
				<div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
				<span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">または</span>
				<div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
			</div>

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
