"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { tourSteps } from "./tour-steps";
import { tourStateAtom } from "./tour-store";
import type { DriverRef } from "@/types/tour";

// グローバルにインスタンスと現在のステップを保存
let driverInstance: DriverRef = null;
let currentStepIndex = 0;

// 要素が表示されるまで待機する関数（URLチェック付き）
export const waitForElement = (
	selector: string,
	expectedUrlPattern: string,
	maxAttempts = 20,
): Promise<boolean> => {
	return new Promise((resolve) => {
		let attempts = 0;
		const interval = setInterval(() => {
			attempts++;
			const element = document.querySelector(selector);
			const isUrlMatch = window.location.pathname.match(expectedUrlPattern);

			if (element && isUrlMatch) {
				clearInterval(interval);
				// 要素が見つかった後、ツアーを再開
				setTimeout(() => {
					if (driverInstance) {
						driverInstance.destroy();
						driverInstance = driver({
							animate: true,
							showProgress: true,
							showButtons: ["next", "previous", "close"],
							steps: tourSteps,
							popoverClass: "driver-popover-custom",
							stagePadding: 4,
							smoothScroll: true,
							overlayColor: "rgba(0, 0, 0, 0.4)",
							progressText: "{{current}} / {{total}}",
							nextBtnText: "次へ",
							prevBtnText: "戻る",
							doneBtnText: "完了",
							allowClose: true,
						});
						// インスタンス作成後、少し待ってからツアーを再開
						setTimeout(() => {
							console.log("Restarting tour at step:", currentStepIndex + 1);
							driverInstance?.drive(currentStepIndex + 1);
							resolve(true);
						}, 500);
					}
				}, 1000); // ページ遷移後のレンダリングを待つ
			} else if (attempts >= maxAttempts) {
				clearInterval(interval);
				console.warn("Failed to find element or URL match:", {
					selector,
					expectedUrlPattern,
				});
				resolve(false);
			}
		}, 500);
	});
};

export const moveToNextStep = () => {
	if (driverInstance?.hasNextStep()) {
		const activeIndex = driverInstance?.getActiveIndex();
		if (typeof activeIndex === "number") {
			currentStepIndex = activeIndex + 1;
			driverInstance.moveNext();
		}
	}
};

export const TourGuide = ({ children }: { children: React.ReactNode }) => {
	const [tourState, setTourState] = useAtom(tourStateAtom);
	const driverObj = useRef<DriverRef>(null);

	const startTour = useCallback(() => {
		const appBody = document.querySelector(".app-body");
		if (!appBody || !driverObj.current) {
			console.warn("Required elements not found for tour");
			return;
		}
		driverObj.current.drive();
	}, []);

	useEffect(() => {
		driverObj.current = driver({
			animate: true,
			showProgress: true,
			showButtons: ["next", "previous", "close"],
			steps: tourSteps,
			onDestroyed: () => {
				setTourState((prev) => ({ ...prev, isActive: false }));
			},
			popoverClass: "driver-popover-custom",
			stagePadding: 4,
			smoothScroll: true,
			overlayColor: "rgba(0, 0, 0, 0.4)",
			progressText: "{{current}} / {{total}}",
			nextBtnText: "次へ",
			prevBtnText: "戻る",
			doneBtnText: "完了",
			allowClose: true,
			onDeselected: (element) => {
				// ステップが変更されたときに現在のインデックスを更新
				if (driverObj.current) {
					const activeIndex = driverObj.current.getActiveIndex();
					if (typeof activeIndex === "number") {
						currentStepIndex = activeIndex;
					}
				}
			},
		});

		// グローバル変数に保存
		driverInstance = driverObj.current;

		const style = document.createElement("style");
		style.textContent = `
			.driver-popover-custom {
				background-color: white;
				border-radius: 0.75rem;
				padding: 1.5rem;
				box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
			}
			.driver-popover-custom .driver-popover-title {
				font-size: 1.25rem;
				font-weight: 600;
				margin-bottom: 0.75rem;
				color: #1a1a1a;
			}
			.driver-popover-custom .driver-popover-description {
				font-size: 1rem;
				line-height: 1.5;
				color: #4a4a4a;
				margin-bottom: 1rem;
			}
			.driver-popover-custom .driver-popover-footer {
				margin-top: 1rem;
				display: flex;
				gap: 0.5rem;
			}
			.driver-popover-custom .driver-popover-footer button {
				padding: 0.5rem 1rem;
				border-radius: 0.5rem;
				font-weight: 500;
				transition: all 0.2s;
			}
			.driver-popover-custom .driver-popover-footer button:hover {
				opacity: 0.9;
			}
			.driver-popover-custom .driver-popover-footer .driver-next-btn {
				background-color: #2563eb;
				color: white;
			}
			.driver-popover-custom .driver-popover-footer .driver-prev-btn {
				background-color: #e5e7eb;
				color: #4b5563;
			}
			.driver-popover-custom .driver-popover-footer .driver-close-btn {
				background-color: #ef4444;
				color: white;
			}
			.driver-popover-custom .driver-popover-footer .driver-done-btn {
				background-color: #10b981;
				color: white;
			}
			.driver-popover-custom .driver-popover-progress-text {
				font-size: 0.875rem;
				color: #6b7280;
			}
		`;
		document.head.appendChild(style);

		const completed = localStorage.getItem("tourCompleted");
		if (!completed) {
			setTimeout(startTour, 500);
			localStorage.setItem("tourCompleted", "true");
		}

		return () => {
			driverObj.current?.destroy();
			style.remove();
		};
	}, [setTourState, startTour]);

	return (
		<>
			<button
				type="button"
				onClick={startTour}
				className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
			>
				ガイドを表示
			</button>
			{children}
		</>
	);
};
