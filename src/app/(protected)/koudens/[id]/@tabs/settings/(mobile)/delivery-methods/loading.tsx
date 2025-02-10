import { BackLink } from "@/components/custom/BackLink";
import { Skeleton } from "@/components/ui/skeleton";

export default function DeliveryMethodsLoading() {
	return (
		<div className="container max-w-2xl mx-auto p-4 space-y-4">
			<BackLink href="#" />
			<div>
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-64 mt-1" />
			</div>

			<div className="bg-white rounded-lg border p-4 space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-9 w-24" />
			</div>
		</div>
	);
}
