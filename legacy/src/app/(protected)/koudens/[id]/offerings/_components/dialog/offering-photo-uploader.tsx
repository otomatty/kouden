"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OfferingPhotoUploaderProps {
	onPhotosChange: (photos: File[]) => void;
}

export function OfferingPhotoUploader({
	onPhotosChange,
}: OfferingPhotoUploaderProps) {
	const [photos, setPhotos] = useState<Array<{ file: File; preview: string }>>(
		[],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newPhotos = acceptedFiles.map((file) => ({
				file,
				preview: URL.createObjectURL(file),
			}));
			const updatedPhotos = [...photos, ...newPhotos];
			setPhotos(updatedPhotos);
			onPhotosChange(updatedPhotos.map((p) => p.file));
		},
		[photos, onPhotosChange],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".jpeg", ".jpg", ".png", ".webp"],
		},
		maxSize: 5 * 1024 * 1024, // 5MB
	});

	const removePhoto = (index: number) => {
		const updatedPhotos = photos.filter((_, i) => i !== index);
		setPhotos(updatedPhotos);
		onPhotosChange(updatedPhotos.map((p) => p.file));
	};

	return (
		<div className="space-y-4">
			<div
				{...getRootProps()}
				className={cn(
					"border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors",
					isDragActive && "border-primary bg-primary/5",
				)}
			>
				<input {...getInputProps()} />
				<div className="flex flex-col items-center gap-2">
					<ImagePlus className="h-8 w-8 text-muted-foreground" />
					<div className="text-sm text-muted-foreground">
						{isDragActive ? (
							<p>ここにドロップ</p>
						) : (
							<p>
								クリックまたはドラッグ＆ドロップで写真をアップロード
								<br />
								<span className="text-xs">JPG, PNG, WebP / 最大5MB</span>
							</p>
						)}
					</div>
				</div>
			</div>

			{photos.length > 0 && (
				<div className="grid grid-cols-3 gap-4">
					{photos.map((photo, index) => (
						<div
							key={photo.preview}
							className="relative aspect-square rounded-lg overflow-hidden group"
						>
							<Image
								src={photo.preview}
								alt="プレビュー"
								className="object-cover"
								fill
								sizes="(max-width: 768px) 33vw, 20vw"
							/>
							<button
								type="button"
								onClick={() => removePhoto(index)}
								className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
