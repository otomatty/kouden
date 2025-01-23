"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Database } from "@/types/supabase";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSetAtom } from "jotai";
import { loadingStateAtom } from "@/store/loading-hints";

type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

interface KoudenListProps {
	koudens: Kouden[];
}

export function KoudenList({ koudens }: KoudenListProps) {
	const setLoadingState = useSetAtom(loadingStateAtom);
	const router = useRouter();
	const [loadingKoudenId, setLoadingKoudenId] = useState<string | null>(null);

	const handleViewDetails = (koudenId: string) => {
		setLoadingState({ isLoading: true, title: "詳細を読み込み中..." });
		setLoadingKoudenId(koudenId);
		router.push(`/koudens/${koudenId}`);
	};

	if (koudens.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">香典帳がありません</p>
			</div>
		);
	}

	return (
		<div className="koudens-list grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{koudens.map((kouden) => (
				<Card key={kouden.id} className="kouden-card flex flex-col">
					<div className="flex-1">
						<CardHeader>
							<CardTitle>{kouden.title}</CardTitle>
							<CardDescription>
								{formatDistanceToNow(new Date(kouden.created_at), {
									addSuffix: true,
									locale: ja,
								})}
							</CardDescription>
						</CardHeader>
						{kouden.description && (
							<CardContent>
								<p className="text-sm text-gray-500">{kouden.description}</p>
							</CardContent>
						)}
					</div>
					<CardFooter className="mt-auto pt-6">
						<Button
							variant="outline"
							className="w-full kouden-card-button"
							onClick={() => handleViewDetails(kouden.id)}
							disabled={loadingKoudenId === kouden.id}
						>
							{loadingKoudenId === kouden.id ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									読み込み中...
								</>
							) : (
								"詳細を見る"
							)}
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
