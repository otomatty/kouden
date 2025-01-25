import { useEffect } from "react";
import { useAtom } from "jotai";
import { telegramsActionsAtom } from "@/atoms/telegrams";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { toCamelCase } from "@/atoms/telegrams";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TelegramRow = Database["public"]["Tables"]["telegrams"]["Row"];
type TelegramPayload = RealtimePostgresChangesPayload<TelegramRow>;

export function useTelegramSync(koudenId: string) {
	const [, dispatch] = useAtom(telegramsActionsAtom);
	const supabase = createClient();

	useEffect(() => {
		console.log("Setting up realtime subscription for koudenId:", koudenId);

		const channel = supabase
			.channel(`telegrams:${koudenId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "telegrams",
					filter: `kouden_id=eq.${koudenId}`,
				},
				(payload: TelegramPayload) => {
					console.log("Realtime event received:", payload);

					switch (payload.eventType) {
						case "INSERT":
							if (payload.new) {
								dispatch({
									type: "add",
									payload: toCamelCase(payload.new),
								});
							}
							break;
						case "UPDATE":
							if (payload.new) {
								dispatch({
									type: "update",
									payload: toCamelCase(payload.new),
								});
							}
							break;
						case "DELETE":
							if (payload.old?.id) {
								dispatch({
									type: "delete",
									payload: payload.old.id,
								});
							}
							break;
					}
				},
			)
			.subscribe((status) => {
				console.log("Subscription status:", status);
			});

		return () => {
			console.log("Cleaning up realtime subscription");
			supabase.removeChannel(channel);
		};
	}, [koudenId, dispatch, supabase]);
}
