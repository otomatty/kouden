import { getContactRequests } from "@/app/_actions/contact";
import ContactList from "./_components/contact-list";

export default async function ContactHistoryPage() {
	const requests = await getContactRequests();

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">お問い合わせ履歴</h1>
			<ContactList requests={requests} />
		</div>
	);
}
