import { generateInvitationEmailHtml } from "@/utils/emailTemplates";
import { getKouden } from "@/app/_actions/koudens";

export default async function PreviewEmailPage({
	searchParams,
}: { searchParams: Promise<{ koudenId?: string }> }) {
	const { koudenId } = await searchParams;
	if (!koudenId) {
		throw new Error("Missing koudenId query parameter");
	}
	const koudenResult = await getKouden(koudenId);
	if (!koudenResult.ok) {
		throw new Error(koudenResult.error.message);
	}
	const kouden = koudenResult.data;
	// Fallback invitation link placeholder
	const origin = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
	const link = `${origin}/invitations/preview-token`;
	const html = generateInvitationEmailHtml(kouden.title, link);

	return (
		<iframe
			title="Invitation Email Preview"
			srcDoc={html}
			style={{ width: "100%", height: "100vh", border: "none" }}
		/>
	);
}
