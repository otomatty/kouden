"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

/** Approve a pending organization request */
export async function approveOrganization(id: string) {
	const supabase = await createClient();
	// Approve organization
	const { error } = await supabase
		.schema("common")
		.from("organizations")
		.update({ status: "active" })
		.eq("id", id);
	if (error) {
		throw new Error(error.message);
	}
	// Fetch requester and organization name
	const { data: org } = await supabase
		.schema("common")
		.from("organizations")
		.select("requested_by, name")
		.eq("id", id)
		.single();
	if (org) {
		const requesterId = org.requested_by;
		const orgName = org.name;
		// add membership for requester as admin; ignore duplicate errors
		const { error: memberError } = await supabase
			.schema("common")
			.from("organization_members")
			.insert({ organization_id: id, user_id: requesterId, role: "admin" });
		if (memberError) {
			// unique constraint violation means member already exists
			if (memberError.code === "23505") {
				console.warn("Organization member already exists, skipping insert");
			} else {
				throw new Error(memberError.message);
			}
		}
		// membership confirmed, now send email via Resend
		const adminClient = createAdminClient();
		const {
			data: { user },
		} = await adminClient.auth.admin.getUserById(requesterId);
		if (user?.email) {
			const apiKey = process.env.RESEND_API_KEY;
			if (apiKey) {
				const resend = new Resend(apiKey);
				await resend.emails.send({
					from: process.env.RESEND_FROM_EMAIL ?? "noreply@kouden.app",
					to: user.email,
					subject: `【承認通知】${orgName}の管理システムアクセスが承認されました`,
					html: `<p>${orgName}へのアクセス申請が承認されました。</p>`,
				});
			}
		}
	}
	// revalidate admin requests page
	revalidatePath("/admin/organizations/requests");
}

/** Reject a pending organization request */
export async function rejectOrganization(id: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.schema("common")
		.from("organizations")
		.update({ status: "rejected" })
		.eq("id", id);
	if (error) {
		throw new Error(error.message);
	}
	revalidatePath("/admin/organizations/requests");
}
