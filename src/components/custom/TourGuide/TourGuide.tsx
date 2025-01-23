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
		if (tourState.isActive && tourState.currentPage) {
			const steps = getTourSteps(tourState.currentPage);
			if (steps.length === 0) {
				console.warn(
					"No tour steps found for current page:",
					tourState.currentPage,
				);
				setTourState((prev) => ({ ...prev, isActive: false }));
				return;
			}

			driverObj.current = driver({
				animate: true,
				showProgress: true,
				showButtons: ["next", "previous", "close"],
				steps,
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
			});

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

			setTimeout(() => {
				driverObj.current?.drive();
			}, 500);

			return () => {
				driverObj.current?.destroy();
				style.remove();
			};
		}
	}, [tourState.isActive, tourState.currentPage, setTourState]);

	return <>{children}</>;
};
