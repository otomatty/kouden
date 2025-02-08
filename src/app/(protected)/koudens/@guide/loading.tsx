import { Skeleton } from "@/components/ui/skeleton";

export default function GuideLoading() {
	return (
		<div className="rounded-lg border p-6 space-y-4">
			<Skeleton className="h-6 w-[200px]" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-[80%]" />
			</div>
		</div>
	);
}
