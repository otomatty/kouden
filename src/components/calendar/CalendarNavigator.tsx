"use client";

import { useState, useEffect, useRef } from "react";
import CalendarGrid from "./CalendarGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { DayAvailability } from "@/app/_actions/calendar";

interface CalendarNavigatorProps {
	initialAvailability: DayAvailability[];
	initialWeekStart: string; // ISO string
}

export default function CalendarNavigator({
	initialAvailability,
	initialWeekStart,
}: CalendarNavigatorProps) {
	const [weekStart, setWeekStart] = useState<string>(initialWeekStart);
	const [availability, setAvailability] = useState<DayAvailability[]>(initialAvailability);
	const [isLoading, setIsLoading] = useState(false);
	const cacheRef = useRef<Record<string, DayAvailability[]>>({
		[initialWeekStart]: initialAvailability,
	});

	useEffect(() => {
		(async () => {
			if (cacheRef.current[weekStart]) {
				setAvailability(cacheRef.current[weekStart]);
				return;
			}
			setIsLoading(true);
			const res = await fetch(`/api/availability?weekStart=${encodeURIComponent(weekStart)}`);
			if (res.ok) {
				const data: DayAvailability[] = await res.json();
				cacheRef.current[weekStart] = data;
				setAvailability(data);
			}
			setIsLoading(false);
		})();
	}, [weekStart]);

	// Helper to shift week by n days
	const shiftWeek = (days: number) => {
		const date = new Date(weekStart);
		date.setDate(date.getDate() + days);
		setWeekStart(date.toISOString());
	};

	// Compute visible range label
	const rangeLabel = (() => {
		const start = new Date(weekStart);
		const end = new Date(start);
		end.setDate(end.getDate() + 6);
		return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
	})();

	return (
		<div>
			<div className="flex items-center justify-center gap-4 mb-4">
				<Button variant="outline" type="button" onClick={() => shiftWeek(-7)}>
					← 前週
				</Button>
				<span className="font-medium">{rangeLabel}</span>
				<Button variant="outline" type="button" onClick={() => shiftWeek(7)}>
					次週 →
				</Button>
			</div>
			{isLoading ? (
				<div className="grid grid-cols-7 gap-4">
					{Array.from({ length: 7 }).map((_, dayIdx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<div key={dayIdx} className="flex flex-col items-center gap-2">
							<Skeleton className="w-full h-6" />
							{Array.from({ length: 8 }).map((_, idx) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								<Skeleton key={idx} className="w-full h-10" />
							))}
						</div>
					))}
				</div>
			) : (
				<CalendarGrid availability={availability} />
			)}
		</div>
	);
}
