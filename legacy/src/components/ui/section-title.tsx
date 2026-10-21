import { cn } from "@/lib/utils";
import { zenOldMincho } from "@/app/fonts";

interface SectionTitleProps {
	title: string;
	subtitle?: string;
	className?: string;
}

export function SectionTitle({ title, subtitle, className }: SectionTitleProps) {
	return (
		<div className={cn("text-center space-y-4", className)}>
			<h2
				className={`text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl ${zenOldMincho.className}`}
			>
				{title}
			</h2>
			{subtitle && (
				<p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
					{subtitle}
				</p>
			)}
		</div>
	);
}
