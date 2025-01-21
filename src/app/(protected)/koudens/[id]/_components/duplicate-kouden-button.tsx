"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { duplicateKouden } from "@/app/_actions/koudens";
import { toast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface DuplicateKoudenButtonProps {
	koudenId: string;
}

export function DuplicateKoudenButton({
	koudenId,
}: DuplicateKoudenButtonProps) {
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

			toast({
				title: "香典帳を複製しました",
				description: "新しい香典帳が作成されました",
			});

			router.push(`/koudens/${kouden.id}`);
		} catch (error) {
			console.error("Error:", error);
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "香典帳の複製に失敗しました",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	if (isDesktop) {
		return (
			<Button
				variant="outline"
				onClick={handleDuplicate}
				disabled={loading}
				className="flex items-center gap-2"
			>
				<Copy className="h-4 w-4" />
				{loading ? "複製中..." : "コピーを作成"}
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
			<span className="text-xs font-medium">
				{loading ? "複製中..." : "コピー"}
			</span>
		</button>
	);
}
