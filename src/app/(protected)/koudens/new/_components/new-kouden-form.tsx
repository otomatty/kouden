"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";
import { purchaseKouden } from "@/app/_actions/purchaseKouden";
import { createKoudenWithPlan } from "@/app/_actions/koudens/create";
import ExpectedCountInput from "@/components/custom/expected-count-input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calcSupportFee } from "@/utils/calcSupportFee";
import { newKoudenFormSchema, type NewKoudenFormValues } from "@/schemas/koudens";

// Plan type from database
type Plan = Database["public"]["Tables"]["plans"]["Row"];

interface NewKoudenFormProps {
	plans: Plan[];
	userId: string;
}

export default function NewKoudenForm({ plans, userId }: NewKoudenFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const form = useForm<NewKoudenFormValues>({
		resolver: zodResolver(newKoudenFormSchema),
		defaultValues: {
			title: "",
			description: "",
			planCode: plans[0]?.code || "",
			expectedCount: undefined,
		},
	});

	const selectedPlan = form.watch("planCode");
	const expectedCount = form.watch("expectedCount");

	const handleSubmit = async (data: NewKoudenFormValues) => {
		setLoading(true);
		try {
			if (data.planCode === "free") {
				const { koudenId, error } = await createKoudenWithPlan({
					userId,
					title: data.title,
					description: data.description || undefined,
					planCode: data.planCode,
					expectedCount: data.expectedCount,
				});
				if (error) throw new Error(error);
				router.push(`/koudens/${koudenId}/entries`);
			} else {
				// TODO: include title/description in purchase metadata
				const koudenId = crypto.randomUUID();
				const { url, error } = await purchaseKouden({
					koudenId,
					planCode: data.planCode,
					expectedCount: data.planCode === "premium_full_support" ? data.expectedCount : undefined,
					title: data.title,
					description: data.description || undefined,
					cancelPath: "/koudens/new",
				});
				if (error) throw new Error(error);
				if (url) {
					window.location.href = url;
				} else {
					throw new Error("購入URLが取得できませんでした");
				}
			}
		} catch (err) {
			console.error("[ERROR] 作成エラー:", err);
			// TODO: user feedback
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col min-h-[calc(100vh-200px)]">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="flex-1 space-y-6">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>タイトル</FormLabel>
								<FormControl>
									<Input {...field} placeholder="例：〇〇家 告別式" className="bg-background" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel optional>説明</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="説明を入力してください"
										className="bg-background"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="planCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>プランを選択</FormLabel>
								<div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 mt-2">
									{plans.map((plan) => {
										const isSelected = field.value === plan.code;
										const displayPrice =
											plan.code === "premium_full_support"
												? calcSupportFee(expectedCount || 0, plan.price)
												: plan.price;
										return (
											<label key={plan.code} className="block">
												{/* モバイル用アコーディオンレイアウト */}
												<div className="sm:hidden">
													<button
														type="button"
														className={cn(
															"rounded-lg border-2 cursor-pointer transition-all duration-200 w-full flex flex-col text-left",
															isSelected
																? "border-primary bg-primary/5"
																: "border-gray-200 hover:border-gray-300",
														)}
														onClick={() => field.onChange(plan.code)}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																field.onChange(plan.code);
															}
														}}
														aria-pressed={isSelected}
													>
														<input
															type="radio"
															name="plan"
															value={plan.code}
															checked={isSelected}
															onChange={() => field.onChange(plan.code)}
															className="sr-only"
														/>

														{/* 基本情報（常に表示） */}
														<div className="p-4">
															<div className="flex justify-between items-center">
																<div className="flex-1">
																	<h3 className="font-semibold text-lg text-gray-900 mb-1">
																		{plan.name}
																	</h3>
																	<p className="text-sm text-gray-600 line-clamp-2">
																		{plan.description}
																	</p>
																</div>
																<div className="ml-4 text-right flex-shrink-0">
																	<div className="text-xl font-bold text-gray-900">
																		¥{displayPrice.toLocaleString()}
																	</div>
																	{isSelected && (
																		<div className="text-xs text-primary mt-1">選択中</div>
																	)}
																</div>
															</div>
														</div>

														{/* 詳細情報（選択時のみ展開） */}
														{isSelected && (
															<div className="border-t border-gray-200 bg-gray-50/50">
																<div className="p-4 space-y-3">
																	<div>
																		<h4 className="font-medium text-sm text-gray-900 mb-2">
																			プラン詳細
																		</h4>
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
																		<div className="bg-blue-50 p-3 rounded-lg">
																			<p className="text-xs text-blue-700">
																				💡 予想件数に応じて料金が計算されます
																			</p>
																		</div>
																	)}
																</div>
															</div>
														)}
													</button>
												</div>

												{/* デスクトップ用カードレイアウト */}
												<Card
													className="hidden sm:block h-full cursor-pointer rounded-lg hover:shadow-md transition-shadow border-2 border-gray-200 data-[selected=true]:border-primary"
													data-selected={isSelected}
													onClick={() => field.onChange(plan.code)}
												>
													<div className="relative h-full flex flex-col p-4">
														<input
															type="radio"
															name="plan"
															value={plan.code}
															checked={isSelected}
															onChange={() => field.onChange(plan.code)}
															className="sr-only"
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
														<CardContent className="mt-auto">
															<span className="inline-flex items-baseline space-x-1">
																<span className="text-lg md:text-xl font-medium text-gray-900">
																	¥
																</span>
																<span className="text-2xl md:text-3xl font-extrabold text-gray-900">
																	{displayPrice.toLocaleString()}
																</span>
															</span>
														</CardContent>
													</div>
												</Card>
											</label>
										);
									})}
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					{selectedPlan === "premium_full_support" && (
						<FormField
							control={form.control}
							name="expectedCount"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>予想件数</FormLabel>
									<FormControl>
										<ExpectedCountInput
											id="expectedCount"
											label=""
											value={field.value || 0}
											onChange={(val) => field.onChange(val)}
											step={10}
											min={10}
											max={1000}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* デスクトップ用ボタン */}
					<div className="hidden sm:flex justify-end">
						<Button type="submit" disabled={loading} className="w-full sm:w-auto">
							{loading ? "処理中..." : selectedPlan === "free" ? "作成する" : "購入に進む"}
						</Button>
					</div>
				</form>

				{/* モバイル用スティッキーボタン */}
				<div className="sticky bottom-0 mt-6 p-4 sm:hidden -mx-4">
					<Button
						type="submit"
						disabled={loading}
						className="w-full"
						onClick={form.handleSubmit(handleSubmit)}
					>
						{loading ? "処理中..." : selectedPlan === "free" ? "作成する" : "購入に進む"}
					</Button>
				</div>
			</Form>
		</div>
	);
}
