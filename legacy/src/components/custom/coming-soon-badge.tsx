import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComingSoonBadgeProps {
	label?: string;
	className?: string;
}

export function ComingSoonBadge({
	label = "実装予定",
	className,
}: ComingSoonBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium",
				className,
			)}
		>
			<Clock className="h-3 w-3" />
			<span>{label}</span>
		</div>
	);
}
