"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreateButtonProps {
	onClick?: () => void;
	className?: string;
}

/**
 * モバイル用の新規作成ボタンコンポーネント
 * - 丸型のプラスボタンを表示
 * - ボトムナビゲーションの中央に配置される
 * - クリックイベントを外部から制御可能
 */
export function CreateButton({ onClick, className }: CreateButtonProps) {
	return (
		<Button
			className={cn(
				"flex h-14 w-14 items-center justify-center rounded-full bg-primary p-0",
				"text-primary-foreground hover:bg-primary/90 [&_svg]:!h-6 [&_svg]:!w-6 shadow-lg",
				className,
			)}
			onClick={onClick}
		>
			<Plus />
		</Button>
	);
}
