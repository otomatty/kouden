"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
	EllipsisVertical,
	UserPlus,
	XCircle,
	Copy,
	Trash2,
	FileSpreadsheet,
	FileText,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { canUpdateKouden, canDeleteKouden } from "@/store/permission";
import type { KoudenPermission } from "@/types/role";
import { toast } from "sonner";
import { duplicateEntriesAtom } from "@/store/duplicateEntries";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { duplicateKouden } from "@/app/_actions/koudens/duplicate";
import { validateDuplicateEntries } from "@/app/_actions/validateDuplicateEntries";
import { exportKoudenToExcel } from "@/app/_actions/export";
import { exportKoudenToPdf } from "@/app/_actions/exportPdf";
import { pdf } from "@react-pdf/renderer";
import KoudenPdfDocument from "@/components/pdf/KoudenPdfDocument";
import { PdfExportSurveyTrigger } from "@/components/survey";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";

interface KoudenActionsMenuMobileProps {
	koudenId: string;
	koudenTitle: string;
	/** 全機能アクセス許可 */
	fullAccess?: boolean;
	/** ユーザーの香典帳に対する権限 */
	permission: KoudenPermission;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
}

/**
 * モバイル版の香典帳アクションメニューコンポーネント
 * Sheet UIを使用してメニュー項目を表示
 */
