"use client";

import { useAtom } from "jotai";
import { loadingHints, loadingStateAtom } from "@/store/loading-hints";
import { LoadingScreen } from "./loading-screen";

export function LoadingProvider({ children }: { children: React.ReactNode }) {
	const [loadingState, setLoadingState] = useAtom(loadingStateAtom);

	return (
		<>
			{loadingState.isLoading && (
				<LoadingScreen
					title={loadingState.title}
					hints={loadingHints}
					onLoadingComplete={() =>
						setLoadingState({ isLoading: false, title: "" })
					}
				/>
			)}
			{children}
		</>
	);
}
