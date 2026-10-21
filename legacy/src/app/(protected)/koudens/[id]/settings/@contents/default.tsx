"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Settings, Users, HeartHandshake, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingCard {
	title: string;
	description: string;
	href: string;
	icon: React.ReactNode;
	category: "basic" | "customizable";
}

const settingCards: SettingCard[] = [
	{
		title: "一般設定",
		description: "香典帳の基本情報や表示設定を管理します",
		href: "general",
		icon: <Settings className="w-6 h-6" />,
		category: "basic",
	},
	{
		title: "メンバー",
		description: "香典帳の管理者やメンバーを設定します",
		href: "members",
		icon: <Users className="w-6 h-6" />,
		category: "basic",
	},
	{
		title: "プラン管理",
		description: "香典帳のプランを管理します",
		href: "plans",
		icon: <Truck className="w-6 h-6" />,
		category: "basic",
	},
	{
		title: "関係性",
		description: "弔問者との関係性の種類を管理します",
		href: "relationships",
		icon: <HeartHandshake className="w-6 h-6" />,
		category: "customizable",
	},
];

export default function SettingsDefaultPage() {
	const { id: koudenId } = useParams();

	const renderSettingCards = (category: "basic" | "customizable") => {
		return settingCards
			.filter((card) => card.category === category)
			.map((card) => (
				<Link
					key={card.href}
					href={`/koudens/${koudenId}/settings/${card.href}`}
					className={cn(
						"block p-6 rounded-lg border border-border",
						"hover:border-primary/50 hover:shadow-md transition-all",
						"bg-card text-card-foreground",
					)}
				>
					<div className="flex items-start gap-4">
						<div className="p-2 rounded-md bg-primary/10 text-primary">{card.icon}</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-medium mb-1">{card.title}</h3>
							<p className="text-sm text-muted-foreground">{card.description}</p>
						</div>
					</div>
				</Link>
			));
	};

	return (
		<div className="max-w-4xl mx-auto">
			<div className="space-y-8">
				<section>
					<h2 className="text-lg font-semibold mb-4">基本設定</h2>
					<div className="grid gap-4 sm:grid-cols-2">{renderSettingCards("basic")}</div>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-4">カスタマイズ設定</h2>
					<div className="grid gap-4 sm:grid-cols-2">{renderSettingCards("customizable")}</div>
				</section>
			</div>
		</div>
	);
}
