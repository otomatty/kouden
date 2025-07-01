import React from "react";
import { GeneralSettingsForm } from "../../@contents/(.)general/_components/general-settings-form";
import { getKouden } from "@/app/_actions/koudens";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneralSettingsPageProps {
	params: Promise<{ id: string }>;
}

export default async function GeneralSettingsPage({ params }: GeneralSettingsPageProps) {
	const { id } = await params;
	const kouden = await getKouden(id);

	return (
		<div className="container max-w-2xl mx-auto space-y-6">
			{/* シンプルな戻るボタン */}
			<div className="flex items-center justify-between border-b pb-4">
				<Button variant="outline" size="lg" asChild className="text-base font-normal">
					<Link href={`/koudens/${id}/settings`} className="flex items-center gap-2">
						<ArrowLeft className="w-5 h-5" />
						<span>設定一覧に戻る</span>
					</Link>
				</Button>
			</div>

			{/* メインコンテンツ */}
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-2xl font-bold tracking-tight">一般設定</h2>
					<p className="text-base text-muted-foreground">香典帳の名前や説明文を変更できます</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<GeneralSettingsForm
						koudenId={id}
						defaultValues={{ title: kouden.title, description: kouden.description ?? "" }}
					/>
				</div>
			</div>
		</div>
	);
}
