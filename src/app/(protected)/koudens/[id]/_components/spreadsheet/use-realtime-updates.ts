import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SpreadsheetData } from "./types";

export function useRealtimeUpdates(
	koudenId: string,
	relationships: Array<{ id: string; name: string }>,
	setData: React.Dispatch<React.SetStateAction<SpreadsheetData[]>>,
) {
	useEffect(() => {
		const supabase = createClient();

		const koudenEntriesSubscription = supabase
			.channel("kouden_entries_changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "kouden_entries",
					filter: `kouden_id=eq.${koudenId}`,
				},
				async (payload) => {
					if (payload.eventType === "INSERT") {
						const { data: newEntry } = await supabase
							.from("kouden_entries")
							.select("*")
							.eq("id", payload.new.id)
							.single();

						if (newEntry && relationships.length > 0) {
							setData((prev) => [
								...prev,
								{
									id: newEntry.id,
									name: newEntry.name,
									organization: newEntry.organization || "",
									position: newEntry.position || "",
									relationship:
										relationships.find((r) => r.id === newEntry.relationship_id)
											?.name || "",
									amount: newEntry.amount,
									postal_code: newEntry.postal_code || "",
									address: newEntry.address,
									phone_number: newEntry.phone_number || "",
									attendance_type:
										newEntry.attendance_type === "FUNERAL"
											? "葬儀"
											: newEntry.attendance_type === "CONDOLENCE_VISIT"
												? "弔問"
												: "欠席",
									has_offering: newEntry.has_offering ? "有" : "無",
									notes: newEntry.notes || "",
								},
							]);
						}
					} else if (payload.eventType === "UPDATE") {
						const { data: updatedEntry } = await supabase
							.from("kouden_entries")
							.select("*")
							.eq("id", payload.new.id)
							.single();

						if (updatedEntry && relationships.length > 0) {
							setData((prev) =>
								prev.map((entry) =>
									entry.id === updatedEntry.id
										? {
												id: updatedEntry.id,
												name: updatedEntry.name,
												organization: updatedEntry.organization || "",
												position: updatedEntry.position || "",
												relationship:
													relationships.find(
														(r) => r.id === updatedEntry.relationship_id,
													)?.name || "",
												amount: updatedEntry.amount,
												postal_code: updatedEntry.postal_code || "",
												address: updatedEntry.address,
												phone_number: updatedEntry.phone_number || "",
												attendance_type:
													updatedEntry.attendance_type === "FUNERAL"
														? "葬儀"
														: updatedEntry.attendance_type ===
																"CONDOLENCE_VISIT"
															? "弔問"
															: "欠席",
												has_offering: updatedEntry.has_offering ? "有" : "無",
												notes: updatedEntry.notes || "",
												isSelected: entry.isSelected,
											}
										: entry,
								),
							);
						}
					} else if (payload.eventType === "DELETE") {
						setData((prev) => prev.filter((e) => e.id !== payload.old.id));
					}
				},
			);

		koudenEntriesSubscription.subscribe();

		return () => {
			supabase.channel("kouden_entries_changes").unsubscribe();
		};
	}, [koudenId, relationships, setData]);
}
