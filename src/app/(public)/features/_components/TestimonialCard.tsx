import React from "react";
import { Star } from "lucide-react";

type TestimonialCardProps = {
	id?: string;
	rating: number;
	comment: string;
	name?: string;
	ageGroup?: string;
};

export function TestimonialCard({ rating, comment, name, ageGroup }: TestimonialCardProps) {
	return (
		<div className="flex-shrink-0 w-64 p-6 rounded-lg border bg-card shadow-md flex flex-col justify-between">
			{/* 上部：コメント */}
			<div className="mb-4">
				<p className="text-muted-foreground italic">{comment}</p>
			</div>

			{/* 下部：評価とメタ情報 */}
			<div className="flex items-center justify-between">
				{/* 左側：評価 */}
				<div className="flex">
					{[1, 2, 3, 4, 5].map((i) => (
						<Star
							key={i}
							fill={i <= rating ? "currentColor" : "none"}
							stroke={i <= rating ? "none" : "currentColor"}
							color={i <= rating ? undefined : "currentColor"}
							{...(i <= rating
								? { className: "h-5 w-5 text-yellow-400" }
								: { className: "h-5 w-5 text-gray-300" })}
						/>
					))}
				</div>
				{/* 右側：年代と名前 */}
				<div className="flex">
					{ageGroup && <p className="text-sm text-muted-foreground mr-2">{ageGroup}</p>}
					{name && <p className="text-sm font-semibold text-primary">{name}</p>}
				</div>
			</div>
		</div>
	);
}
