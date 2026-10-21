"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, MapPin, X, Eye } from "lucide-react";

interface TourStep {
	id: string;
	title: string;
	description: string;
	target: string; // セレクタ
	position: "top" | "bottom" | "left" | "right";
	action?: string;
}

const tourSteps: TourStep[] = [
	{
		id: "welcome",
		title: "マニュアルへようこそ！",
		description: "香典帳アプリの使い方を分かりやすく説明しています。一緒に見て回りましょう。",
		target: "body",
		position: "top",
	},
	{
		id: "sidebar",
		title: "左のメニューでナビゲーション",
		description:
			"ここから各カテゴリのドキュメントにアクセスできます。クリックして展開してみてください。",
		target: "[data-tour='sidebar']",
		position: "right",
		action: "カテゴリをクリック",
	},
	{
		id: "search",
		title: "検索で素早く見つける",
		description: "知りたいことがあるときは、こちらの検索機能が便利です。",
		target: "[data-tour='search']",
		position: "bottom",
		action: "検索してみる",
	},
	{
		id: "quick-access",
		title: "カテゴリから直接アクセス",
		description:
			"各カテゴリのカードをクリックすると、そのカテゴリのドキュメント一覧を確認できます。",
		target: "[data-tour='categories']",
		position: "top",
		action: "カードをクリック",
	},
	{
		id: "complete",
		title: "準備完了！",
		description:
			"これでマニュアルの使い方が分かりました。分からないことがあれば、いつでも戻ってきてくださいね。",
		target: "body",
		position: "top",
	},
];

interface GuidedTourProps {
	isActive: boolean;
	onComplete: () => void;
	onSkip: () => void;
}

export function GuidedTour({ isActive, onComplete, onSkip }: GuidedTourProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [, setTargetElement] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (!isActive) return;

		const step = tourSteps[currentStep];
		if (!step) return;

		const element = document.querySelector(step.target) as HTMLElement;
		setTargetElement(element);

		if (element) {
			// ハイライト効果
			element.style.position = "relative";
			element.style.zIndex = "1000";
			element.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.3)";
			element.style.borderRadius = "8px";

			// スクロールして要素を表示
			element.scrollIntoView({ behavior: "smooth", block: "center" });
		}

		return () => {
			if (element) {
				element.style.position = "";
				element.style.zIndex = "";
				element.style.boxShadow = "";
				element.style.borderRadius = "";
			}
		};
	}, [currentStep, isActive]);

	if (!isActive) return null;

	const step = tourSteps[currentStep];
	if (!step) return null;

	const handleNext = () => {
		if (currentStep < tourSteps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onComplete();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const isLastStep = currentStep === tourSteps.length - 1;

	return (
		<>
			{/* オーバーレイ */}
			<div className="fixed inset-0 bg-black/50 z-50 pointer-events-none" />

			{/* ツアーカード */}
			<Card
				className="fixed z-[60] w-80 shadow-lg pointer-events-auto"
				style={{
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<CardContent className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<MapPin className="w-4 h-4 text-primary" />
							<Badge variant="secondary" className="text-xs">
								{currentStep + 1} / {tourSteps.length}
							</Badge>
						</div>
						<Button variant="ghost" size="sm" onClick={onSkip} className="h-6 w-6 p-0">
							<X className="w-4 h-4" />
						</Button>
					</div>

					<h3 className="font-semibold text-lg mb-2">{step.title}</h3>
					<p className="text-sm text-muted-foreground mb-4">{step.description}</p>

					{step.action && (
						<div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
							<div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
								<Eye className="w-4 h-4" />
								<span className="font-medium">試してみる: {step.action}</span>
							</div>
						</div>
					)}

					{/* プログレスバー */}
					<div className="mb-4">
						<div className="w-full bg-secondary rounded-full h-1.5">
							<div
								className="bg-primary h-1.5 rounded-full transition-all duration-300"
								style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
							/>
						</div>
					</div>

					<div className="flex justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={handlePrev}
							disabled={currentStep === 0}
							className="gap-2"
						>
							<ArrowLeft className="w-3 h-3" />
							戻る
						</Button>

						<div className="flex gap-2">
							<Button variant="ghost" size="sm" onClick={onSkip}>
								スキップ
							</Button>
							<Button size="sm" onClick={handleNext} className="gap-2">
								{isLastStep ? "完了" : "次へ"}
								{!isLastStep && <ArrowRight className="w-3 h-3" />}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
