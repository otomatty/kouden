import { getContactRequestDetail } from "@/app/_actions/contact";
import ContactDetail from "./_components/contact-detail";
import ResponseList from "./_components/response-list";

export default async function ContactDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const data = await getContactRequestDetail(id);

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">お問い合わせ詳細</h1>
			<ContactDetail request={data} />
			<h2 className="text-xl font-semibold mt-6 mb-4">返信履歴</h2>
			<ResponseList responses={data.contact_responses || []} />
		</div>
	);
}
