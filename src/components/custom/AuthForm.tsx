"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/custom/icons/google";
import { useRouter } from "next/navigation";

interface AuthFormProps {
	invitationToken?: string;
	redirectTo?: string;
}

export function AuthForm({ invitationToken, redirectTo: propRedirectTo }: AuthFormProps) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [redirectUrl, setRedirectUrl] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const supabase = createClient();

	useEffect(() => {
		// Store invitation token in cookie before authentication
		if (invitationToken) {
			try {
				document.cookie = `invitation_token=${invitationToken}; path=/; max-age=3600; SameSite=Lax; Secure`;
				console.log("[DEBUG] Stored invitation token in cookie:", invitationToken);
			} catch (error) {
				console.error("[ERROR] Failed to store invitation token in cookie:", error);
				setMessage("招待情報の保存に失敗しました。再度お試しください。");
			}
		}

		// Build callback URL for Supabase OAuth (include invitation token if present)
		const base = `${window.location.origin}/auth/callback`;
		const params = new URLSearchParams();
		if (invitationToken) {
			params.append("token", invitationToken);
		}
		const callbackUrl = params.toString() ? `${base}?${params.toString()}` : base;
		setRedirectUrl(callbackUrl);
	}, [invitationToken]);

	const handleMagicLinkLogin = async () => {
		if (!email) {
			setMessage("メールアドレスを入力してください");
			return;
		}

		try {
			setIsLoading(true);
			setMessage(null);

			// Store post-login redirect in cookie if provided
			if (propRedirectTo) {
				document.cookie = `post_auth_redirect=${encodeURIComponent(propRedirectTo)}; path=/; SameSite=Lax; Secure`;
			}

			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: { emailRedirectTo: redirectUrl },
			});

			if (error) {
				throw error;
			}

			router.push(`/auth/sent?email=${encodeURIComponent(email)}`);
		} catch (error) {
			console.error("[ERROR] Magic Link login failed:", error);
			if (error instanceof Error) {
				setMessage(`ログインに失敗しました: ${error.message}`);
			} else {
				setMessage("ログインに失敗しました。再度お試しください。");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			setIsLoading(true);
			setMessage(null);

			// Store post-login redirect in cookie if provided
			if (propRedirectTo) {
				document.cookie = `post_auth_redirect=${encodeURIComponent(propRedirectTo)}; path=/; SameSite=Lax; Secure`;
			}

			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo: redirectUrl },
			});

			if (error) {
				throw error;
			}
		} catch (error) {
			console.error("[ERROR] Google login failed:", error);
			if (error instanceof Error) {
				setMessage(`Googleログインに失敗しました: ${error.message}`);
			} else {
				setMessage("Googleログインに失敗しました。再度お試しください。");
			}
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col space-y-4">
			{message && (
				<div
					className={`text-sm p-3 rounded-md ${
						message.includes("失敗") || message.includes("エラー")
							? "bg-destructive/10 text-destructive border border-destructive/20"
							: "bg-muted text-muted-foreground"
					}`}
				>
					{message}
				</div>
			)}

			{/* Magic Link Login Section */}
			<div className="flex flex-col space-y-2">
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="メールアドレス"
					className="w-full px-3 py-2 border rounded"
					disabled={isLoading}
				/>
				<Button
					type="button"
					variant="outline"
					onClick={handleMagicLinkLogin}
					disabled={!email || isLoading}
				>
					{isLoading ? "送信中..." : "メールでログイン"}
				</Button>
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
				disabled={isLoading}
			>
				<GoogleIcon className="h-5 w-5" />
				<span>{isLoading ? "ログイン中..." : "Googleでログイン"}</span>
			</Button>
		</div>
	);
}
