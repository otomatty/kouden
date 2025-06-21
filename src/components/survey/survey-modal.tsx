"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
	userSurveyFormSchema,
	type UserSurveyFormInput,
	type SurveyTrigger,
} from "@/schemas/user-surveys";
import { createUserSurvey, createSurveySkip } from "@/app/_actions/user-surveys";

interface SurveyModalProps {
	trigger: SurveyTrigger;
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

/**
 * ユーザーアンケートモーダルコンポーネント
 * PDF出力後または1週間後のタイミングで表示される
 */
export function SurveyModal({ trigger, isOpen, onClose, onSuccess }: SurveyModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 3;

	const form = useForm<UserSurveyFormInput>({
		resolver: zodResolver(userSurveyFormSchema),
		defaultValues: {
			overallSatisfaction: undefined,
			npsScore: undefined,
			usabilityEasierInput: false,
			usabilityBetterUi: false,
			usabilityFasterPerformance: false,
			usabilityOther: "",
			featureVoiceInput: false,
			featurePhotoAttachment: false,
			featureExcelIntegration: false,
			featurePrintLayout: false,
			featureOther: "",
			additionalFeedback: "",
		},
	});

	const watchedSatisfaction = form.watch("overallSatisfaction");
	const watchedNps = form.watch("npsScore");

	// NPS スコア配列をメモ化
	const npsScoreItems = useMemo(
		() =>
			Array.from({ length: 11 }, (_, i) => ({
				id: `nps-${i}`,
				value: i,
				label: i.toString(),
			})),
		[],
	);

	// プログレスバー配列をメモ化
	const progressSteps = useMemo(
		() =>
			Array.from({ length: totalSteps }, (_, i) => ({
				id: `step-${i}`,
				stepNumber: i + 1,
				isActive: i + 1 <= currentStep,
			})),
		[currentStep],
	);

	// 操作性改善項目をメモ化
	const usabilityItems = useMemo(
		() => [
			{
				key: "usabilityEasierInput",
				id: "usability-easier-input",
				label: "入力がもっと簡単になってほしい",
			},
			{
				key: "usabilityBetterUi",
				id: "usability-better-ui",
				label: "画面がもっと見やすくなってほしい",
			},
			{
				key: "usabilityFasterPerformance",
				id: "usability-faster-performance",
				label: "動作がもっと速くなってほしい",
			},
		],
		[],
	);

	// 機能追加項目をメモ化
	const featureItems = useMemo(
		() => [
			{ key: "featureVoiceInput", id: "feature-voice-input", label: "音声入力機能" },
			{ key: "featurePhotoAttachment", id: "feature-photo-attachment", label: "写真添付機能" },
			{ key: "featureExcelIntegration", id: "feature-excel-integration", label: "Excel連携機能" },
			{ key: "featurePrintLayout", id: "feature-print-layout", label: "印刷レイアウト選択" },
		],
		[],
	);

	const getTriggerTitle = () => {
		switch (trigger) {
			case "pdf_export":
				return "PDF出力完了！アンケートへのご協力をお願いします";
			case "one_week_usage":
				return "香典帳アプリをご利用いただき、ありがとうございます";
			default:
				return "アンケートへのご協力をお願いします";
		}
	};

	const getTriggerDescription = () => {
		switch (trigger) {
			case "pdf_export":
				return "PDF出力お疲れさまでした。今後のサービス改善のため、約1分のアンケートにご協力ください。";
			case "one_week_usage":
				return "1週間のご利用、ありがとうございます。今後のサービス改善のため、約1分のアンケートにご協力ください。";
			default:
				return "今後のサービス改善のため、約1分のアンケートにご協力ください。";
		}
	};

	const canProceedToStep2 = () => {
		return watchedSatisfaction !== undefined && watchedNps !== undefined;
	};

	const canProceedToNextStep = () => {
		switch (currentStep) {
			case 1:
				return canProceedToStep2();
			case 2:
				// ステップ2は任意項目なので常に進める
				return true;
			default:
				return false;
		}
	};

	const onSubmit = async (data: UserSurveyFormInput) => {
		// ステップ3以外では送信を阻止
		if (currentStep !== 3) {
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await createUserSurvey(data, trigger);

			if (result.success) {
				toast.success(result.message);
				onSuccess?.();
				onClose();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error("アンケート送信エラー:", error);
			toast.error("送信中にエラーが発生しました。時間を置いてお試しください。");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSkip = async () => {
		setIsSubmitting(true);
		try {
			const result = await createSurveySkip(trigger);

			if (result.success) {
				toast.success(result.message);
				onClose();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error("アンケートスキップエラー:", error);
			toast.error("スキップ中にエラーが発生しました。時間を置いてお試しください。");
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderStep1 = () => (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="overallSatisfaction"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>全体的な満足度を教えてください</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={(value) => field.onChange(Number(value))}
								value={field.value?.toString() || ""}
								className="grid grid-cols-1 gap-3"
							>
								{[
									{ value: 5, label: "非常に満足" },
									{ value: 4, label: "満足" },
									{ value: 3, label: "普通" },
									{ value: 2, label: "やや不満" },
									{ value: 1, label: "非常に不満" },
								].map((item) => (
									<div key={item.value} className="flex items-center space-x-2">
										<RadioGroupItem
											value={item.value.toString()}
											id={`satisfaction-${item.value}`}
										/>
										<label
											htmlFor={`satisfaction-${item.value}`}
											className="cursor-pointer text-sm font-medium"
										>
											{item.label}
										</label>
									</div>
								))}
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="npsScore"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>このアプリを他の人に勧める可能性はどの程度ですか？</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={(value) => field.onChange(Number(value))}
								value={field.value?.toString() || ""}
								className="space-y-3"
							>
								<div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
									{npsScoreItems.map((item) => (
										<div key={item.id} className="flex flex-col items-center space-y-1">
											<RadioGroupItem
												value={item.value.toString()}
												id={item.id}
												className="h-6 w-6"
											/>
											<label htmlFor={item.id} className="cursor-pointer text-xs font-medium">
												{item.label}
											</label>
										</div>
									))}
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>全く勧めない</span>
									<span>非常に勧めたい</span>
								</div>
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);

	const renderStep2 = () => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-3 text-sm font-medium">
					操作性について改善してほしい点があれば選択してください（複数選択可）
				</h3>
				<div className="space-y-3">
					{usabilityItems.map((item) => (
						<FormField
							key={item.key}
							control={form.control}
							name={item.key as keyof UserSurveyFormInput}
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											id={item.id}
											checked={field.value as boolean}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel htmlFor={item.id} className="text-sm font-medium cursor-pointer">
											{item.label}
										</FormLabel>
									</div>
								</FormItem>
							)}
						/>
					))}
				</div>

				<FormField
					control={form.control}
					name="usabilityOther"
					render={({ field }) => (
						<FormItem className="mt-4">
							<FormLabel optional>操作性について：その他のご意見</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="その他の操作性に関するご意見があれば..."
									maxLength={100}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div>
				<h3 className="mb-3 text-sm font-medium">
					追加してほしい機能があれば選択してください（複数選択可）
				</h3>
				<div className="space-y-3">
					{featureItems.map((item) => (
						<FormField
							key={item.key}
							control={form.control}
							name={item.key as keyof UserSurveyFormInput}
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											id={item.id}
											checked={field.value as boolean}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel htmlFor={item.id} className="text-sm font-medium cursor-pointer">
											{item.label}
										</FormLabel>
									</div>
								</FormItem>
							)}
						/>
					))}
				</div>

				<FormField
					control={form.control}
					name="featureOther"
					render={({ field }) => (
						<FormItem className="mt-4">
							<FormLabel optional>機能について：その他のご要望</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="その他の機能に関するご要望があれば..."
									maxLength={100}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);

	const renderStep3 = () => (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="additionalFeedback"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>その他のご意見・ご要望</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								placeholder="その他のご意見・ご要望があれば自由にお書きください..."
								className="min-h-[120px] resize-none"
								maxLength={500}
								onKeyDown={(e) => {
									// Ctrl+Enter または Cmd+Enter でのみ送信を許可
									if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
										e.preventDefault();
									}
								}}
							/>
						</FormControl>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>任意項目です</span>
							<span>{field.value?.length || 0}/500文字</span>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="rounded-lg bg-muted/50 p-4">
				<div className="flex items-center space-x-2 text-sm">
					<CheckCircle className="h-4 w-4 text-green-600" />
					<span className="font-medium">回答内容の確認</span>
				</div>
				<div className="mt-2 space-y-1 text-xs text-muted-foreground">
					<div>
						満足度:{" "}
						{watchedSatisfaction
							? ["", "非常に不満", "やや不満", "普通", "満足", "非常に満足"][watchedSatisfaction]
							: "未選択"}
					</div>
					<div>推奨度: {watchedNps !== undefined ? `${watchedNps}点` : "未選択"}</div>
				</div>
			</div>
		</div>
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="space-y-3">
					<DialogTitle className="text-lg">{getTriggerTitle()}</DialogTitle>
					<DialogDescription className="text-sm">{getTriggerDescription()}</DialogDescription>

					{/* プログレスバー */}
					<div className="flex items-center space-x-2">
						<div className="flex flex-1 space-x-1">
							{progressSteps.map((step) => (
								<div
									key={step.id}
									className={`h-2 flex-1 rounded-full ${step.isActive ? "bg-primary" : "bg-muted"}`}
								/>
							))}
						</div>
						<Badge variant="outline" className="text-xs">
							{currentStep}/{totalSteps}
						</Badge>
					</div>

					<div className="flex items-center space-x-2 text-xs text-muted-foreground">
						<Clock className="h-3 w-3" />
						<span>約1分で完了</span>
					</div>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (currentStep === 3) {
								form.handleSubmit(onSubmit)(e);
							}
						}}
						className="space-y-6"
					>
						{currentStep === 1 && renderStep1()}
						{currentStep === 2 && renderStep2()}
						{currentStep === 3 && renderStep3()}

						<div className="flex justify-between space-x-2">
							{currentStep > 1 ? (
								<Button
									type="button"
									variant="outline"
									onClick={() => setCurrentStep(currentStep - 1)}
									disabled={isSubmitting}
								>
									前へ
								</Button>
							) : (
								<Button type="button" variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											スキップ中...
										</>
									) : (
										"スキップ"
									)}
								</Button>
							)}

							{currentStep < totalSteps ? (
								<Button
									type="button"
									onClick={() => {
										setCurrentStep(currentStep + 1);
									}}
									disabled={!canProceedToNextStep()}
								>
									次へ
								</Button>
							) : (
								<Button
									type="button"
									disabled={isSubmitting}
									onClick={() => {
										form.handleSubmit(onSubmit)();
									}}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											送信中...
										</>
									) : (
										"送信"
									)}
								</Button>
							)}
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
