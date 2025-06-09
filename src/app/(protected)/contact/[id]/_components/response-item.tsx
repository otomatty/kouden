"use client";

import React from "react";
import type { Database } from "@/types/supabase";

type ContactResponse = Database["public"]["Tables"]["contact_responses"]["Row"];

interface ResponseItemProps {
	response: ContactResponse;
}

export default function ResponseItem({ response }: ResponseItemProps) {
	return (
		<div className="border p-4 rounded bg-gray-50">
			<p className="mb-2">{response.response_message}</p>
			<p className="text-sm text-gray-500">
				返信日時: {new Date(response.created_at).toLocaleString()}
			</p>
		</div>
	);
}
