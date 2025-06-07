"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useAtom } from "jotai";
import { duplicateEntriesAtom } from "@/store/duplicateEntries";
import { validateDuplicateEntries } from "@/app/_actions/validateDuplicateEntries";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface DuplicateCheckButtonProps {
	koudenId: string;
}

export function DuplicateCheckButton({ koudenId }: DuplicateCheckButtonProps) {
	const [loading, setLoading] = useState(false);
	const [, setDupResults] = useAtom(duplicateEntriesAtom);
	const { toast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const handleClick = async () => {
		try {
			setLoading(true);
			const results = await validateDuplicateEntries(koudenId);
			setDupResults(results);
			const params = new URLSearchParams(searchParams.toString());
			params.set("isDuplicate", "true");
			router.push(`${pathname}?${params.toString()}`);
			if (results.length === 0) {
				toast({ title: "重複は検出されませんでした" });
			} else {
				toast({ title: `${results.length}件の重複が検出されました` });
			}
		} catch (error) {
			toast({
				title: "重複検証中にエラーが発生しました",
				description: error instanceof Error ? error.message : undefined,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			variant="ghost"
			onClick={handleClick}
			disabled={loading}
			className="flex items-center gap-2 text-sm"
		>
			{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
			<span>{loading ? "検証中..." : "重複を確認する"}</span>
		</Button>
	);
}
