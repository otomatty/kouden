"use client";

import React, { type ReactNode } from "react";
import { Section } from "@/components/ui/section";

export interface MediaSectionProps {
	/** ローカル動画ファイルの URL */
	videoUrl?: string;
	/** 画像ファイルの URL */
	imageUrl?: string;
	/** YouTube の埋め込み URL または watch?v= URL */
	youtubeUrl?: string;
	/** カスタムコンテンツ */
	children?: ReactNode;
}

/**
 * 動画またはスクリーンショットのセクションを共通化するコンポーネント
 */
export function MediaSection({ videoUrl, imageUrl, youtubeUrl, children }: MediaSectionProps) {
	let content: ReactNode;

	if (youtubeUrl) {
		// YouTube の watch URL を embed URL に変換
		const embedUrl = youtubeUrl.includes("watch?v=")
			? youtubeUrl.replace("watch?v=", "embed/")
			: youtubeUrl.includes("youtu.be/")
				? youtubeUrl.replace("youtu.be/", "www.youtube.com/embed/")
				: youtubeUrl;

		content = (
			<iframe
				title="デモ動画"
				src={embedUrl}
				style={{ border: 0 }}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
				className="w-full h-full rounded-lg"
			/>
		);
	} else if (videoUrl) {
		content = (
			<video src={videoUrl} controls muted loop className="w-full h-full object-cover rounded-lg" />
		);
	} else if (imageUrl) {
		content = <img src={imageUrl} alt="デモ" className="w-full h-full object-cover rounded-lg" />;
	} else {
		content = children ?? "動画/スクリーンショット";
	}

	return (
		<Section>
			<div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
				{content}
			</div>
		</Section>
	);
}
