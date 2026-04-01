"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/custom/auth-form";

export function LoginForm() {
	const searchParams = useSearchParams();
	const invitationToken = searchParams.get("token") || undefined;
	const redirectTo = searchParams.get("redirectTo") || undefined;
	return <AuthForm invitationToken={invitationToken} redirectTo={redirectTo} />;
}
