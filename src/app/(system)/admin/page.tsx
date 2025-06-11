import type { Metadata } from "next";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
	title: "管理画面 | 香典帳",
	description: "香典帳の管理画面です",
};

async function DashboardMetrics() {
	const supabase = await createClient();

	// 各種統計情報を取得
	const { count: totalUsers } = await supabase
		.from("profiles")
		.select("*", { count: "exact", head: true });

	const { count: totalKoudens } = await supabase
		.from("koudens")
		.select("*", { count: "exact", head: true });

	const { count: totalEntries } = await supabase
		.from("kouden_entries")
		.select("*", { count: "exact", head: true });

	const { count: openTickets } = await supabase
		.from("support_tickets")
		.select("*", { count: "exact", head: true })
		.eq("status", "open");

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{totalUsers ?? 0}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">総香典帳数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{totalKoudens ?? 0}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">総記帳数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{totalEntries ?? 0}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">未対応チケット</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{openTickets ?? 0}</div>
				</CardContent>
			</Card>
		</div>
	);
}

function DashboardSkeleton() {
	const metrics = ["users", "koudens", "entries", "tickets"];
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{metrics.map((metric) => (
				<Card key={`skeleton-${metric}`}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<Skeleton className="h-4 w-[100px]" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-[60px]" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default function AdminDashboard() {
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">ダッシュボード</h1>
			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardMetrics />
			</Suspense>
		</div>
	);
}
