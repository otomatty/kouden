import type { Database } from "@/types/supabase";
import React from "react";
import ContactItem from "./contact-item";

type ContactRequest = Database["public"]["Tables"]["contact_requests"]["Row"];

interface ContactListProps {
	requests: ContactRequest[];
}

export default function ContactList({ requests }: ContactListProps) {
	if (requests.length === 0) {
		return <p>お問い合わせはまだありません。</p>;
	}
	return (
		<ul className="space-y-2">
			{requests.map((request) => (
				<li key={request.id}>
					<ContactItem request={request} />
				</li>
			))}
		</ul>
	);
}
