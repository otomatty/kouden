import Container from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/custom/loading/skeletons";

export default function Loading() {
	return (
		<Container className="py-8">
			<div className="space-y-6">
				{/* Header skeleton */}
				<Skeleton className="h-6 w-1/3" />
				{/* Card skeletons */}
				{[...Array(3)].map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<CardSkeleton key={i} />
				))}
			</div>
		</Container>
	);
}
