import { Skeleton } from "@/components/ui/skeleton";

export function RelationshipSkeleton() {
	return (
		<div className="flex items-center space-x-2">
			<Skeleton className="h-4 w-[100px]" />
		</div>
	);
}
