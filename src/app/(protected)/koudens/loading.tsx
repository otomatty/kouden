import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function KoudensLoading() {
	return (
		<div className="space-y-12">
			{/* ヘッダーのスケルトン */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-[150px]" />
				<Skeleton className="h-10 w-[120px]" />
			</div>

			{/* リストのスケルトン */}
			<div className="koudens-list grid gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
				{Array.from({ length: 6 }, () => (
					<Card key={crypto.randomUUID()} className="kouden-card flex flex-col">
						<div className="flex-1">
							<CardHeader className="space-y-2">
								<Skeleton className="h-6 w-[200px]" />
								<Skeleton className="h-4 w-[150px]" />
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-[80%]" />
								</div>
							</CardContent>
						</div>
						<CardFooter className="mt-auto pt-6">
							<Skeleton className="h-10 w-full" />
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
