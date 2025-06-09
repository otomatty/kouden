"use client";

import React from "react";
import type { Database } from "@/types/supabase";

type ContactResponse = Database["public"]["Tables"]["contact_responses"]["Row"];

type ContactRequestDetail = Database["public"]["Tables"]["contact_requests"]["Row"] & {
	contact_responses: ContactResponse[];
};

interface ContactDetailProps {
	request: ContactRequestDetail;
}

export default function ContactDetail({ request }: ContactDetailProps) {
	return (
		<div className="border p-4 rounded">
			<p className="mb-2">
				<strong>カテゴリ:</strong> {request.category}
			</p>
			<p className="mb-2">
				<strong>件名:</strong> {request.subject || "-"}
			</p>
			<p className="mb-2">
				<strong>内容:</strong>
			</p>
			<p className="whitespace-pre-wrap">{request.message}</p>
			<p className="mt-4 text-sm text-gray-500">
				送信日時: {new Date(request.created_at).toLocaleString()}
			</p>
		</div>
	);
}
