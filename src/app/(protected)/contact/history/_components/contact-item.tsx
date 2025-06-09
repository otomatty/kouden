import React from "react";
import Link from "next/link";
import type { Database } from "@/types/supabase";

type ContactRequest = Database["public"]["Tables"]["contact_requests"]["Row"];

interface ContactItemProps {
	request: ContactRequest;
}

export default function ContactItem({ request }: ContactItemProps) {
	return (
		<Link href={`/contact/${request.id}`} className="block p-4 border rounded hover:bg-gray-50">
			<div className="flex justify-between">
				<span>{request.subject || request.category}</span>
				<span className="text-sm text-gray-500">
					{new Date(request.created_at).toLocaleString()}
				</span>
			</div>
		</Link>
	);
}
