"use client";
import { reserveSlot } from "@/app/_actions/calendar";
import type { DayAvailability, Slot } from "@/app/_actions/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";

interface CalendarGridProps {
	availability: DayAvailability[];
}

export default function CalendarGrid({ availability }: CalendarGridProps) {
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
												<form action={reserveSlot} className="grid gap-2">
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
