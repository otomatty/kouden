import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
	error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
	return (
		<div className="flex items-center justify-center p-8">
			<div className="text-center space-y-4">
				<AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
				<p className="text-lg font-medium">データの取得に失敗しました</p>
				<p className="text-muted-foreground">{error}</p>
			</div>
		</div>
	);
}
