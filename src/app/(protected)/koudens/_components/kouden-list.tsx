"use client";

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
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { useSetAtom } from "jotai";
import { loadingStateAtom } from "@/store/loading-hints";
import { motion } from "framer-motion";

type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

interface KoudenListProps {
	koudens: Kouden[];
}

export function KoudenList({ koudens }: KoudenListProps) {
	const setLoadingState = useSetAtom(loadingStateAtom);

	// 更新日時でソート
	const sortedKoudens = [...koudens].sort((a, b) => {
		const dateA = new Date(a.updated_at || a.created_at);
		const dateB = new Date(b.updated_at || b.created_at);
		return dateB.getTime() - dateA.getTime();
	});

	if (koudens.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">香典帳がありません</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="koudens-list grid gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
				{sortedKoudens.map((kouden) => (
					<Link
						key={kouden.id}
						href={`/koudens/${kouden.id}/entries`}
						className="kouden-card flex flex-col group"
						aria-label={`${kouden.title}の詳細を見る`}
						onClick={() => setLoadingState({ isLoading: true, title: "詳細を読み込み中..." })}
					>
						<motion.div
							className="flex flex-col h-full hover:shadow-lg transition-colors rounded-lg border border-gray-200 bg-background"
							whileHover={{ scale: 1.05 }}
							transition={{ type: "spring", stiffness: 100, damping: 20 }}
						>
							<div className="flex-1">
								<CardHeader>
									<CardTitle className="text-base md:text-lg font-semibold">
										{kouden.title}
									</CardTitle>
									<CardDescription className="text-sm text-gray-500 truncate">
										{formatDistanceToNow(new Date(kouden.updated_at || kouden.created_at), {
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
							<CardFooter className="mt-auto pt-6 flex items-center text-foreground overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								詳細を見る
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</CardFooter>
						</motion.div>
					</Link>
				))}
			</div>
		</div>
	);
}
