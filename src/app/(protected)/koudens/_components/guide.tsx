"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ListPlus, Users2, Sparkles, HelpCircle } from "lucide-react";
import { useAtomValue } from "jotai";
import { guideModeAtom } from "@/store/guide";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { cn } from "@/lib/utils";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { updateGuideVisibility } from "@/app/_actions/settings";

const guideItems = [
	{
		id: "create",
		title: "香典帳の作成",
		icon: Plus,
		summary: "香典帳を作成し、タイトルや説明を設定できます。",
		steps: [
			{
				title: "香典帳の作成を開始",
				description: "「香典帳を作成する」ボタンをクリックします",
				image: "/images/guide/create-1.png",
			},
			{
				title: "情報を入力",
				description: "タイトルと説明（任意）を入力して作成します",
				image: "/images/guide/create-2.png",
			},
			{
				title: "詳細ページへ移動",
				description: "作成後は自動的に詳細ページに移動します",
				image: "/images/guide/create-3.png",
			},
		],
	},
	{
		id: "manage",
		title: "香典の記録",
		icon: ListPlus,
		summary: "香典の記録を追加・編集・削除できます。",
		steps: [
			{
				title: "記録の追加",
				description: "香典帳の詳細ページで「記録を追加」をクリックします",
				image: "/images/guide/manage-1.png",
			},
			{
				title: "情報の入力",
				description: "名前、金額、参列種別などの情報を入力します",
				image: "/images/guide/manage-2.png",
			},
			{
				title: "表示形式",
				description: "PCでは表形式、スマートフォンではカード形式で表示されます",
				image: "/images/guide/manage-3.png",
			},
			{
				title: "編集と削除",
				description: "記録した内容は後から編集・削除が可能です",
				image: "/images/guide/manage-4.png",
			},
		],
	},
	{
		id: "share",
		title: "共同編集",
		icon: Users2,
		summary: "家族や親族と香典帳を共同で編集できます。",
		steps: [
			{
				title: "共同編集の開始",
				description: "香典帳は家族や親族と共同で編集できます",
				image: "/images/guide/share-1.png",
			},
			{
				title: "招待リンクの作成",
				description: "詳細ページの「メンバー」タブから招待リンクを作成できます",
				image: "/images/guide/share-2.png",
			},
			{
				title: "権限の設定",
				description: "招待する際に権限を設定できます",
				image: "/images/guide/share-3.png",
			},
			{
				title: "有効期限の設定",
				description: "共有リンクには有効期限を設定できます",
				image: "/images/guide/share-4.png",
			},
		],
	},
	{
		id: "features",
		title: "便利な機能",
		icon: Sparkles,
		summary: "お供物、弔電、返礼品の管理や統計情報の確認ができます。",
		steps: [
			{
				title: "お供物の記録",
				description: "お供物の種類や金額を記録できます",
				image: "/images/guide/features-1.png",
			},
			{
				title: "弔電の管理",
				description: "弔電の内容を記録・管理できます",
				image: "/images/guide/features-2.png",
			},
			{
				title: "返礼品の管理",
				description: "返礼品の記録と進捗管理ができます",
				image: "/images/guide/features-3.png",
			},
			{
				title: "統計情報",
				description: "参列者数や香典総額などの統計が確認できます",
				image: "/images/guide/features-4.png",
			},
		],
	},
	{
		id: "tour",
		title: "わかりやすい説明",
		icon: HelpCircle,
		summary: "各ページの機能を順番に説明するツアーガイドを利用できます。",
		steps: [
			{
				title: "ツアーの開始",
				description:
					"各ページの右上にあるヘルプアイコンをクリックすると、そのページの機能を順番に説明します",
				image: "/images/guide/tour-1.png",
			},
			{
				title: "ツアーの操作",
				description: "ツアーは途中で中断することもできます",
				image: "/images/guide/tour-2.png",
			},
			{
				title: "ツアーの再表示",
				description: "一度見たツアーは再度見ることもできます",
				image: "/images/guide/tour-3.png",
			},
			{
				title: "ツアーの更新",
				description: "新機能が追加された場合は、ツアーも更新されます",
				image: "/images/guide/tour-4.png",
			},
		],
	},
];

