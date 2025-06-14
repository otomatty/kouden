"use client";

import { useState } from "react";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import { ReturnRecordsView } from "./_components";
import { ReturnDialog } from "./_components/dialog/return-dialog";

interface ReturnRecordsPageClientProps {
	koudenId: string;
	initialReturns: ReturnManagementSummary[];
	entries: Entry[];
	relationships: Relationship[];
	initialHasMore: boolean;
	initialCursor?: string;
}

/**
 * 返礼管理ページのクライアントコンポーネント
 * 役割：クライアント側の状態管理とUI制御
 */
export default function ReturnRecordsPageClient({
	koudenId,
	initialReturns,
	entries,
	relationships,
	initialHasMore,
	initialCursor,
}: ReturnRecordsPageClientProps) {
	// ダイアログの状態管理
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedReturn, setSelectedReturn] = useState<ReturnManagementSummary | null>(null);

	// ダイアログを開く関数
	const handleEditReturn = (returnRecord: ReturnManagementSummary) => {
		setSelectedReturn(returnRecord);
		setDialogOpen(true);
	};

	// ダイアログを閉じる関数
	const handleCloseDialog = () => {
		setDialogOpen(false);
		setSelectedReturn(null);
	};

	return (
		<>
			<ReturnRecordsView
				koudenId={koudenId}
				initialReturns={initialReturns}
				entries={entries}
				relationships={relationships}
				initialHasMore={initialHasMore}
				initialCursor={initialCursor}
				onEditReturn={handleEditReturn}
			/>
			{/* 返礼編集ダイアログ */}
			{selectedReturn && (
				<ReturnDialog
					koudenId={koudenId}
					entries={entries}
					relationships={relationships}
					defaultValues={selectedReturn}
					variant="edit"
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					onSuccess={() => {
						// データ更新後の処理（必要に応じて）
						handleCloseDialog();
					}}
				/>
			)}
		</>
	);
}
