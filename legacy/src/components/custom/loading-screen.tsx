"use client";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { LoadingOverlay } from "./loading-overlay";

interface LoadingScreenProps {
	title: string;
	hints: { id: string; text: string }[];
	onLoadingComplete?: () => void;
	className?: string;
}

export function LoadingScreen({ title, hints, onLoadingComplete, className }: LoadingScreenProps) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setProgress((prevProgress) => {
				if (prevProgress >= 100) {
					clearInterval(timer);
					return 100;
				}
				return prevProgress + 1;
			});
		}, 50);

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (progress === 100) {
			onLoadingComplete?.();
		}
	}, [progress, onLoadingComplete]);

	return (
		<LoadingOverlay className={className}>
			<h2 className="mb-4 text-2xl font-bold text-center">{title}</h2>
			<Progress value={progress} className="mb-6" />
			<Carousel className="w-full">
				<CarouselContent>
					{hints.map((hint) => (
						<CarouselItem key={hint.id}>
							<div className="p-4 text-center">
								<p className="text-muted-foreground">{hint.text}</p>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</LoadingOverlay>
	);
}
