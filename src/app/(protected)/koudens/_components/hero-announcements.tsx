"use client";

import { useState, useEffect } from "react";
import { AnnouncementCard } from "./announcement-card";
import type { Announcement } from "@/types/announcements";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroAnnouncementsProps {
	announcements: Announcement[];
	autoRotate?: boolean;
	rotationInterval?: number; // ミリ秒
	showDismissButton?: boolean;
}

export function HeroAnnouncements({
	announcements,
	autoRotate = true,
	rotationInterval = 8000, // 8秒
	showDismissButton = true,
}: HeroAnnouncementsProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [visibleAnnouncements, setVisibleAnnouncements] = useState(announcements);
	const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

	// ローカルストレージから非表示にしたお知らせIDを読み込み
	useEffect(() => {
		try {
			const dismissed = localStorage.getItem("dismissed-announcements");
			if (dismissed) {
				setDismissedIds(new Set(JSON.parse(dismissed)));
			}
		} catch (error) {
			console.warn("Failed to load dismissed announcements from localStorage:", error);
		}
	}, []);

	// 非表示にしたお知らせを除外
	useEffect(() => {
		const filtered = announcements.filter((announcement) => !dismissedIds.has(announcement.id));
		setVisibleAnnouncements(filtered);

		// 現在のインデックスが範囲外になった場合は調整
		if (currentIndex >= filtered.length && filtered.length > 0) {
			setCurrentIndex(0);
		}
	}, [announcements, dismissedIds, currentIndex]);

	// 自動ローテーション
	useEffect(() => {
		if (!autoRotate || visibleAnnouncements.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
		}, rotationInterval);

		return () => clearInterval(interval);
	}, [autoRotate, rotationInterval, visibleAnnouncements.length]);

	const handleDismiss = (id: string) => {
		const newDismissedIds = new Set(dismissedIds);
		newDismissedIds.add(id);
		setDismissedIds(newDismissedIds);

		// ローカルストレージに保存
		try {
			localStorage.setItem("dismissed-announcements", JSON.stringify(Array.from(newDismissedIds)));
		} catch (error) {
			console.warn("Failed to save dismissed announcements to localStorage:", error);
		}
	};

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev === 0 ? visibleAnnouncements.length - 1 : prev - 1));
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
	};

	// 表示するお知らせがない場合は何も表示しない
	if (visibleAnnouncements.length === 0) {
		return null;
	}

	const currentAnnouncement = visibleAnnouncements[currentIndex];

	// 安全性チェック（念のため）
	if (!currentAnnouncement) {
		return null;
	}

	return (
		<div className="relative" data-tour="hero-announcements">
			<AnnouncementCard
				announcement={currentAnnouncement}
				onDismiss={handleDismiss}
				showDismissButton={showDismissButton}
			/>

			{/* ナビゲーションボタン（複数のお知らせがある場合のみ表示） */}
			{visibleAnnouncements.length > 1 && (
				<div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
					<Button
						variant="ghost"
						size="sm"
						onClick={handlePrevious}
						className="pointer-events-auto ml-2 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
						aria-label="前のお知らせ"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleNext}
						className="pointer-events-auto mr-2 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
						aria-label="次のお知らせ"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* インジケーター（複数のお知らせがある場合のみ表示） */}
			{visibleAnnouncements.length > 1 && (
				<div className="flex justify-center mt-3 gap-2">
					{visibleAnnouncements.map((announcement, index) => (
						<button
							key={announcement.id}
							type="button"
							onClick={() => setCurrentIndex(index)}
							className={`h-2 w-2 rounded-full transition-colors ${
								index === currentIndex
									? "bg-primary"
									: "bg-muted-foreground/30 hover:bg-muted-foreground/50"
							}`}
							aria-label={`お知らせ ${index + 1} を表示`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
