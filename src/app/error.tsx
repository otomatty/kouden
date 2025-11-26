"use client";
import { Footer } from "@/app/(public)/_components/footer";
import { Header } from "@/app/(public)/_components/header";
import { MobileBottomNavigation } from "@/app/(public)/_components/mobile-bottom-navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface ErrorProps {
	error: Error;
	reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<>
			<Header version={process.env.NEXT_PUBLIC_APP_VERSION ?? ""} />
			<main className="mt-16 min-h-screen flex items-center justify-center flex-col space-y-4">
				<h1 className="text-2xl font-bold">エラーが発生しました</h1>
				<p className="text-muted-foreground">{error.message}</p>
				<Button variant="default" onClick={() => reset()}>
					再試行
				</Button>
			</main>
			<Footer />
			<MobileBottomNavigation />
		</>
	);
}
