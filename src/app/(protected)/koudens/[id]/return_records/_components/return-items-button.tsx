"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface ReturnItemsButtonProps {
	koudenId: string;
	className?: string;
}

/**
 * 返礼品管理ボタンコンポーネント
 * 役割：返礼品管理ページへの遷移ボタンを提供
 */
export function ReturnItemsButton({ koudenId, className }: ReturnItemsButtonProps) {
	const router = useRouter();

	const handleClick = () => {
		router.push(`/koudens/${koudenId}/return_records/items`);
	};

	return (
		<Button size="lg" onClick={handleClick} className={className}>
			<Package className="h-4 w-4 mr-2" />
			返礼品を管理する
		</Button>
	);
}
