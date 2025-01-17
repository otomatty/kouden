"use client";

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
import Link from "next/link";
import type { Database } from "@/types/supabase";

type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

interface KoudenListProps {
	koudens: Kouden[];
}

export function KoudenList({ koudens }: KoudenListProps) {
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
						<Link href={`/koudens/${kouden.id}`} className="w-full">
							<Button variant="outline" className="w-full kouden-card-button">
								詳細を見る
							</Button>
						</Link>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
