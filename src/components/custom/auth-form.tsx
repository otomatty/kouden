"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/custom/icons/google";
import { useRouter } from "next/navigation";

interface AuthFormProps {
	invitationToken?: string;
	redirectTo?: string;
}

type AuthStep = "email" | "otp";

export function AuthForm({ invitationToken, redirectTo: propRedirectTo }: AuthFormProps) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [otpCode, setOtpCode] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [redirectUrl, setRedirectUrl] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState<AuthStep>("email");
	const supabase = createClient();

	useEffect(() => {
		// Store invitation token in cookie before authentication
		if (invitationToken) {
			try {
				document.cookie = `invitation_token=${invitationToken}; path=/; max-age=3600; SameSite=Lax; Secure`;
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

	const handleSendOtp = async () => {
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
				options: { shouldCreateUser: true },
			});

			if (error) {
				throw error;
			}

			setCurrentStep("otp");
			setMessage("認証コードをメールアドレスに送信しました。メールボックスを確認してください。");
		} catch (error) {
			console.error("[ERROR] OTP send failed:", error);
			if (error instanceof Error) {
				setMessage(`認証コードの送信に失敗しました: ${error.message}`);
			} else {
				setMessage("認証コードの送信に失敗しました。再度お試しください。");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOtp = async () => {
		if (!otpCode || otpCode.length !== 6) {
			setMessage("6桁の認証コードを入力してください");
			return;
		}

		try {
			setIsLoading(true);
			setMessage(null);

			const { data, error } = await supabase.auth.verifyOtp({
				email,
				token: otpCode,
				type: "email",
			});

			if (error) {
				throw error;
			}

			if (data.session) {
				// ログイン成功
				const redirectTo = propRedirectTo || "/koudens";
				router.push(redirectTo);
			} else {
				throw new Error("セッションの作成に失敗しました");
			}
		} catch (error) {
			console.error("[ERROR] OTP verification failed:", error);
			if (error instanceof Error) {
				setMessage(`認証コードの確認に失敗しました: ${error.message}`);
			} else {
				setMessage("認証コードの確認に失敗しました。再度お試しください。");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOtp = async () => {
		setOtpCode("");
		setMessage(null);
		await handleSendOtp();
	};

	const handleBackToEmail = () => {
		setCurrentStep("email");
		setOtpCode("");
		setMessage(null);
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

			{currentStep === "email" && (
				<>
					{/* Email Input Section */}
					<div className="flex flex-col space-y-2">
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="メールアドレス"
							className="w-full px-3 py-2 border rounded bg-background"
							disabled={isLoading}
							onKeyDown={(e) => {
								if (e.key === "Enter" && email) {
									handleSendOtp();
								}
							}}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={handleSendOtp}
							disabled={!email || isLoading}
						>
							{isLoading ? "送信中..." : "認証コードを送信"}
						</Button>
					</div>

					{/* Separator */}
					<div className="relative flex items-center py-5">
						<div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
						<span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">
							または
						</span>
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
				</>
			)}

			{currentStep === "otp" && (
				<>
					{/* OTP Input Section */}
					<div className="flex flex-col space-y-4">
						<div className="text-center">
							<h3 className="text-lg font-medium mb-2">認証コードを入力してください</h3>
							<p className="text-sm text-gray-500 mb-4">
								<span className="font-medium">{email}</span>{" "}
								に送信された6桁のコードを入力してください
							</p>
						</div>

						<div className="flex justify-center">
							<InputOTP
								maxLength={6}
								value={otpCode}
								onChange={setOtpCode}
								onComplete={handleVerifyOtp}
								disabled={isLoading}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>

						<Button
							type="button"
							onClick={handleVerifyOtp}
							disabled={otpCode.length !== 6 || isLoading}
							className="w-full"
						>
							{isLoading ? "確認中..." : "ログイン"}
						</Button>

						<div className="flex flex-col space-y-2 pt-4 border-t">
							<Button
								type="button"
								variant="ghost"
								onClick={handleResendOtp}
								disabled={isLoading}
								className="text-sm"
							>
								認証コードを再送信
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={handleBackToEmail}
								disabled={isLoading}
								className="text-sm"
							>
								← メールアドレスを変更
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