function HideGuideButton() {
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	const handleHideGuide = async () => {
		try {
			setIsLoading(true);
			const result = await updateGuideVisibility(false);

			if (!result.success) {
				throw new Error(result.error ?? "ガイドの非表示に失敗しました");
			}

			toast({
				title: "ガイドを非表示にしました",
				description: "設定画面からいつでも表示できます",
				action: (
					<Button
						variant="outline"
						size="sm"
						onClick={async () => {
							try {
								const result = await updateGuideVisibility(true);
								if (!result.success) {
									throw new Error(result.error ?? "ガイドの表示に失敗しました");
								}
								toast({
									title: "ガイドを再表示しました",
								});
							} catch (error) {
								toast({
									title: "エラーが発生しました",
									description: error instanceof Error ? error.message : "設定の更新に失敗しました",
									variant: "destructive",
								});
							}
						}}
					>
						元に戻す
					</Button>
				),
			});
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description: error instanceof Error ? error.message : "設定の更新に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant="link"
			className="text-sm text-muted-foreground hover:text-primary"
			onClick={handleHideGuide}
			disabled={isLoading}
		>
			{isLoading ? "更新中..." : "ガイドを非表示にする"}
		</Button>
	);
}

export function Guide() {
	const isEnabled = useAtomValue(guideModeAtom);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isEnabled === null || !isEnabled) return null;

	const renderCard = (item: (typeof guideItems)[0]) => (
		<ResponsiveDialog
			key={item.id}
			trigger={
				<Card
					className={cn(
						"cursor-pointer hover:bg-accent/50 transition-colors",
						isDesktop ? "flex-1  max-w-[300px]" : "flex-shrink-0 w-[160px] snap-start",
					)}
				>
					<CardHeader className={cn("pt-4 pb-2 px-4", !isDesktop && "pb-2")}>
						<CardTitle
							className={cn("flex items-center gap-2", !isDesktop && "flex-col text-center")}
						>
							<item.icon className={cn("shrink-0", isDesktop ? "h-4 w-4" : "h-6 w-6")} />
							<span className={cn("text-base", !isDesktop && "text-sm font-medium")}>
								{item.title}
							</span>
						</CardTitle>
					</CardHeader>
					{isDesktop ? (
						<CardContent className="pt-0">
							<p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
						</CardContent>
					) : null}
				</Card>
			}
			title={item.title}
		>
			<Carousel className="w-full max-w-lg mx-auto">
				<CarouselContent>
					{item.steps.map((step, index) => (
						<CarouselItem key={uuidv4()} className="px-1">
							<div className="space-y-4">
								<div className="relative aspect-video w-full overflow-hidden rounded-lg">
									<Image src={step.image} alt={step.title} fill className="object-cover" />
								</div>
								<div className="space-y-2">
									<h3 className="font-semibold">
										{index + 1}. {step.title}
									</h3>
									<p className="text-sm text-muted-foreground">{step.description}</p>
								</div>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</ResponsiveDialog>
	);

	return (
		<div className="space-y-2">
			<h2 className="text-2xl font-bold">香典帳の使い方</h2>
			<p className="text-sm text-muted-foreground">クリックすると詳細な説明が表示されます</p>
			<div
				className={cn(
					"overflow-x-auto py-2",
					isDesktop ? "flex gap-4 pb-4" : "flex gap-3 snap-x px-4 -mx-4",
				)}
			>
				{guideItems.map(renderCard)}
			</div>

			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					※ガイドの表示/非表示は設定画面から切り替えることができます
				</p>
				<HideGuideButton />
			</div>
		</div>
	);
}
