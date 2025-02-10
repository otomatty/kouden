import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-[200px]" />
				<Skeleton className="h-10 w-[150px]" />
			</div>

			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, index) => (
					<Skeleton key={`member-skeleton-${index}`} className="h-16 w-full" />
				))}
			</div>
		</div>
	);
}
