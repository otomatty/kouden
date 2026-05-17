"use client";

import { duplicateKouden } from "@/app/_actions/koudens";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DuplicateKoudenButtonProps {
	koudenId: string;
}

export function DuplicateKoudenButton({ koudenId }: DuplicateKoudenButtonProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const handleDuplicate = async () => {
		try {
			setIsLoading(true);
			const result = await duplicateKouden(koudenId);

			if (!result.ok) {
				toast.error("香典帳の複製に失敗しました", {
					description: result.error.message,
				});
				return;
			}

			const kouden = result.data;

			toast.success("香典帳を複製しました", {
				description: "新しい香典帳が作成されました",
			});

			router.push(`/koudens/${kouden.id}`);
		} catch (error) {
			console.error("Error:", error);
			toast.error("香典帳の複製に失敗しました", {
				description:
					error instanceof Error ? error.message : "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (isDesktop) {
		return (
			<Button
				variant="ghost"
				onClick={handleDuplicate}
				disabled={isLoading}
				className="flex items-center gap-2 text-sm"
			>
				<Copy className="h-4 w-4" />
				<span className="text-sm">{isLoading ? "複製中..." : "香典帳を複製する"}</span>
			</Button>
		);
	}

	return (
		<button
			type="button"
			onClick={handleDuplicate}
			disabled={isLoading}
			className={cn(
				"flex flex-col items-center gap-1.5 min-w-[60px] py-2 px-3 rounded-md transition-colors",
				"text-gray-600 hover:text-gray-900 hover:bg-gray-100",
				isLoading && "opacity-50 cursor-not-allowed",
			)}
		>
			<Copy className="h-5 w-5" />
			<span className="text-sm font-medium">{isLoading ? "複製中..." : "香典帳を複製する"}</span>
		</button>
	);
}
