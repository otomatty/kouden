"use client";

import { ArrowRight, BookOpen, CheckCircle, Circle, Play, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickStartStep {
	id: string;
	title: string;
	description: string;
	link: string;
	category: string;
	slug: string;
	estimatedTime: string;
}

const quickStartSteps: QuickStartStep[] = [
	{
		id: "introduction",
		title: "まずはここから：基本を理解する",
		description: "香典帳アプリって何？どんなことができるの？",
		link: "/manuals/getting-started/introduction",
		category: "getting-started",
		slug: "introduction",
		estimatedTime: "2分",
	},
	{
		id: "basic-usage",
		title: "実際に使ってみる",
		description: "香典帳を作って、最初の記録を追加してみましょう",
		link: "/manuals/getting-started/basic-usage",
		category: "getting-started",
		slug: "basic-usage",
		estimatedTime: "3分",
	},
	{
		id: "features",
		title: "便利な機能を知る",
		description: "もっと効率的に使うための機能を確認しましょう",
		link: "/manuals/features/offering-management",
		category: "features",
		slug: "offering-management",
		estimatedTime: "3分",
	},
];

interface QuickStartGuideProps {
	onDismiss?: () => void;
	className?: string;
}

export function QuickStartGuide({ onDismiss, className }: QuickStartGuideProps) {
	const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
	const [currentStep] = useState(0);

	const handleStepComplete = (stepId: string) => {
		const newCompleted = new Set(completedSteps);
		if (newCompleted.has(stepId)) {
			newCompleted.delete(stepId);
		} else {
			newCompleted.add(stepId);
		}
		setCompletedSteps(newCompleted);
	};

	const progress = (completedSteps.size / quickStartSteps.length) * 100;

	return (
		<Card className={`border-l-4 border-l-primary ${className}`}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Play className="w-5 h-5 text-primary" />
						<CardTitle className="text-lg">🚀 はじめての方へ</CardTitle>
					</div>
					{onDismiss && (
						<Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0">
							<X className="w-4 h-4" />
						</Button>
					)}
				</div>
				<CardDescription>3つのステップで香典帳アプリの使い方をマスターしましょう！</CardDescription>

				{/* プログレスバー */}
				<div className="mt-4">
					<div className="flex justify-between text-xs text-muted-foreground mb-2">
						<span>進捗状況</span>
						<span>
							{completedSteps.size}/{quickStartSteps.length} 完了
						</span>
					</div>
					<div className="w-full bg-secondary rounded-full h-2">
						<div
							className="bg-primary h-2 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{quickStartSteps.map((step, index) => {
					const isCompleted = completedSteps.has(step.id);
					const isCurrent = index === currentStep;

					return (
						<div
							key={step.id}
							className={`rounded-lg border p-4 transition-all ${
								isCurrent ? "bg-primary/5 border-primary/20" : "bg-muted/30"
							}`}
						>
							<div className="flex items-start gap-3">
								<button
									type="button"
									onClick={() => handleStepComplete(step.id)}
									className="mt-1 flex-shrink-0 transition-colors"
								>
									{isCompleted ? (
										<CheckCircle className="w-5 h-5 text-green-600" />
									) : (
										<Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
									)}
								</button>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<h3
											className={`font-medium text-sm ${
												isCompleted ? "line-through text-muted-foreground" : ""
											}`}
										>
											ステップ {index + 1}: {step.title}
										</h3>
										<Badge variant="outline" className="text-xs">
											{step.estimatedTime}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground mb-3">{step.description}</p>

									<Link href={step.link}>
										<Button variant={isCurrent ? "default" : "outline"} size="sm" className="gap-2">
											<BookOpen className="w-3 h-3" />
											{isCompleted ? "もう一度見る" : "読む"}
											<ArrowRight className="w-3 h-3" />
										</Button>
									</Link>
								</div>
							</div>
						</div>
					);
				})}

				{/* 完了メッセージ */}
				{completedSteps.size === quickStartSteps.length && (
					<div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
						<div className="text-2xl mb-2">🎉</div>
						<h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
							おめでとうございます！
						</h3>
						<p className="text-sm text-green-600 dark:text-green-300">
							基本的な使い方をマスターしました。分からないことがあれば、左のメニューやFAQをご確認ください。
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
