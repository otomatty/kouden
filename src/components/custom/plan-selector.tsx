"use client";

import ExpectedCountInput from "@/components/custom/expected-count-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePlanSelection } from "@/hooks/use-plan-selection";
import { cn } from "@/lib/utils";
import type { PlanSelectorProps } from "@/types/plan-selector";

/**
 * プラン選択の基盤コンポーネント
 * モバイル：アコーディオン形式、デスクトップ：カード形式で表示
 */
export function PlanSelector({
	plans,
	selectedPlan,
	expectedCount = 0,
	currentPlan,
	mode,
	onPlanChange,
	onExpectedCountChange,
	loading = false,
	disabled = false,
	className,
}: PlanSelectorProps) {
	const { planDisplayData, handlePlanChange, handleExpectedCountChange, validationErrors } =
		usePlanSelection({
			plans,
			initialPlan: selectedPlan,
			initialExpectedCount: expectedCount,
			currentPlan,
			mode,
		});

	// プラン変更時の処理
	const handlePlanSelect = (planCode: string) => {
		handlePlanChange(planCode);
		onPlanChange(planCode);
	};

	// 予想件数変更時の処理
	const handleCountChange = (count: number) => {
		handleExpectedCountChange(count);
		onExpectedCountChange(count);
	};

	return (
		<div className={cn("space-y-6", className)}>
			{/* プラン選択 */}
			<FormItem>
				<FormLabel required>プランを選択</FormLabel>
				<div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 mt-2">
					{planDisplayData.map((plan) => {
						const isSelected = selectedPlan === plan.code;

						return (
							<label key={plan.code} className="block">
								{/* モバイル用アコーディオンレイアウト */}
								<div className="sm:hidden">
									<button
										type="button"
										className={cn(
											"bg-background rounded-lg border-2 cursor-pointer transition-all duration-200 w-full flex flex-col text-left",
											isSelected
												? "border-primary bg-primary/5"
												: "border-gray-200 hover:border-gray-300",
											disabled && "opacity-50 cursor-not-allowed bg-background",
											!plan.isSelectable &&
												mode === "upgrade" &&
												"opacity-50 cursor-not-allowed bg-background",
										)}
										onClick={() => plan.isSelectable && !disabled && handlePlanSelect(plan.code)}
										onKeyDown={(e) => {
											if ((e.key === "Enter" || e.key === " ") && plan.isSelectable && !disabled) {
												e.preventDefault();
												handlePlanSelect(plan.code);
											}
										}}
										aria-pressed={isSelected}
										disabled={disabled || !plan.isSelectable}
									>
										<input
											type="radio"
											name="plan"
											value={plan.code}
											checked={isSelected}
											onChange={() => plan.isSelectable && !disabled && handlePlanSelect(plan.code)}
											className="sr-only"
											disabled={disabled || !plan.isSelectable}
										/>

										{/* 基本情報（常に表示） */}
										<div
											className={cn(
												"p-4 bg-background",
												isSelected ? "rounded-t-lg" : "rounded-lg",
											)}
										>
											<div className="flex justify-between items-center">
												<div className="flex-1">
													<h3 className="font-semibold text-lg text-gray-900 mb-1">
														{plan.name}
														{plan.isCurrent && (
															<span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
																現在のプラン
															</span>
														)}
													</h3>
													<p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
												</div>
												<div className="ml-4 text-right flex-shrink-0">
													<div className="text-xl font-bold text-gray-900">
														¥{plan.displayPrice.toLocaleString()}
													</div>
													{isSelected && <div className="text-xs text-primary mt-1">選択中</div>}
												</div>
											</div>
										</div>

										{/* 詳細情報（選択時のみ展開） */}
										<div
											className={cn(
												"overflow-hidden transition-all duration-300 ease-in-out",
												isSelected ? "opacity-100" : "h-0 opacity-0",
											)}
										>
											<div className="border-t border-gray-200 bg-background rounded-b-lg">
												<div className="p-4 space-y-3">
													<div>
														<h4 className="font-medium text-sm text-gray-900 mb-2">プラン詳細</h4>
														<p className="text-sm text-gray-600 leading-relaxed">
															{plan.description}
														</p>
													</div>

													{plan.features && plan.features.length > 0 && (
														<div>
															<h4 className="font-medium text-sm text-gray-900 mb-2">
																含まれる機能
															</h4>
															<div className="space-y-2">
																{plan.features.map((feat) => (
																	<div
																		key={feat}
																		className="flex items-start text-sm text-gray-600"
																	>
																		<div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2 flex-shrink-0" />
																		<span className="leading-relaxed">{feat}</span>
																	</div>
																))}
															</div>
														</div>
													)}

													{plan.code === "premium_full_support" && (
														<div className="space-y-3">
															<div className="bg-blue-50 p-3 rounded-lg">
																<p className="text-xs text-blue-700">
																	💡 予想件数に応じて料金が計算されます
																</p>
															</div>
															<div>
																<FormLabel required>予想件数</FormLabel>
																<ExpectedCountInput
																	id="expectedCount"
																	label=""
																	value={expectedCount}
																	onChange={handleCountChange}
																	step={10}
																	min={10}
																	max={1000}
																	disabled={disabled || loading}
																/>
																{validationErrors.expectedCount && (
																	<p className="text-sm text-red-600 mt-1">
																		{validationErrors.expectedCount}
																	</p>
																)}
															</div>
														</div>
													)}
												</div>
											</div>
										</div>
									</button>
								</div>

								{/* デスクトップ用カードレイアウト */}
								<Card
									className={cn(
										"hidden sm:block h-full cursor-pointer rounded-lg hover:shadow-md transition-shadow border-2",
										isSelected ? "border-primary" : "border-gray-200",
										disabled && "opacity-50 cursor-not-allowed",
										!plan.isSelectable && mode === "upgrade" && "opacity-50 cursor-not-allowed",
									)}
									onClick={() => plan.isSelectable && !disabled && handlePlanSelect(plan.code)}
								>
									<div className="relative h-full flex flex-col p-4">
										{plan.isCurrent && (
											<span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm font-semibold text-primary border-2 border-primary rounded-full">
												現在のプラン
											</span>
										)}

										<input
											type="radio"
											name="plan"
											value={plan.code}
											checked={isSelected}
											onChange={() => plan.isSelectable && !disabled && handlePlanSelect(plan.code)}
											className="sr-only"
											disabled={disabled || !plan.isSelectable}
										/>

										<CardHeader>
											<CardTitle className="text-lg md:text-xl font-semibold leading-snug text-gray-900">
												{plan.name}
											</CardTitle>
											<CardDescription className="mt-1 text-sm text-gray-600 leading-relaxed">
												{plan.description}
											</CardDescription>
											{plan.features && (
												<ul className="list-disc list-inside text-sm text-gray-600 mt-3 space-y-1">
													{plan.features.map((feat) => (
														<li key={feat}>{feat}</li>
													))}
												</ul>
											)}
										</CardHeader>

										<CardContent className="mt-auto space-y-4">
											{plan.code === "premium_full_support" && isSelected && (
												<div className="space-y-2">
													<div className="bg-blue-50 p-3 rounded-lg">
														<p className="text-xs text-blue-700">
															💡 予想件数に応じて料金が計算されます
														</p>
													</div>
													<div>
														<FormLabel required>予想件数</FormLabel>
														<ExpectedCountInput
															id="expectedCount-desktop"
															label=""
															value={expectedCount}
															onChange={handleCountChange}
															step={10}
															min={10}
															max={1000}
															disabled={disabled || loading}
														/>
														{validationErrors.expectedCount && (
															<p className="text-sm text-red-600 mt-1">
																{validationErrors.expectedCount}
															</p>
														)}
													</div>
												</div>
											)}
											<span className="inline-flex items-baseline space-x-1">
												<span className="text-lg md:text-xl font-medium text-gray-900">¥</span>
												<span className="text-2xl md:text-3xl font-extrabold text-gray-900">
													{plan.displayPrice.toLocaleString()}
												</span>
											</span>
										</CardContent>
									</div>
								</Card>
							</label>
						);
					})}
				</div>
				{validationErrors.planCode && <FormMessage>{validationErrors.planCode}</FormMessage>}
			</FormItem>
		</div>
	);
}
