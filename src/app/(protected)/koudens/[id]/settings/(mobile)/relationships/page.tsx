import React from "react";
import { BackLink } from "@/components/custom/BackLink";
import { getRelationships } from "@/app/_actions/relationships";
import { RelationshipCardList } from "./_components/relationship-card-list";

interface RelationshipsPageProps {
	params: Promise<{ id: string }>;
}

export default async function RelationshipsPage({ params }: RelationshipsPageProps) {
	const { id } = await params;
	const relationships = await getRelationships(id);

	return (
		<div className="container max-w-2xl mx-auto p-4 space-y-4">
			<BackLink href={`/koudens/${id}/settings`} />
			<div>
				<h2 className="text-2xl font-bold tracking-tight">関係性設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の関係性の設定を管理します</p>
			</div>

			<div className="bg-white rounded-lg border p-4">
				<RelationshipCardList koudenId={id} relationships={relationships} />
			</div>
		</div>
	);
}
