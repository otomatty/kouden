"use client";

import React from "react";
import ResponseItem from "./response-item";
import type { Database } from "@/types/supabase";

type ContactResponse = Database["public"]["Tables"]["contact_responses"]["Row"];

interface ResponseListProps {
	responses: ContactResponse[];
}

export default function ResponseList({ responses }: ResponseListProps) {
	if (responses.length === 0) {
		return <p>まだ返信はありません。</p>;
	}
	return (
		<ul className="space-y-4">
			{responses.map((resp) => (
				<li key={resp.id}>
					<ResponseItem response={resp} />
				</li>
			))}
		</ul>
	);
}
