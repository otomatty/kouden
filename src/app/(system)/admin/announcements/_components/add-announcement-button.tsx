"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { createAnnouncement } from "@/app/_actions/admin/announcements";
import { AnnouncementForm, type AnnouncementFormData } from "./announcement-form";

export function AddAnnouncementButton() {
	const onSubmit = async (values: AnnouncementFormData) => {
		try {
			await createAnnouncement(values);
		} catch (error) {
			console.error("Failed to create announcement:", error);
		}
	};

	return (
		<ResponsiveDialog
			trigger={<Button>新規作成</Button>}
			title="新規お知らせ作成"
			description="新しいお知らせを作成します。全ての項目を入力してください。"
			contentClassName="sm:max-w-[425px]"
		>
			<AnnouncementForm onSubmit={onSubmit} submitLabel="作成" />
		</ResponsiveDialog>
	);
}
