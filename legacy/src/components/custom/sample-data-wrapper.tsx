import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComingSoonBadge } from "./coming-soon-badge";

interface SampleDataWrapperProps {
	children: React.ReactNode;
	feature: string;
	className?: string;
}

export function SampleDataWrapper({
	children,
	feature,
	className,
}: SampleDataWrapperProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-semibold">{feature}</h3>
					<ComingSoonBadge />
				</div>
			</div>
			<div className="relative rounded-lg border bg-gray-50/50">
				<div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
					<Info className="h-3 w-3" />
					<span>サンプルデータ</span>
				</div>
				{children}
			</div>
		</div>
	);
}
