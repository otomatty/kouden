import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-[200px]" />
				<Skeleton className="h-10 w-[150px]" />
			</div>

			<div className="space-y-2">
				{["s1", "s2", "s3", "s4", "s5"].map((key) => (
					<Skeleton key={key} className="h-16 w-full" />
				))}
			</div>
		</div>
	);
}
