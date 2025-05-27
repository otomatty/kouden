"use server";

import { Resend } from "resend";
import { generateInvitationEmailHtml } from "@/utils/emailTemplates";

/**
 * Sends an invitation email with the share link for a Kouden.
 * @param to Recipient email address
 * @param link Invitation URL
 * @param title Title of the Kouden (for email content)
 */
export async function sendInvitationEmail(to: string, link: string, title: string) {
	// Initialize Resend with API key from environment at call time
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error("Missing RESEND_API_KEY environment variable");
	const resend = new Resend(apiKey);

	try {
		await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL ?? "noreply@kouden.app",
			to,
			subject: `香典帳「${title}」への招待`,
			html: generateInvitationEmailHtml(title, link),
		});
	} catch (error) {
		console.error("[ERROR] sendInvitationEmail failed:", error);
		throw error;
	}
}
