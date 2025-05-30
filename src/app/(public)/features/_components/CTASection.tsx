import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
	return (
		<section className="text-center container py-16">
			<h2 className="text-2xl font-bold mb-4">さあ、始めましょう</h2>
			<Button asChild>
				<Link href="/auth/login">
					無料で登録する
					<ChevronRight className="ml-2 h-4 w-4" />
				</Link>
			</Button>
		</section>
	);
}
