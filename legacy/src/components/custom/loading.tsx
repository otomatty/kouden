import { Loader2 } from "lucide-react";

interface LoadingProps {
	message?: string;
}

export function Loading({ message = "読み込み中..." }: LoadingProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			<div className="text-sm text-muted-foreground">{message}</div>
		</div>
	);
}
