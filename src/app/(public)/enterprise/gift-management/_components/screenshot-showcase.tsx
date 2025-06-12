import Image from "next/image";
import type { ScreenshotShowcaseProps } from "../../funeral-management/_components/screenshot-showcase";

/**
 * スクリーンショットを表示するコンポーネント
 */
export function ScreenshotShowcase({
	src,
	alt,
	caption,
	width = 800,
	height = 600,
}: ScreenshotShowcaseProps) {
	return (
		<div className="rounded-xl shadow-lg overflow-hidden border border-border/60 bg-background transition-all hover:shadow-xl">
			{/* ブラウザの上部バー */}
			<div className="bg-muted p-2 flex items-center border-b">
				<div className="flex space-x-1.5">
					<div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
					<div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
					<div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
				</div>
				<div className="mx-auto bg-background/80 rounded-full px-3 py-0.5 sm:px-4 sm:py-1 text-xs text-center max-w-[150px] sm:max-w-[250px] truncate">
					{caption}
				</div>
			</div>

			{/* スクリーンショット画像 */}
			<div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
					className="object-cover w-full h-full"
					sizes="(max-width: 768px) 100vw, 50vw"
					priority
				/>
			</div>
		</div>
	);
}
