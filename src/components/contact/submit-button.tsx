"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
	children: ReactNode;
}

export default function SubmitButton({ children }: SubmitButtonProps) {
	return <Button type="submit">{children}</Button>;
}
