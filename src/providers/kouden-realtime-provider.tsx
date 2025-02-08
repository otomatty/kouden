"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface KoudenRealtimeContextType {
	isEditing: { [key: string]: string }; // entryId: userId
	acquireLock: (entryId: string) => Promise<boolean>;
	releaseLock: (entryId: string) => Promise<void>;
}

const KoudenRealtimeContext = createContext<KoudenRealtimeContextType | null>(null);

export function useKoudenRealtime() {
	const context = useContext(KoudenRealtimeContext);
	if (!context) {
		throw new Error("useKoudenRealtime must be used within a KoudenRealtimeProvider");
	}
	return context;
}

interface KoudenRealtimeProviderProps {
	koudenId: string;
	children: React.ReactNode;
}

export function KoudenRealtimeProvider({ koudenId, children }: KoudenRealtimeProviderProps) {
	const [isEditing, setIsEditing] = useState<{ [key: string]: string }>({});
	const [, setChannel] = useState<RealtimeChannel | null>(null);
	const supabase = createClient();

	useEffect(() => {
		const newChannel = supabase
			.channel(`kouden:${koudenId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "kouden_entry_locks",
					filter: `entry_id=eq.${koudenId}`,
				},
				(payload) => {
					if (payload.eventType === "INSERT") {
						setIsEditing((prev) => ({
							...prev,
							[payload.new.entry_id]: payload.new.user_id,
						}));
					} else if (payload.eventType === "DELETE") {
						setIsEditing((prev) => {
							const next = { ...prev };
							delete next[payload.old.entry_id];
							return next;
						});
					}
				},
			)
			.subscribe();

		setChannel(newChannel);

		return () => {
			supabase.removeChannel(newChannel);
		};
	}, [koudenId, supabase]);

	const acquireLock = async (entryId: string) => {
		const { data: user } = await supabase.auth.getUser();
		if (!user.user) return false;

		const { error } = await supabase.from("kouden_entry_locks").insert({
			entry_id: entryId,
			user_id: user.user.id,
			locked_at: new Date().toISOString(),
			expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分後
		});

		return !error;
	};

	const releaseLock = async (entryId: string) => {
		const { data: user } = await supabase.auth.getUser();
		if (!user.user) return;

		await supabase
			.from("kouden_entry_locks")
			.delete()
			.match({ entry_id: entryId, user_id: user.user.id });
	};

	return (
		<KoudenRealtimeContext.Provider
			value={{
				isEditing,
				acquireLock,
				releaseLock,
			}}
		>
			{children}
		</KoudenRealtimeContext.Provider>
	);
}
