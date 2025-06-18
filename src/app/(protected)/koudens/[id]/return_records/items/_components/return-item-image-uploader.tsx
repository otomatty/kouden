"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReturnItemImageUploaderProps {
	/** 現在の画像URL（編集時） */
	currentImageUrl?: string | null;
	/** 画像変更時のコールバック */
	onImageChange: (imageUrl: string | null) => void;
	/** アップロード中フラグ */
	isUploading?: boolean;
	/** アップロード無効化フラグ */
	disabled?: boolean;
}

/**
 * 返礼品画像アップロードコンポーネント
 * 役割：返礼品の画像をドラッグ&ドロップまたはクリックでアップロード
 * 特徴：WebP変換、プレビュー表示、削除機能
 */
export function ReturnItemImageUploader({
	currentImageUrl,
	onImageChange,
	isUploading = false,
	disabled = false,
}: ReturnItemImageUploaderProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
	const [isProcessing, setIsProcessing] = useState(false);
	const { toast } = useToast();

	// ファイル処理（WebP変換）
	const processImageFile = useCallback(async (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const img = new window.Image();
			const reader = new FileReader();

			reader.onload = () => {
				img.onload = () => {
					try {
						// WebP変換処理
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d");

						if (!ctx) {
							reject(new Error("Canvas context not available"));
							return;
						}

						// 最大サイズ制限（800x600）
						const maxWidth = 800;
						const maxHeight = 600;
						let { width, height } = img;

						// アスペクト比を保持してリサイズ
						if (width > maxWidth || height > maxHeight) {
							const aspectRatio = width / height;
							if (width > height) {
								width = maxWidth;
								height = maxWidth / aspectRatio;
							} else {
								height = maxHeight;
								width = maxHeight * aspectRatio;
							}
						}

						canvas.width = width;
						canvas.height = height;
						ctx.drawImage(img, 0, 0, width, height);

						canvas.toBlob(
							(blob) => {
								if (blob) {
									const imageUrl = URL.createObjectURL(blob);
									resolve(imageUrl);
								} else {
									reject(new Error("Failed to convert image"));
								}
							},
							"image/webp",
							0.8, // 品質80%
						);
					} catch (error) {
						reject(error);
					}
				};

				img.onerror = () => reject(new Error("Failed to load image"));
				img.src = reader.result as string;
			};

			reader.onerror = () => reject(new Error("Failed to read file"));
			reader.readAsDataURL(file);
		});
	}, []);

	// ドロップ処理
	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (disabled || isUploading) return;

			const file = acceptedFiles[0];
			if (!file) return;

			try {
				setIsProcessing(true);
				const processedImageUrl = await processImageFile(file);
				setPreviewUrl(processedImageUrl);
				onImageChange(processedImageUrl);

				toast({
					title: "画像をアップロードしました",
					description: "フォームを保存すると画像が確定されます",
				});
			} catch (error) {
				console.error("[ERROR] Image processing failed:", error);
				toast({
					title: "画像処理エラー",
					description: "画像の処理に失敗しました",
					variant: "destructive",
				});
			} finally {
				setIsProcessing(false);
			}
		},
		[disabled, isUploading, processImageFile, onImageChange, toast],
	);

	// Dropzone設定
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".jpeg", ".jpg", ".png", ".webp"],
		},
		maxSize: 5 * 1024 * 1024, // 5MB
		multiple: false,
		disabled: disabled || isUploading || isProcessing,
	});

	// 画像削除
	const handleRemoveImage = useCallback(() => {
		if (disabled || isUploading) return;

		setPreviewUrl(null);
		onImageChange(null);

		toast({
			title: "画像を削除しました",
		});
	}, [disabled, isUploading, onImageChange, toast]);

	const displayImageUrl = previewUrl || currentImageUrl;
	const isProcessingOrUploading = isProcessing || isUploading;

	return (
		<div className="space-y-4">
			{displayImageUrl ? (
				// 画像プレビュー表示
				<div className="relative">
					<div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
						<Image
							src={displayImageUrl}
							alt="返礼品画像プレビュー"
							className="object-cover"
							fill
							sizes="(max-width: 768px) 100vw, 400px"
						/>
						{isProcessingOrUploading && (
							<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
								<div className="text-white text-sm">
									{isProcessing ? "画像を処理中..." : "アップロード中..."}
								</div>
							</div>
						)}
					</div>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={handleRemoveImage}
						disabled={disabled || isProcessingOrUploading}
						className="absolute top-2 right-2"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				// アップロードエリア
				<div
					{...getRootProps()}
					className={cn(
						"border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
						"hover:border-primary hover:bg-primary/5",
						isDragActive && "border-primary bg-primary/10",
						(disabled || isProcessingOrUploading) && "opacity-50 cursor-not-allowed",
					)}
				>
					<input {...getInputProps()} />
					<div className="flex flex-col items-center gap-3">
						{isProcessingOrUploading ? (
							<Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
						) : (
							<ImagePlus className="h-8 w-8 text-muted-foreground" />
						)}
						<div className="text-sm text-muted-foreground">
							{isProcessingOrUploading ? (
								<p>画像を処理中...</p>
							) : isDragActive ? (
								<p>ここにドロップしてください</p>
							) : (
								<>
									<p className="font-medium">クリックまたはドラッグ&ドロップで画像をアップロード</p>
									<p className="text-xs mt-1">
										JPG, PNG, WebP / 最大5MB
										<br />
										推奨サイズ: 800x600px以下
									</p>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
