"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { getTourSteps } from "./tour-steps";
import { tourStateAtom } from "./tour-store";
import type { DriverRef } from "@/types/tour";

export const TourGuide = ({ children }: { children: React.ReactNode }) => {
	const [tourState, setTourState] = useAtom(tourStateAtom);
	const driverObj = useRef<DriverRef>(null);

	useEffect(() => {
		if (!tourState.isActive) return;
		if (!tourState.currentPage) return;

		const steps = getTourSteps(tourState.currentPage);

		if (steps.length === 0) {
			console.warn("No tour steps found for current page:", tourState.currentPage);
			setTourState((prev) => ({ ...prev, isActive: false }));
			return;
		}

		// 既存のdriverインスタンスを適切に破棄
		if (driverObj.current) {
			try {
				driverObj.current.destroy();
			} catch (error) {
				console.warn("Failed to destroy existing driver:", error);
			}
			driverObj.current = null;
		}

		// 新しいdriverインスタンスを作成
		try {
			driverObj.current = driver({
				animate: true,
				showProgress: true,
				showButtons: ["next", "previous", "close"],
				allowKeyboardControl: true,
				steps,
				onDestroyed: () => {
					setTourState((prev) => ({ ...prev, isActive: false }));
					driverObj.current = null;
				},
				onHighlightStarted: (element) => {
					if (!element) {
						console.warn("Tour element not found, skipping step");
						return;
					}
				},
				popoverClass: "driver-popover-custom",
				stagePadding: 8,
				smoothScroll: true,
				overlayColor: "rgba(0, 0, 0, 0.6)",
				progressText: "{{current}} / {{total}}",
				nextBtnText: "次へ→",
				prevBtnText: "←戻る",
				doneBtnText: "終了",
				allowClose: true,
			});
		} catch (error) {
			console.error("Failed to create driver instance:", error);
			setTourState((prev) => ({ ...prev, isActive: false }));
			return;
		}

		// カスタムスタイルを追加
		const style = document.createElement("style");
		style.id = "tour-guide-styles";
		style.textContent = `
			.driver-popover-custom {
				background-color: white;
				border-radius: 16px;
				padding: 28px;
				box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
				border: 1px solid #e2e8f0;
				max-width: 420px;
				z-index: 10000 !important;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			}
			.driver-popover-custom .driver-popover-title {
				font-size: 1.375rem;
				font-weight: 700;
				margin-bottom: 16px;
				color: #1e293b;
				line-height: 1.3;
			}
			.driver-popover-custom .driver-popover-description {
				font-size: 1rem;
				line-height: 1.7;
				color: #475569;
				margin-bottom: 24px;
			}
			.driver-popover-custom .driver-popover-footer {
				margin-top: 24px;
				display: flex;
				gap: 12px;
				justify-content: flex-end;
			}
			.driver-popover-custom .driver-popover-footer button {
				padding: 12px 20px;
				border-radius: 10px;
				font-weight: 600;
				font-size: 0.9rem;
				transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
				border: none;
				cursor: pointer;
				min-width: 80px;
				position: relative;
				overflow: hidden;
			}
			.driver-popover-custom .driver-popover-footer button:hover {
				transform: translateY(-2px);
				box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
			}
			.driver-popover-custom .driver-popover-footer .driver-next-btn,
			.driver-popover-custom .driver-popover-footer .driver-done-btn {
				background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
				color: white;
			}
			.driver-popover-custom .driver-popover-footer .driver-next-btn:hover,
			.driver-popover-custom .driver-popover-footer .driver-done-btn:hover {
				background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
			}
			.driver-popover-custom .driver-popover-footer .driver-prev-btn {
				background-color: #f8fafc;
				color: #475569;
				border: 1px solid #e2e8f0;
			}
			.driver-popover-custom .driver-popover-footer .driver-prev-btn:hover {
				background-color: #f1f5f9;
				border-color: #cbd5e1;
			}
			.driver-popover-custom .driver-popover-footer .driver-close-btn {
				background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
				color: white;
			}
			.driver-popover-custom .driver-popover-footer .driver-close-btn:hover {
				background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
			}
			.driver-popover-custom .driver-popover-progress-text {
				font-size: 0.8rem;
				color: #64748b;
				text-align: center;
				margin-bottom: 16px;
				font-weight: 500;
			}
			.driver-highlighted-element {
				z-index: 9999 !important;
				position: relative !important;
			}
			.driver-overlay {
				z-index: 9998 !important;
			}
			.driver-popover {
				z-index: 10001 !important;
			}
		`;

		// 既存のスタイルを削除してから新しいものを追加
		const existingStyle = document.getElementById("tour-guide-styles");
		if (existingStyle) {
			existingStyle.remove();
		}
		document.head.appendChild(style);

		// ツアーを開始（少し遅延させて DOM の準備を待つ）
		const startTour = () => {
			try {
				if (driverObj.current) {
					driverObj.current.drive();
				}
			} catch (error) {
				console.error("Failed to start tour:", error);
				setTourState((prev) => ({ ...prev, isActive: false }));
			}
		};

		const timeoutId = setTimeout(startTour, 800);

		// クリーンアップ関数
		return () => {
			clearTimeout(timeoutId);
			if (driverObj.current) {
				try {
					driverObj.current.destroy();
				} catch (error) {
					console.warn("Failed to destroy driver on cleanup:", error);
				}
				driverObj.current = null;
			}
			const styleElement = document.getElementById("tour-guide-styles");
			if (styleElement) {
				styleElement.remove();
			}
		};
	}, [tourState.isActive, tourState.currentPage, setTourState]);

	return <>{children}</>;
};
