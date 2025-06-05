"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { KoudenTitle } from "./kouden-title";
import { KoudenActionsMenu } from "../actions/kouden-actions-menu";
import type { KoudenPermission } from "@/types/role";
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";

interface KoudenHeaderProps {
	koudenId: string;
	title: string;
	description?: string | null;
	/** 全機能アクセスを有効化するか */
	fullAccess?: boolean;
	/** ユーザーの香典帳に対する権限 */
	permission: KoudenPermission;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
	/** 無料プランの残り日数（表示用） */
	remainingDays?: number;
	/** 戻るリンクのURL */
	backLinkHref?: string;
	/** 戻るリンクのテキスト */
	backLinkText?: string;
}

export default function KoudenHeader({
	koudenId,
	title,
	description,
	fullAccess = true,
	permission,
	enableExcel,
	remainingDays,
	backLinkHref = "/koudens",
	backLinkText = "一覧に戻る",
}: KoudenHeaderProps) {
	const [showAlert, setShowAlert] = useState(true);

	return (
		<div className="space-y-4 py-4">
			<Button variant="ghost" className="flex items-center gap-2 w-fit p-2" asChild>
				<a href={backLinkHref}>
					<ArrowLeft className="h-4 w-4" />
					<span>{backLinkText}</span>
				</a>
			</Button>
			{remainingDays != null && showAlert && (
				<Alert className="w-full flex items-start justify-between">
					<div>
						<AlertTitle>プランのアップグレード</AlertTitle>
						<AlertDescription>
							無料プランの残り期間はあと{remainingDays}
							日です。期間内にデータを入力し、PDFを出力してください。
						</AlertDescription>
					</div>
					<div className="flex items-center space-x-2">
						<Link href={`/koudens/${koudenId}/purchase`}>
							<Button size="sm">アップグレード</Button>
						</Link>
						<Button variant="ghost" size="icon" onClick={() => setShowAlert(false)}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</Alert>
			)}
			<div className="flex items-center justify-between">
				<KoudenTitle koudenId={koudenId} title={title} description={description} />
				<KoudenActionsMenu
					koudenId={koudenId}
					koudenTitle={title}
					fullAccess={fullAccess}
					permission={permission}
					enableExcel={enableExcel}
				/>
			</div>
		</div>
	);
}
