"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { duplicateKouden } from "@/app/_actions/koudens";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface DuplicateKoudenButtonProps {
	koudenId: string;
}

export function DuplicateKoudenButton({ koudenId }: DuplicateKoudenButtonProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const handleDuplicate = async () => {
		try {
			setLoading(true);
			const { kouden, error } = await duplicateKouden(koudenId);

			if (error) {
				throw new Error(error);
			}

			if (!kouden) {
				throw new Error("香典帳の複製に失敗しました");
			}

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
			setLoading(false);
		}
	};

	if (isDesktop) {
		return (
			<Button
				variant="ghost"
				onClick={handleDuplicate}
				disabled={loading}
				className="flex items-center gap-2 text-sm"
			>
				<Copy className="h-4 w-4" />
				<span className="text-sm">{loading ? "複製中..." : "香典帳を複製する"}</span>
			</Button>
		);
	}

	return (
		<button
			type="button"
			onClick={handleDuplicate}
			disabled={loading}
			className={cn(
				"flex flex-col items-center gap-1.5 min-w-[60px] py-2 px-3 rounded-md transition-colors",
				"text-gray-600 hover:text-gray-900 hover:bg-gray-100",
				loading && "opacity-50 cursor-not-allowed",
			)}
		>
			<Copy className="h-5 w-5" />
			<span className="text-sm font-medium">{loading ? "複製中..." : "香典帳を複製する"}</span>
		</button>
	);
}
