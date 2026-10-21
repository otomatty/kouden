import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface SubmitButtonProps {
	children: ReactNode;
}

export function SubmitButton({ children }: SubmitButtonProps) {
	return <Button type="submit">{children}</Button>;
}
