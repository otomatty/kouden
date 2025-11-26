"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface SubmitButtonProps {
	children: ReactNode;
}

export default function SubmitButton({ children }: SubmitButtonProps) {
	return <Button type="submit">{children}</Button>;
}