export function KoudenActionsMenuMobile({
	koudenId,
	koudenTitle,
	fullAccess = true,
	permission,
	enableExcel,
}: KoudenActionsMenuMobileProps) {
	const [, setDupResults] = useAtom(duplicateEntriesAtom);
	const duplicateResults = useAtomValue(duplicateEntriesAtom);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState<string | null>(null);
	const [showSurvey, setShowSurvey] = useState(false);

	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const isRestricted = fullAccess === false;

	const handleClearDuplicates = () => {
		setDupResults(null);
		toast.success("通常表示に戻しました", {
			description: "重複表示を解除して通常の表示に戻りました",
		});
		const params = new URLSearchParams(searchParams.toString());
		params.delete("isDuplicate");
		router.push(`${pathname}?${params.toString()}`);
		setIsOpen(false);
	};

	const handleDuplicateCheck = async () => {
		setIsLoading("duplicate-check");
		try {
			const result = await validateDuplicateEntries(koudenId);
			setDupResults(result);
			const params = new URLSearchParams(searchParams.toString());
			params.set("isDuplicate", "true");
			router.push(`${pathname}?${params.toString()}`);
			toast.success("重複チェックが完了しました", {
				description: `${result.length}件の重複が見つかりました`,
			});
		} catch (error) {
			toast.error("重複チェックに失敗しました", {
				description: error instanceof Error ? error.message : "エラーが発生しました",
			});
		} finally {
			setIsLoading(null);
			setIsOpen(false);
		}
	};

	const handleDuplicateKouden = async () => {
		setIsLoading("duplicate");
		try {
			const result = await duplicateKouden(koudenId);
			if (result.kouden) {
				toast.success("香典帳を複製しました");
				router.push(`/koudens/${result.kouden.id}`);
			} else {
				toast.error("香典帳の複製に失敗しました", {
					description: result.error,
				});
			}
		} catch (error) {
			toast.error("香典帳の複製に失敗しました", {
				description: error instanceof Error ? error.message : "エラーが発生しました",
			});
		} finally {
			setIsLoading(null);
			setIsOpen(false);
		}
	};

	const handleExportExcel = async () => {
		setIsLoading("excel");
		try {
			const result = await exportKoudenToExcel(koudenId);

			// Base64文字列からBlobを作成
			const binaryString = window.atob(result.base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			// ダウンロードリンクを作成
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = result.fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.success("Excelファイルを出力しました", {
				description: `ファイル名: ${result.fileName}`,
			});
		} catch (error) {
			toast.error("Excelファイルの出力に失敗しました", {
				description:
					error instanceof Error ? error.message : "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsLoading(null);
			setIsOpen(false);
		}
	};

	const handleExportPdf = async () => {
		setIsLoading("pdf");
		try {
			// データを取得
			const data = await exportKoudenToPdf(koudenId);

			// PDF生成
			const asPdf = pdf(<KoudenPdfDocument data={data} />);
			const blob = await asPdf.toBlob();

			// ダウンロード処理
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;

			// ファイル名生成
			const now = new Date();
			const yyyy = now.getFullYear();
			const mm = `${now.getMonth() + 1}`.padStart(2, "0");
			const dd = `${now.getDate()}`.padStart(2, "0");
			const dateSuffix = `${yyyy}${mm}${dd}`;
			const safeTitle = data.title.replace(/\s+/g, "_");
			link.download = `${safeTitle}_${dateSuffix}.pdf`;

			// ダウンロード実行
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);

			// PDF出力成功の通知
			toast.success("PDFが正常に出力されました");

			// PDF出力成功時のみアンケート表示
			setShowSurvey(true);
		} catch (error) {
			console.error("PDF出力エラー:", error);
			toast.error("PDF出力に失敗しました。時間を置いてお試しください。");
		} finally {
			setIsLoading(null);
			setIsOpen(false);
		}
	};

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0" data-tour="more-actions-button">
					<EllipsisVertical className="h-6 w-6" />
				</Button>
			</SheetTrigger>
			<SheetContent className="flex flex-col">
				<SheetHeader>
					<SheetTitle>メニュー</SheetTitle>
				</SheetHeader>
				<div className="flex-1 mt-6 space-y-2">
					{/* Excel出力 */}
					{isRestricted ? (
						<Button
							variant="ghost"
							disabled
							className="w-full flex items-center justify-start gap-3 h-12 text-left"
						>
							<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
							<div className="flex flex-col items-start">
								<span className="text-muted-foreground">Excel(.xlsx)</span>
								<span className="text-xs text-muted-foreground">有料プランで利用できます</span>
							</div>
						</Button>
					) : enableExcel ? (
						<Button
							variant="ghost"
							onClick={handleExportExcel}
							disabled={isLoading === "excel"}
							className="w-full flex items-center justify-start gap-3 h-12 text-left"
						>
							<FileSpreadsheet className="h-5 w-5 text-[#217346]" />
							<span>{isLoading === "excel" ? "出力中..." : "Excel(.xlsx)"}</span>
						</Button>
					) : (
						<Button
							variant="ghost"
							disabled
							className="w-full flex items-center justify-start gap-3 h-12 text-left"
						>
							<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
							<div className="flex flex-col items-start">
								<span className="text-muted-foreground">Excel(.xlsx)</span>
								<span className="text-xs text-muted-foreground">有料プランで利用できます</span>
							</div>
						</Button>
					)}

					{/* PDF出力 */}
					<Button
						variant="ghost"
						onClick={handleExportPdf}
						disabled={isLoading === "pdf"}
						className="w-full flex items-center justify-start gap-3 h-12 text-left"
					>
						<FileText className="h-5 w-5 text-[#fb0c00]" />
						<span>{isLoading === "pdf" ? "生成中..." : "PDF(.pdf)"}</span>
					</Button>

					{/* 重複表示を解除 */}
					{canUpdateKouden(permission) && duplicateResults !== null && (
						<Button
							variant="ghost"
							onClick={handleClearDuplicates}
							className="w-full flex items-center justify-start gap-3 h-12 text-left"
						>
							<XCircle className="h-5 w-5" />
							<span>通常表示</span>
						</Button>
					)}

					{/* 重複をチェック */}
					{canUpdateKouden(permission) && !isRestricted && duplicateResults === null && (
						<Button
							variant="ghost"
							onClick={handleDuplicateCheck}
							disabled={isLoading === "duplicate-check"}
							className="w-full flex items-center justify-start gap-3 h-12 text-left"
						>
							<Copy className="h-5 w-5" />
							<span>重複をチェック</span>
						</Button>
					)}

					<Separator />

					{/* 共有 */}
					{canUpdateKouden(permission) &&
						(isRestricted ? (
							<Button
								variant="ghost"
								disabled
								className="w-full flex items-center justify-start gap-3 h-12 text-left"
							>
								<UserPlus className="h-5 w-5 text-muted-foreground" />
								<div className="flex flex-col items-start">
									<span className="text-muted-foreground">香典帳を共有する</span>
									<span className="text-xs text-muted-foreground">有料プランで利用できます</span>
								</div>
							</Button>
						) : (
							<Button
								variant="ghost"
								asChild
								className="w-full flex items-center justify-start gap-3 h-12 text-left"
								data-tour="share-button"
							>
								<Link href={`/koudens/${koudenId}/members`}>
									<UserPlus className="h-5 w-5" />
									<span>香典帳を共有する</span>
								</Link>
							</Button>
						))}

					{/* 香典帳を複製する */}
					{canUpdateKouden(permission) &&
						(isRestricted ? (
							<Button
								variant="ghost"
								disabled
								className="w-full flex items-center justify-start gap-3 h-12 text-left"
							>
								<Copy className="h-5 w-5 text-muted-foreground" />
								<div className="flex flex-col items-start">
									<span className="text-muted-foreground">香典帳を複製する</span>
									<span className="text-xs text-muted-foreground">有料プランで利用できます</span>
								</div>
							</Button>
						) : (
							<Button
								variant="ghost"
								onClick={handleDuplicateKouden}
								disabled={isLoading === "duplicate"}
								className="w-full flex items-center justify-start gap-3 h-12 text-left"
							>
								<Copy className="h-5 w-5" />
								<span>香典帳を複製する</span>
							</Button>
						))}
				</div>

				{/* 削除ボタン（下部固定） */}
				{canDeleteKouden(permission) && (
					<div className="mt-4 pt-4 border-t">
						<DeleteKoudenDialog
							koudenId={koudenId}
							koudenTitle={koudenTitle}
							onSheetClose={() => setIsOpen(false)}
						/>
					</div>
				)}
			</SheetContent>
			{/* PDF出力成功後のアンケート表示 */}
			<PdfExportSurveyTrigger showSurvey={showSurvey} onShown={() => setShowSurvey(false)} />
		</Sheet>
	);
}
