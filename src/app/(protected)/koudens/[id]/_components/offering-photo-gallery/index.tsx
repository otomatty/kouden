"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { OfferingPhoto } from "@/types/offering";
import { PhotoCaption } from "./photo-caption";

interface OfferingPhotoGalleryProps {
	photos: OfferingPhoto[];
	onCaptionChange?: (photoId: string, caption: string) => Promise<void>;
}

export function OfferingPhotoGallery({
	photos,
	onCaptionChange,
}: OfferingPhotoGalleryProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const showPrevious = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
	};

	const showNext = () => {
		setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
	};

	if (photos.length === 0) {
		return null;
	}

	const currentPhoto = photos[currentIndex];

	return (
		<>
			<div className="grid grid-cols-4 gap-2">
				{photos.map((photo, index) => (
					<button
						type="button"
						key={photo.id}
						onClick={() => {
							setCurrentIndex(index);
							setIsOpen(true);
						}}
						className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
					>
						<Image
							src={`/api/storage/${photo.storage_key}`}
							alt={photo.caption || "写真"}
							className="object-cover"
							fill
							sizes="(max-width: 768px) 25vw, 20vw"
						/>
					</button>
				))}
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>
							写真 {currentIndex + 1} / {photos.length}
						</DialogTitle>
					</DialogHeader>
					<div className="relative aspect-video">
						<Image
							src={`/api/storage/${currentPhoto.storage_key}`}
							alt={currentPhoto.caption || "写真"}
							className="object-contain"
							fill
							priority
							sizes="(max-width: 768px) 100vw, 80vw"
						/>
						<div className="absolute inset-y-0 left-0 flex items-center">
							<Button
								variant="ghost"
								size="icon"
								onClick={showPrevious}
								className="rounded-full bg-background/80 hover:bg-background/90"
							>
								<ChevronLeft className="h-8 w-8" />
							</Button>
						</div>
						<div className="absolute inset-y-0 right-0 flex items-center">
							<Button
								variant="ghost"
								size="icon"
								onClick={showNext}
								className="rounded-full bg-background/80 hover:bg-background/90"
							>
								<ChevronRight className="h-8 w-8" />
							</Button>
						</div>
					</div>
					{onCaptionChange && (
						<PhotoCaption
							photo={currentPhoto}
							onCaptionChange={onCaptionChange}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
