"use client";

import { GoogleIcon } from "@/components/custom/icons/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useCSRFToken } from "@/hooks/use-csrf-token";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
	const { fetchWithCSRF } = useCSRFToken();

	useEffect(() => {
		// Build callback URL for Supabase OAuth (include invitation token if present)
		const base = `${window.location.origin}/auth/callback`;
		const params = new URLSearchParams();
		if (invitationToken) {
			params.append("token", invitationToken);
		}
		const callbackUrl = params.toString() ? `${base}?${params.toString()}` : base;
		setRedirectUrl(callbackUrl);
	}, [invitationToken]);

	/**
	 * 認証フローに必要な Cookie をサーバー側で HttpOnly 付きで設定する。
	 * 失敗時は false を返し、呼び出し側で OAuth/OTP 起動を中止する。
	 *
	 * 順序が重要: 必ず post_auth_redirect → invitation_token の順で書く。
	 *   invitation_token は次回認証時に /auth/callback で `acceptInvitation`
	 *   を自動発火させる semantics を持つため、部分失敗で取り残されると
	 *   ユーザーが意図しない香典帳に参加させられる可能性がある。
	 *   post_auth_redirect は読み出し時に毎回上書き / 削除される素朴な
	 *   リダイレクト先なので、取り残されても害は無い。よって「悪い側」を
	 *   後に書き、前段が失敗した時点で abort することで orphan を回避する。
	 */
	const setupAuthCookies = async (): Promise<boolean> => {
		try {
			if (propRedirectTo) {
				const res = await fetchWithCSRF("/api/auth/cookies/post-auth-redirect", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ redirectTo: propRedirectTo }),
				});
				if (!res.ok) {
					console.error("[ERROR] Failed to store post-auth redirect cookie:", await res.text());
					setMessage("認証情報の保存に失敗しました。再度お試しください。");
					return false;
				}
			}
			if (invitationToken) {
				const res = await fetchWithCSRF("/api/auth/cookies/invitation-token", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token: invitationToken }),
				});
				if (!res.ok) {
					console.error("[ERROR] Failed to store invitation token cookie:", await res.text());
					setMessage("認証情報の保存に失敗しました。再度お試しください。");
					return false;
				}
			}
			return true;
		} catch (error) {
			console.error("[ERROR] Network error during cookie setup:", error);
			setMessage("通信エラーが発生しました。再度お試しください。");
			return false;
		}
	};

	/**
	 * `signInWith*` 失敗時に、setupAuthCookies で書いた invitation_token Cookie を
	 * 破棄する。失敗放置だと Cookie が Max-Age=3600 残存し、次回ログイン時に古い
	 * 招待が auto-apply されてしまう。
	 *
	 * 失敗はベストエフォートで握りつぶす（ロールバックの失敗を更にユーザーに
	 * 出してもどうしようもない）。
	 */
	const clearInvitationCookie = async () => {
		if (!invitationToken) return;
		try {
			await fetchWithCSRF("/api/auth/cookies/invitation-token", { method: "DELETE" });
		} catch (error) {
			console.error("[ERROR] Failed to clear invitation token cookie:", error);
		}
	};

	const handleSendOtp = async () => {
		if (!email) {
			setMessage("メールアドレスを入力してください");
			return;
		}

		try {
			setIsLoading(true);
			setMessage(null);

			const cookiesOk = await setupAuthCookies();
			if (!cookiesOk) {
				setIsLoading(false);
				return;
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
			await clearInvitationCookie();
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
		// ユーザーが OTP フローを明示的に放棄した時点で Cookie をクリアする。
		// 同じメールで再送信した場合 setupAuthCookies が再書き込みするので、
		// 別メールに切り替える正規ケースで stale Cookie を残さないようにする。
		// 注: handleVerifyOtp の失敗 catch では消さない。OTP 一回ミスごとに Cookie を
		// 飛ばすと、正しいコードでのリトライが invitation_token 無しで callback に
		// 到達して招待フローが壊れるため。
		clearInvitationCookie();
	};

	const handleGoogleLogin = async () => {
		try {
			setIsLoading(true);
			setMessage(null);

			const cookiesOk = await setupAuthCookies();
			if (!cookiesOk) {
				setIsLoading(false);
				return;
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
			await clearInvitationCookie();
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
