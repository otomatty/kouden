"use client";

import { AuthForm } from "@/components/custom/AuthForm";
import { useSearchParams } from "next/navigation";

export function LoginForm() {
	const searchParams = useSearchParams();
	const invitationToken = searchParams.get("token") || undefined;
	const redirectTo = searchParams.get("redirectTo") || undefined;
	return <AuthForm invitationToken={invitationToken} redirectTo={redirectTo} />;
}
