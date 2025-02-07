import { Skeleton } from "@/components/ui/skeleton";

const FORM_FIELDS = ["title", "description", "date"] as const;

/**
 * 設定のローディング状態を表示するコンポーネント
 * - フォームのスケルトンを表示
 */
export default function SettingsLoading() {
	return (
		<div className="space-y-6">
			{/* セクションタイトルのスケルトン */}
			<Skeleton className="h-6 w-[200px]" />

			{/* フォームのスケルトン */}
			<div className="space-y-8">
				{FORM_FIELDS.map((field) => (
					<div key={`field-${field}`} className="space-y-4">
						<Skeleton className="h-5 w-[150px]" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-4 w-[200px]" />
					</div>
				))}

				{/* ボタングループのスケルトン */}
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-[100px]" />
					<Skeleton className="h-10 w-[100px]" />
				</div>
			</div>
		</div>
	);
}
