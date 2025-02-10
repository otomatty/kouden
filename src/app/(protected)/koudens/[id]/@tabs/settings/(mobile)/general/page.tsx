import React from "react";
import { GeneralSettingsForm } from "../../@contents/(.)general/_components/general-settings-form";
import { BackLink } from "@/components/custom/BackLink";
interface GeneralSettingsPageProps {
	params: Promise<{ id: string }>;
}

export default async function GeneralSettingsPage({ params }: GeneralSettingsPageProps) {
	const { id } = await params;
	return (
		<div className="container max-w-2xl mx-auto p-4 space-y-4">
			<BackLink href={`/koudens/${id}/settings`} />
			<div>
				<h2 className="text-2xl font-bold tracking-tight">一般設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の基本的な設定を行います</p>
			</div>

			<div className="bg-white rounded-lg border p-4">
				<GeneralSettingsForm koudenId={id} />
			</div>
		</div>
	);
}
