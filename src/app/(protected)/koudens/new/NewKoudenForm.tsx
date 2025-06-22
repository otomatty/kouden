"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";
import { purchaseKouden } from "@/app/_actions/purchaseKouden";
import { createKoudenWithPlan } from "@/app/_actions/koudens/create";
import ExpectedCountInput from "@/components/custom/expected-count-input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calcSupportFee } from "@/utils/calcSupportFee";

// Plan type from database
type Plan = Database["public"]["Tables"]["plans"]["Row"];

interface NewKoudenFormProps {
	plans: Plan[];
	userId: string;
}

export default function NewKoudenForm({ plans, userId }: NewKoudenFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedPlan, setSelectedPlan] = useState(plans[0]?.code || "");
	const [expectedCount, setExpectedCount] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (selectedPlan === "free") {
				const { koudenId, error } = await createKoudenWithPlan({
					userId,
					title,
					description,
					planCode: selectedPlan,
					expectedCount: expectedCount ? Number(expectedCount) : undefined,
				});
				if (error) throw new Error(error);
				router.push(`/koudens/${koudenId}/entries`);
			} else {
				// TODO: include title/description in purchase metadata
				const koudenId = crypto.randomUUID();
				const { url, error } = await purchaseKouden({
					koudenId,
					planCode: selectedPlan,
					expectedCount:
						selectedPlan === "premium_full_support" ? Number(expectedCount) : undefined,
					title,
					description,
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
		<form onSubmit={handleSubmit} noValidate className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="title">タイトル</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="例：〇〇家 告別式"
					required
					className="bg-background"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">説明（任意）</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="説明を入力してください"
					className="bg-background"
				/>
			</div>
			<div>
				<Label>プランを選択</Label>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
					{plans.map((plan) => {
						const isSelected = selectedPlan === plan.code;
						const displayPrice =
							plan.code === "premium_full_support"
								? calcSupportFee(Number(expectedCount) || 0, plan.price)
								: plan.price;
						return (
							<label key={plan.code} className="block">
								<Card
									className={cn(
										"h-full cursor-pointer rounded-lg hover:shadow-md transition-shadow",
										isSelected ? "border-2 border-primary" : "border border-gray-200",
									)}
								>
									<div className="relative h-full flex flex-col p-4">
										<input
											type="radio"
											name="plan"
											value={plan.code}
											checked={isSelected}
											onChange={() => setSelectedPlan(plan.code)}
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
												<span className="text-lg md:text-xl font-medium text-gray-900">¥</span>
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
			</div>
			{selectedPlan === "premium_full_support" && (
				<ExpectedCountInput
					id="expectedCount"
					label="予想件数"
					value={Number(expectedCount) || 0}
					onChange={(val) => setExpectedCount(String(val))}
					step={10}
					min={10}
					max={1000}
				/>
			)}
			<div className="flex justify-end">
				<Button type="submit" disabled={loading} className="w-full sm:w-auto">
					{loading ? "処理中..." : selectedPlan === "free" ? "作成する" : "購入に進む"}
				</Button>
			</div>
		</form>
	);
}
