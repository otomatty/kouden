"use client";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useSetAtom } from "jotai";
import { loadingStateAtom } from "@/store/loading-hints";
import { motion } from "framer-motion";
import { CreateKoudenForm } from "./create-kouden-form";
import { Badge } from "@/components/ui/badge";

// 拡張した香典帳型
type Plan = Database["public"]["Tables"]["plans"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type KoudenWithPlan = Database["public"]["Tables"]["koudens"]["Row"] & {
	owner?: Profile;
	plan: Plan;
	expired: boolean;
	remainingDays?: number;
};

interface KoudenListProps {
	koudens: KoudenWithPlan[];
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
				<p className="text-gray-500 mb-4">香典帳がありません</p>
				<div className="flex justify-center">
					<CreateKoudenForm />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="koudens-list grid gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
				{sortedKoudens.map((kouden) => (
					<Link
						key={kouden.id}
						href={
							kouden.status === "archived"
								? `/koudens/${kouden.id}/archived`
								: `/koudens/${kouden.id}/entries`
						}
						className="kouden-card flex flex-col group"
						aria-label={`${kouden.title}の詳細を見る`}
						onClick={() => setLoadingState({ isLoading: true, title: "詳細を読み込み中..." })}
					>
						<motion.div
							className="flex flex-col h-full hover:shadow-lg transition-colors rounded-lg shadow-md border border-gray-200 bg-background md:justify-between"
							transition={{ type: "spring", stiffness: 100, damping: 20 }}
						>
							<div className="p-4 lg:p-6 flex md:flex-col">
								<div className="flex-1 space-y-2">
									<div className="flex justify-between items-center">
										<div className="flex-1 flex items-center justify-between">
											<h3 className="text-md md:text-lg font-semibold">{kouden.title}</h3>
											<p className="text-sm text-gray-500 truncate">
												{formatDistanceToNow(new Date(kouden.updated_at || kouden.created_at), {
													addSuffix: true,
													locale: ja,
												})}
											</p>
										</div>
									</div>
									{kouden.description && (
										<p className="text-sm text-gray-500">{kouden.description}</p>
									)}
									{/* プランと期限表示 */}
									<div className="flex items-center space-x-2">
										<Badge variant={kouden.plan.code === "free" ? "outline" : "default"}>
											{kouden.plan.name}プラン
										</Badge>
										{kouden.plan.code === "free" &&
											(kouden.expired ? (
												<Badge variant="destructive">期限切れ</Badge>
											) : (
												<Badge variant="secondary">残り {kouden.remainingDays} 日</Badge>
											))}
									</div>
								</div>
								<div className="w-10 flex items-center justify-center">
									<ChevronRight className="h-5 w-5 text-gray-400 md:hidden shrink-0" />
								</div>
							</div>
							<div className="mt-auto pt-6 m-4 md:m-6 lg:items-center text-foreground overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
								詳細を見る
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</div>
						</motion.div>
					</Link>
				))}
			</div>
		</div>
	);
}
