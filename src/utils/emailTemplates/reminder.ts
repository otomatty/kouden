import { emailLayout } from "./layout";

export function buildReminderEmail(message: string) {
	const subject = "閲覧期限リマインダー";
	const body = `<p>${message}</p>`;
	const html = emailLayout(body);
	return { subject, html };
}
