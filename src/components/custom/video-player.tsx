"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface VideoPlayerProps {
	src: string;
	title?: string;
	className?: string;
}

/**
 * 自動再生対応でクリック時に拡大表示できる動画プレイヤー
 */
export function VideoPlayer({ src, title, className }: VideoPlayerProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div
					className={`rounded-lg overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${className}`}
					onClick={(e) => {
						e.preventDefault();
						setIsOpen(true);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setIsOpen(true);
						}
					}}
					aria-label={title ? `${title}の動画を拡大表示` : "動画を拡大表示"}
				>
					<video
						src={src}
						className="w-full h-auto"
						autoPlay
						loop
						muted
						playsInline
						preload="auto"
					/>
				</div>
			</DialogTrigger>
			<DialogContent className="max-w-4xl w-full h-auto">
				<DialogHeader>{title && <DialogTitle>{title}</DialogTitle>}</DialogHeader>
				<div className="rounded-lg overflow-hidden">
					<video
						src={src}
						className="w-full h-auto"
						controls
						autoPlay
						loop
						muted
						playsInline
						preload="auto"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
