"use server";

import { createShareInvitation } from "./invitations";
import { sendInvitationEmail } from "./email";

/**
 * Sends batch invitations by email. Up to 5 addresses.
 * Expects FormData fields: koudenId, role, emails (multiple), optional maxUses, expiresIn.
 */
export async function sendBatchInvitationEmails(formData: FormData) {
	const koudenId = formData.get("koudenId") as string;
	const roleId = formData.get("role") as string;
	const maxUsesRaw = formData.get("maxUses");
	const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
	const expiresIn = (formData.get("expiresIn") as string) || "7d";

	const emails = formData.getAll("emails").map((e) => e as string);
	const sanitizedEmails = emails.filter((email) => email).slice(0, 5);

	for (const email of sanitizedEmails) {
		// Create invitation record
		const invitation = await createShareInvitation({
			koudenId,
			roleId,
			maxUses,
			expiresIn,
		});
		// Construct link using environment URL or fallback
		const origin =
			process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
		const link = `${origin}/invitations/${invitation.invitation_token}`;
		// Send email
		await sendInvitationEmail(email, link, invitation.kouden_data?.title ?? "");
	}
}
