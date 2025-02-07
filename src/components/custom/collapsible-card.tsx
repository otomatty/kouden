"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
	title: string;
	description?: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	className?: string;
}

/**
 * 開閉可能なカードコンポーネント
 * @param title - カードのタイトル
 * @param description - カードの説明文（オプション）
 * @param children - カードの内容
 * @param defaultOpen - 初期状態で開いているかどうか（デフォルト: true）
 * @param className - 追加のクラス名
 */
export function CollapsibleCard({
	title,
	description,
	children,
	defaultOpen = true,
	className,
}: CollapsibleCardProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Card className={cn("w-full", className)}>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CardHeader className="cursor-pointer">
					<CollapsibleTrigger className="flex w-full items-center justify-between">
						<div className="flex-1 text-left">
							<CardTitle>{title}</CardTitle>
							{description && <CardDescription>{description}</CardDescription>}
						</div>
						<ChevronDown
							className={cn(
								"h-4 w-4 shrink-0 transition-transform duration-200",
								isOpen && "rotate-180",
							)}
						/>
					</CollapsibleTrigger>
				</CardHeader>
				<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
					<CardContent>{children}</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
