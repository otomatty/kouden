"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Calendar, User, Mail, Phone, MessageSquare, CheckCircle, VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DayAvailability } from "@/app/_actions/calendar";

/**
 * ヒアリング申し込みフォームのバリデーションスキーマ
 */
const hearingFormSchema = z.object({
	name: z.string().min(1, "お名前を入力してください"),
	email: z
		.string()
		.min(1, "メールアドレスを入力してください")
		.email("有効なメールアドレスを入力してください"),
	phone: z.string().optional(),
	selectedSlot: z
		.object({
			start: z.string(),
			end: z.string(),
		})
		.optional()
		.refine((slot) => slot !== undefined, "ヒアリング日時を選択してください"),
	currentUsage: z.string().min(1, "利用状況を選択してください"),
	videoTool: z.string().min(1, "ビデオツールを選択してください"),
	feedback: z.string().optional(),
	agreedToTerms: z.boolean().refine((value) => value === true, "利用規約への同意が必要です"),
});

type HearingFormData = z.infer<typeof hearingFormSchema>;

export function HearingApplicationForm() {
	const router = useRouter();
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [initialAvailability, setInitialAvailability] = useState<DayAvailability[]>([]);
	const [initialWeekStart, setInitialWeekStart] = useState("");

	const form = useForm({
		resolver: zodResolver(hearingFormSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			selectedSlot: undefined,
			currentUsage: "",
			videoTool: "",
			feedback: "",
			agreedToTerms: false,
		},
	});

	// 認証ユーザーの情報を取得してメールアドレスを自動入力
	useEffect(() => {
		const loadUserInfo = async () => {
			try {
				const supabase = createClient();
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (user) {
					form.setValue("name", user.user_metadata?.full_name || user.email?.split("@")[0] || "");
					form.setValue("email", user.email || "");
				}
			} catch (error) {
				console.warn("ユーザー情報の取得に失敗しました:", error);
			}
		};

		loadUserInfo();
	}, [form]);

	// カレンダー表示用の初期データを取得
	useEffect(() => {
		const loadInitialCalendar = async () => {
			try {
				const today = new Date();
				const weekStartDate = new Date(today);
				weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
				const weekStart = weekStartDate.toISOString();

				const response = await fetch(
					`/api/availability?weekStart=${encodeURIComponent(weekStart)}`,
				);
				if (response.ok) {
					const availability: DayAvailability[] = await response.json();
					setInitialAvailability(availability);
					setInitialWeekStart(weekStart);
				}
			} catch (error) {
				console.warn("カレンダー情報の取得に失敗しました:", error);
			}
		};

		loadInitialCalendar();
	}, []);

	const handleSlotSelect = (start: string, end: string) => {
		form.setValue("selectedSlot", { start, end });
	};

	const formatSlotTime = (slot: { start: string; end: string }) => {
		const startDate = new Date(slot.start);
		const endDate = new Date(slot.end);
		return `${startDate.getMonth() + 1}/${startDate.getDate()} ${startDate.getHours()}:00-${endDate.getHours()}:00`;
	};

	const onSubmit = async (data: HearingFormData) => {
		try {
			// FormDataを作成
			const formData = new FormData();
			formData.append("name", data.name);
			formData.append("email", data.email);
			if (data.phone) formData.append("phone", data.phone);
			formData.append("currentUsage", data.currentUsage);
			formData.append("videoTool", data.videoTool);
			if (data.feedback) formData.append("feedback", data.feedback);
			if (data.selectedSlot) {
				formData.append("selectedSlot", JSON.stringify(data.selectedSlot));
			}
			formData.append("userAgent", navigator.userAgent);

			// Server Actionを呼び出し
			const { submitHearingApplication } = await import("@/app/_actions/hearing-applications");
			const result = await submitHearingApplication(formData);

			if (result.success) {
				setIsSubmitted(true);
			} else {
				// エラーハンドリング
				throw new Error(result.error || "申し込み処理に失敗しました");
			}
		} catch (error) {
			console.error("申し込み処理でエラーが発生しました:", error);
			// TODO: エラー表示UIを実装
			alert(error instanceof Error ? error.message : "申し込み処理に失敗しました");
		}
	};

	if (isSubmitted) {
		return (
			<Card className="text-center p-8 bg-green-50">
				<CardContent className="space-y-4">
					<CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
					<h3 className="text-2xl font-bold text-green-800">申し込み完了！</h3>
					<p className="text-green-700">
						ヒアリングのお申し込みありがとうございます。
						<br />
						Googleカレンダーに予約が登録されました。当日お待ちしております。
					</p>
					{form.watch("selectedSlot") && (
						<div className="mt-4 p-4 bg-blue-50 rounded-lg">
							<p className="text-blue-800 font-medium">
								予約日時: {(() => {
									const slot = form.watch("selectedSlot");
									return slot ? formatSlotTime(slot) : "";
								})()}
							</p>
						</div>
					)}
					<Button onClick={() => router.push("/koudens")} className="mt-4">
						香典帳アプリに戻る
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* 基本情報 */}
					<div className="grid md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required className="flex items-center gap-2">
										<User className="h-4 w-4" />
										お名前
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="山田太郎" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel required className="flex items-center gap-2">
										<Mail className="h-4 w-4" />
										メールアドレス
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="email"
											placeholder="example@email.com"
											disabled={!!field.value} // 認証済みの場合は編集不可
										/>
									</FormControl>
									{field.value && (
										<FormDescription>
											ログイン中のメールアドレスが自動入力されています
										</FormDescription>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel optional className="flex items-center gap-2">
									<Phone className="h-4 w-4" />
									電話番号
								</FormLabel>
								<FormControl>
									<Input {...field} type="tel" placeholder="090-1234-5678" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* ヒアリング希望日時選択 */}
					<FormField
						control={form.control}
						name="selectedSlot"
						render={({ field }) => (
							<FormItem>
								<FormLabel required className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									ヒアリング日時選択
								</FormLabel>

								{field.value && (
									<div className="p-4 border rounded-lg bg-green-50">
										<p className="text-green-800 font-medium">
											選択済み: {formatSlotTime(field.value)}
										</p>
										<p className="text-sm text-green-600 mt-1">
											別の日時に変更したい場合は、下のカレンダーから選択し直してください
										</p>
									</div>
								)}

								{/* 週間カレンダー表示 */}
								{initialAvailability.length > 0 && initialWeekStart && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">空き時間を選択</CardTitle>
											<p className="text-sm text-gray-600">
												土日のみ対応しております。営業時間（10:00-18:00）の空いている時間帯をクリックしてください
											</p>
										</CardHeader>
										<CardContent>
											<HearingCalendarView
												initialAvailability={initialAvailability}
												initialWeekStart={initialWeekStart}
												onSlotSelect={handleSlotSelect}
											/>
										</CardContent>
									</Card>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 現在の利用状況 */}
					<FormField
						control={form.control}
						name="currentUsage"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>現在の香典帳アプリの利用状況</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="利用状況を選択" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="new">初めて利用する</SelectItem>
										<SelectItem value="free">無料プランを利用中</SelectItem>
										<SelectItem value="basic">ベーシックプランを利用中</SelectItem>
										<SelectItem value="premium">プレミアムプランを利用中</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 希望ビデオツール */}
					<FormField
						control={form.control}
						name="videoTool"
						render={({ field }) => (
							<FormItem>
								<FormLabel required className="flex items-center gap-2">
									<VideoIcon className="h-4 w-4" />
									使用希望のビデオツール
								</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="使用したいビデオツールを選択" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="googlemeet">Google Meet</SelectItem>
										<SelectItem value="zoom">Zoom</SelectItem>
										<SelectItem value="teams">Microsoft Teams</SelectItem>
									</SelectContent>
								</Select>
								<FormDescription>
									ヒアリング実施時に選択されたツールを使用いたします
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* フィードバック */}
					<FormField
						control={form.control}
						name="feedback"
						render={({ field }) => (
							<FormItem>
								<FormLabel optional className="flex items-center gap-2">
									<MessageSquare className="h-4 w-4" />
									アプリへのご要望・ご質問
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="アプリの改善点や新機能のご要望などがあればお聞かせください"
										rows={4}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 利用規約への同意 */}
					<FormField
						control={form.control}
						name="agreedToTerms"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0">
								<FormControl>
									<Checkbox checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel required className="text-sm leading-relaxed">
										ヒアリング実施に関する利用規約およびプライバシーポリシーに同意します。
										取得した個人情報はヒアリング実施および今後のサービス改善のためのみに使用いたします。
									</FormLabel>
									<FormMessage />
								</div>
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						disabled={form.formState.isSubmitting || !form.formState.isValid}
						className="w-full"
						size="lg"
					>
						{form.formState.isSubmitting ? "予約登録中..." : "ヒアリングを予約する"}
					</Button>
				</form>
			</Form>
		</div>
	);
}

// ヒアリング専用のカレンダービューコンポーネント
interface HearingCalendarViewProps {
	initialAvailability: DayAvailability[];
	initialWeekStart: string;
	onSlotSelect: (start: string, end: string) => void;
}

function HearingCalendarView({
	initialAvailability,
	initialWeekStart,
	onSlotSelect,
}: HearingCalendarViewProps) {
	const [weekStart, setWeekStart] = useState<string>(initialWeekStart);
	const [availability, setAvailability] = useState<DayAvailability[]>(initialAvailability);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		(async () => {
			if (weekStart === initialWeekStart) {
				setAvailability(initialAvailability);
				return;
			}
			setIsLoading(true);
			const res = await fetch(`/api/availability?weekStart=${encodeURIComponent(weekStart)}`);
			if (res.ok) {
				const data: DayAvailability[] = await res.json();
				setAvailability(data);
			}
			setIsLoading(false);
		})();
	}, [weekStart, initialWeekStart, initialAvailability]);

	const shiftWeek = (days: number) => {
		const date = new Date(weekStart);
		date.setDate(date.getDate() + days);
		setWeekStart(date.toISOString());
	};

	const rangeLabel = (() => {
		const start = new Date(weekStart);
		const end = new Date(start);
		end.setDate(end.getDate() + 6);
		return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
	})();

	return (
		<div>
			<div className="flex items-center justify-center gap-4 mb-4">
				<Button variant="outline" type="button" onClick={() => shiftWeek(-7)}>
					← 前週
				</Button>
				<span className="font-medium">{rangeLabel}</span>
				<Button variant="outline" type="button" onClick={() => shiftWeek(7)}>
					次週 →
				</Button>
			</div>
			{isLoading ? (
				<div className="grid grid-cols-7 gap-2">
					{Array.from({ length: 7 }).map((_, dayIdx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<div key={dayIdx} className="flex flex-col gap-1">
							<div className="h-8 bg-gray-200 rounded animate-pulse" />
							{Array.from({ length: 8 }).map((_, slotIdx) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								<div key={slotIdx} className="h-8 bg-gray-100 rounded animate-pulse" />
							))}
						</div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-7 gap-2">
					{availability.map((day) => {
						const dateObj = new Date(day.date);
						const weekday = dateObj.getDay();
						const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

						// 土日のみ対応（0: 日曜日, 6: 土曜日）
						const isWeekend = weekday === 0 || weekday === 6;
						const isSunday = weekday === 0;

						return (
							<div key={day.date} className="flex flex-col gap-1">
								<div
									className={`text-center font-medium text-sm p-2 rounded ${
										isWeekend
											? isSunday
												? "bg-red-50 text-red-800"
												: "bg-blue-50 text-blue-800"
											: "bg-gray-100 text-gray-500"
									}`}
								>
									{day.date.split("-")[2]} ({dayNames[weekday]})
								</div>
								{!isWeekend ? (
									<div className="text-xs text-center text-gray-400 py-2">
										平日は対応
										<br />
										しておりません
									</div>
								) : (
									day.slots
										.filter((slot) => {
											const hour = new Date(slot.start).getHours();
											return hour >= 10 && hour < 18;
										})
										.map((slot) => {
											const startH = new Date(slot.start).getHours();
											return (
												<Button
													key={slot.start}
													type="button"
													variant={slot.available ? "outline" : "secondary"}
													size="sm"
													disabled={!slot.available}
													onClick={() => slot.available && onSlotSelect(slot.start, slot.end)}
													className={`w-full text-xs h-8 ${
														slot.available
															? "hover:bg-blue-50 hover:border-blue-300"
															: "opacity-50 cursor-not-allowed"
													}`}
												>
													{startH}:00
												</Button>
											);
										})
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
