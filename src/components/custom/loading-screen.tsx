"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
	title: string;
	hints: { id: string; text: string }[];
	onLoadingComplete?: () => void;
	className?: string;
}

export function LoadingScreen({
	title,
	hints,
	onLoadingComplete,
	className,
}: LoadingScreenProps) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setProgress((prevProgress) => {
				if (prevProgress >= 100) {
					clearInterval(timer);
					onLoadingComplete?.();
					return 100;
				}
				return prevProgress + 1;
			});
		}, 50);

		return () => clearInterval(timer);
	}, [onLoadingComplete]);

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
				className,
			)}
		>
			<Card className="w-[90vw] max-w-[600px]">
				<CardContent className="p-6">
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
				</CardContent>
			</Card>
		</div>
	);
}
