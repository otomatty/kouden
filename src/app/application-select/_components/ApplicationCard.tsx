import type { LucideProps } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ApplicationCardProps = {
	href: string;
	title: string;
	description: string;
	icon: ComponentType<LucideProps>;
	iconColor?: string;
};

export default function ApplicationCard({
	href,
	title,
	description,
	icon: Icon,
	iconColor = "text-blue-600",
}: ApplicationCardProps) {
	return (
		<Link href={href}>
			<Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full">
				<CardHeader className="flex items-center space-x-3 p-4">
					<Icon className={`h-6 w-6 ${iconColor}`} />
					<CardTitle className="text-lg font-semibold">{title}</CardTitle>
				</CardHeader>
				<CardContent className="px-4 pb-4 text-sm text-gray-600">{description}</CardContent>
			</Card>
		</Link>
	);
}
