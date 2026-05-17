"use client";
import { reserveSlot } from "@/app/_actions/calendar";
import type { DayAvailability, Slot } from "@/app/_actions/calendar";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
	availability: DayAvailability[];
}

/**
 * `<form action>` から `reserveSlot` (Server Action) を呼び出すクライアント側ラッパー。
 *
 * `<form action>` の戻り値型は `Promise<void>` 固定で `ActionResult` を直接返せないため、
 * 失敗時は throw して React のフォーム送信ハンドラ → error boundary に伝播させる
 * (これを怠ると Google Calendar 連携失敗時に「予約成功」と誤認される)。
 *
 * @param formData 予約フォームの送信データ。`summary` / `email` / `startDateTime` /
 *   `endDateTime` を必須、`notes` を任意で含む。
 * @throws {Error} `reserveSlot` が `ok: false` を返したとき (バリデーション失敗・
 *   Google Calendar API 障害・既存予約との重複など)。
 */
async function reserveSlotAction(formData: FormData): Promise<void> {
	const result = await reserveSlot(formData);
	if (!result.ok) {
		throw new Error(result.error.message);
	}
}

export function CalendarGrid({ availability }: CalendarGridProps) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-7 gap-4">
				{availability.map((day) => {
					const dateObj = new Date(day.date);
					const weekday = dateObj.getDay();
					const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
					return (
						<div key={day.date} className="flex flex-col items-center gap-2">
							<div
								className={cn(
									"w-full text-center font-semibold bg-gray-50 border-b border-border py-1",
									weekday === 0 ? "text-red-500" : weekday === 6 ? "text-blue-500" : "",
								)}
							>
								{`${day.date} (${dayNames[weekday]})`}
							</div>
							{day.slots
								.filter((slot) => {
									const hour = new Date(slot.start).getHours();
									return hour >= 10 && hour < 18;
								})
								.map((slot) => {
									const startH = String(new Date(slot.start).getHours()).padStart(2, "0");
									const endH = String(new Date(slot.end).getHours()).padStart(2, "0");
									return (
										<ResponsiveDialog
											key={slot.start}
											trigger={
												<button
													type="button"
													disabled={!slot.available}
													className={`w-full p-2 rounded border border-border ${
														slot.available
															? "bg-background hover:shadow-sm hover:bg-background/80"
															: "bg-gray-200 cursor-not-allowed"
													}`}
												>
													{`${startH}:00~${endH}:00`}
												</button>
											}
											title="オンラインデモ予約"
											description={`${startH}:00~${endH}:00 の予約`}
										>
											{({ close }) => (
												<form action={reserveSlotAction} className="grid gap-2">
													<input type="hidden" name="startDateTime" value={slot.start} />
													<input type="hidden" name="endDateTime" value={slot.end} />
													<Input type="text" name="summary" placeholder="お名前" required />
													<Input type="email" name="email" placeholder="メールアドレス" required />
													<textarea
														name="notes"
														placeholder="備考 (任意)"
														className="w-full p-2 border rounded"
													/>
													<div className="flex justify-end gap-2">
														<Button type="submit">予約する</Button>
														<Button variant="outline" type="button" onClick={close}>
															キャンセル
														</Button>
													</div>
												</form>
											)}
										</ResponsiveDialog>
									);
								})}
						</div>
					);
				})}
			</div>
		</div>
	);
}
