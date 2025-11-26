import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

interface BadgeCellProps extends VariantProps<typeof Badge> {
	value: string;
	variant?: BadgeProps["variant"];
}

export function BadgeCell({ value, variant = "default" }: BadgeCellProps) {
	return <Badge variant={variant}>{value}</Badge>;
}
