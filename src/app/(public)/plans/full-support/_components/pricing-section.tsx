"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Info } from "lucide-react";

// これらの定数はコンポーネントの外に出すか、useMemoでメモ化することも検討できますが、
// 今回はuseCallbackの依存配列から除外するだけでLinterエラーは解消されます。
const PREMIUM_PLAN_PRICE = 7980;
const BASE_SUPPORT_MIN = 7020;
const BASE_SUPPORT_MAX = 17020;
const ADDITIONAL_BLOCK_PRICE_MIN = 3000;
const ADDITIONAL_BLOCK_PRICE_MAX = 5000;
const MIN_SLIDER_VALUE = 0;
const MAX_SLIDER_VALUE = 500;

export default function PricingSection() {
	const [kodenCount, setKodenCount] = useState<number | "">(50);
	const [estimatedPrice, setEstimatedPrice] = useState<string>("");
	const [priceDetails, setPriceDetails] = useState<React.ReactNode>(null);

	const sliderRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const calculatePrice = useCallback(
		(countValue: number | "") => {
			if (countValue === "") {
				setEstimatedPrice("");
				setPriceDetails(null);
				return;
			}
			const count = Number(countValue);
			if (Number.isNaN(count) || count < 0) {
				setEstimatedPrice("有効な件数を入力してください。");
				setPriceDetails(null);
				return;
			}

			if (count <= 100) {
				const totalMin = PREMIUM_PLAN_PRICE + BASE_SUPPORT_MIN;
				const totalMax = PREMIUM_PLAN_PRICE + BASE_SUPPORT_MAX;
				setEstimatedPrice(
					`合計目安: ${totalMin.toLocaleString()}円 〜 ${totalMax.toLocaleString()}円`,
				);
				setPriceDetails(
					<p className="text-sm text-muted-foreground">
						ご入力の件数ですと、基本料金の範囲内となります。
						<br />
						(プレミアムプラン {PREMIUM_PLAN_PRICE.toLocaleString()}円込み)
					</p>,
				);
			} else {
				const additionalCount = count - 100;
				const additionalBlocks = Math.ceil(additionalCount / 50);
				const additionalSupportMin = additionalBlocks * ADDITIONAL_BLOCK_PRICE_MIN;
				const additionalSupportMax = additionalBlocks * ADDITIONAL_BLOCK_PRICE_MAX;

				const totalMin = PREMIUM_PLAN_PRICE + BASE_SUPPORT_MIN + additionalSupportMin;
				const totalMax = PREMIUM_PLAN_PRICE + BASE_SUPPORT_MAX + additionalSupportMax;

				setEstimatedPrice(
					`合計目安: ${totalMin.toLocaleString()}円 〜 ${totalMax.toLocaleString()}円`,
				);
				setPriceDetails(
					<div className="text-sm space-y-1">
						<p>プレミアムプラン料金: {PREMIUM_PLAN_PRICE.toLocaleString()}円</p>
						<p>
							基本サポート料金 (100件分): {BASE_SUPPORT_MIN.toLocaleString()}円 〜{" "}
							{BASE_SUPPORT_MAX.toLocaleString()}円
						</p>
						<p>
							追加サポート料金 ({additionalCount}件、{additionalBlocks}ブロック分):
							{additionalSupportMin.toLocaleString()}円 〜 {additionalSupportMax.toLocaleString()}円
						</p>
					</div>,
				);
			}
		},
		[], // 状態更新関数は依存配列から削除
	);

	useEffect(() => {
		calculatePrice(kodenCount);
	}, [kodenCount, calculatePrice]);

	const handleSliderChange = useCallback(
		(clientX: number) => {
			if (!sliderRef.current) return;
			const rect = sliderRef.current.getBoundingClientRect();
			let newValue = Math.round(((clientX - rect.left) / rect.width) * MAX_SLIDER_VALUE);
			newValue = Math.max(MIN_SLIDER_VALUE, Math.min(MAX_SLIDER_VALUE, newValue));
			setKodenCount(newValue);
		},
		[], // 状態更新関数は依存配列から削除
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsDragging(true);
			handleSliderChange(e.clientX);
		},
		[handleSliderChange], // setIsDragging はReactが同一性を保証
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;
			handleSliderChange(e.clientX);
		},
		[isDragging, handleSliderChange],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []); // setIsDragging はReactが同一性を保証

	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		} else {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		}
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, handleMouseMove, handleMouseUp]);

	const sliderPercentage = kodenCount === "" ? 0 : (Number(kodenCount) / MAX_SLIDER_VALUE) * 100;

	return (
		<section className="mb-12 md:mb-16">
			<h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">料金体系</h2>
			<div className="grid md:grid-cols-2 gap-8 mb-10">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<DollarSign className="h-6 w-6 text-primary mr-2" />
							基本料金 (100件まで)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold mb-2">15,000円〜25,000円</p>
						<p className="text-sm text-muted-foreground">
							(プレミアムプラン料金 {PREMIUM_PLAN_PRICE.toLocaleString()}円込み)
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							サポート時間目安: 約1.5時間～2.5時間
						</p>
					</CardContent>
					<CardFooter>
						<p className="text-xs text-muted-foreground">
							※サポート内容や件数に応じて変動する場合があります。
						</p>
					</CardFooter>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<DollarSign className="h-6 w-6 text-primary mr-2" />
							追加料金 (101件目以降)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold mb-2">3,000円〜5,000円</p>
						<p className="text-sm text-muted-foreground">/ 50件ごと</p>
					</CardContent>
					<CardFooter>
						<p className="text-xs text-muted-foreground">
							※追加件数に応じたサポート時間を見込みます。
						</p>
					</CardFooter>
				</Card>
			</div>

			<Card className="max-w-2xl mx-auto shadow-lg">
				<CardHeader>
					<CardTitle className="text-xl md:text-2xl text-center">
						かんたん料金シミュレーション
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<label htmlFor="kodenCountInput" className="block text-sm font-medium mb-1">
							おおよその香典件数を入力してください
						</label>
						<Input
							id="kodenCountInput"
							type="number"
							placeholder="例: 120"
							value={kodenCount}
							onChange={(e) => {
								const val = e.target.value;
								setKodenCount(
									val === ""
										? ""
										: Math.max(
												MIN_SLIDER_VALUE,
												Math.min(MAX_SLIDER_VALUE, Number.parseInt(val, 10)),
											),
								);
							}}
							className="text-base w-full mb-3"
						/>
						<div className="block text-sm font-medium mb-1.5">
							またはスライダーで調整 (現在: {kodenCount === "" ? 0 : kodenCount}件)
						</div>
						<div
							ref={sliderRef}
							onMouseDown={handleMouseDown}
							className="relative w-full h-6 bg-muted rounded-full cursor-pointer group"
						>
							<div
								className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100 ease-out"
								style={{ width: `${sliderPercentage}%` }}
							/>
							<div
								className="absolute top-1/2 -translate-y-1/2 h-5 w-5 bg-primary rounded-full shadow-md border-2 border-background group-hover:scale-110 transition-transform duration-100 ease-out"
								style={{ left: `calc(${sliderPercentage}% - 10px)` }}
							/>
						</div>
					</div>

					{estimatedPrice && (
						<div className="p-4 bg-muted rounded-md space-y-2 mt-6">
							<p className="text-lg font-semibold text-center">{estimatedPrice}</p>
							{priceDetails && <div className="border-t pt-2 mt-2">{priceDetails}</div>}
						</div>
					)}
				</CardContent>
				<CardFooter className="flex items-start text-xs text-muted-foreground pt-4">
					<Info className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" />
					<p>
						これはあくまで目安の金額です。正確な料金は、お客様の状況やサポート内容の詳細によって変動する場合がありますので、まずはお気軽にお問い合わせください。
					</p>
				</CardFooter>
			</Card>

			<p className="text-center mt-10 text-muted-foreground">
				詳細なお見積もりやご相談は、お気軽にお問い合わせください。
				(この文言はCTAセクションにありますので、最終的に重複を避けるよう調整してください)
			</p>
		</section>
	);
}
