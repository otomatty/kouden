"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface BreadcrumbNavProps {
	category?: string;
	docTitle?: string;
}

const categoryNames = {
	"getting-started": "はじめに",
	"basic-operations": "基本操作",
	"kouden-entries": "香典記録",
	"return-management": "返礼品管理",
	offerings: "供物管理",
	permissions: "権限管理",
	statistics: "統計",
	telegram: "電報管理",
	advanced: "高度な使い方",
	troubleshooting: "トラブルシューティング",
	faq: "よくある質問",
};

export function BreadcrumbNav({ category, docTitle }: BreadcrumbNavProps) {
	return (
		<Breadcrumb className="mb-6">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="/koudens" className="flex items-center gap-1">
						<Home className="w-4 h-4" />
						ホーム
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbLink href="/manuals">マニュアル</BreadcrumbLink>
				</BreadcrumbItem>
				{category && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{docTitle ? (
								<BreadcrumbLink href={`/manuals#${category}`}>
									{categoryNames[category as keyof typeof categoryNames] || category}
								</BreadcrumbLink>
							) : (
								<BreadcrumbPage>
									{categoryNames[category as keyof typeof categoryNames] || category}
								</BreadcrumbPage>
							)}
						</BreadcrumbItem>
					</>
				)}
				{docTitle && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{docTitle}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
