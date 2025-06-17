"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface SupportTabsProps {
	activeTab: string;
	contactContent: ReactNode;
	campaignContent: ReactNode;
}

export function SupportTabs({ activeTab, contactContent, campaignContent }: SupportTabsProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		params.delete("page"); // ページをリセット
		router.push(`/admin/support?${params.toString()}`);
	};

	return (
		<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="contact">お問い合わせ管理</TabsTrigger>
				<TabsTrigger value="campaign">キャンペーン申し込み管理</TabsTrigger>
			</TabsList>

			<TabsContent value="contact" className="space-y-6">
				{contactContent}
			</TabsContent>

			<TabsContent value="campaign" className="space-y-6">
				{campaignContent}
			</TabsContent>
		</Tabs>
	);
}
