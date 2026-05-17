"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { generateInvitationEmailHtml } from "@/utils/emailTemplates";
import { Resend } from "resend";

/**
 * Sends an invitation email with the share link for a Kouden.
 * @param to Recipient email address
 * @param link Invitation URL
 * @param title Title of the Kouden (for email content)
 */
export async function sendInvitationEmail(
	to: string,
	link: string,
	title: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		// Initialize Resend with API key from environment at call time
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			throw new KoudenError(
				"Missing RESEND_API_KEY environment variable",
				ErrorCodes.UNKNOWN_ERROR,
			);
		}
		const resend = new Resend(apiKey);

		await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL ?? "noreply@kouden.app",
			to,
			subject: `香典帳「${title}」への招待`,
			html: generateInvitationEmailHtml(title, link),
		});

		return null;
	}, "招待メールの送信");
}
