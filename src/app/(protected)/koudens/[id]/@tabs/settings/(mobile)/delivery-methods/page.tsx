import React from "react";
import { BackLink } from "@/components/custom/BackLink";
import { DeliveryMethodsForm } from "./_components/delivery-methods-form";
import { getDeliveryMethods } from "@/app/_actions/return-records/delivery-methods";

interface DeliveryMethodsPageProps {
	params: Promise<{ id: string }>;
}

export default async function DeliveryMethodsPage({ params }: DeliveryMethodsPageProps) {
	const { id } = await params;
	const deliveryMethods = await getDeliveryMethods(id);

	return (
		<div className="container max-w-2xl mx-auto p-4 space-y-4">
			<BackLink href={`/koudens/${id}/settings`} />
			<div>
				<h2 className="text-2xl font-bold tracking-tight">配送方法設定</h2>
				<p className="text-sm text-muted-foreground">返礼品の配送方法を設定します</p>
			</div>

			<div className="bg-white rounded-lg border p-4">
				<DeliveryMethodsForm
					koudenId={id}
					initialData={deliveryMethods.map((method) => method.name)}
				/>
			</div>
		</div>
	);
}
