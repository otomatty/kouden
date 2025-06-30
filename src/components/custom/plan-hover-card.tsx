"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Database } from "@/types/supabase";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

interface PlanHoverCardProps {
	plan: Plan;
	/** バッジのvariant */
	badgeVariant?: "default" | "secondary" | "destructive" | "outline";
	/** バッジに表示する追加のクラス */
	badgeClassName?: string;
	/** 子要素（通常はBadgeコンポーネント） */
	children?: React.ReactNode;
}

/**
 * プランの詳細情報をホバーカードで表示するコンポーネント
 */
export function PlanHoverCard({
	plan,
	badgeVariant = "default",
	badgeClassName,
	children,
}: PlanHoverCardProps) {
	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				{children || (
					<Badge variant={badgeVariant} className={badgeClassName}>
						{plan.name}
					</Badge>
				)}
			</HoverCardTrigger>
			<HoverCardContent className="w-80">
				<div className="space-y-3">
					<div className="space-y-1">
						<h4 className="text-sm font-semibold">{plan.name}</h4>
						<p className="text-lg font-bold text-primary">
							{plan.price === 0 ? "無料" : `¥${plan.price.toLocaleString()}`}
						</p>
					</div>

					{plan.description && (
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">{plan.description}</p>
						</div>
					)}

					{plan.features && plan.features.length > 0 && (
						<div className="space-y-2">
							<h5 className="text-sm font-medium">機能</h5>
							<ul className="space-y-1">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-center gap-2 text-sm">
										<Check className="h-3 w-3 text-green-500 flex-shrink-0" />
										<span>{feature}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
