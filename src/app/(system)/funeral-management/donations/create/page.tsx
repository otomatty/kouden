import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { listCases } from "@/app/_actions/funeral/cases/listCases";
import { DonationForm } from "../_components/donation-form";

interface CreateDonationPageProps {
	searchParams: Promise<{
		caseId?: string;
	}>;
}

export default async function CreateDonationPage({ searchParams }: CreateDonationPageProps) {
	const cases = await listCases();
	const { caseId } = await searchParams;
	const selectedCaseId = caseId;

	return (
		<Container>
			<div className="space-y-6 py-6">
				{/* ヘッダー */}
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/funeral-management/donations">
							<ArrowLeft className="h-4 w-4 mr-2" />
							戻る
						</Link>
					</Button>
					<div>
						<h1 className="text-3xl font-bold">香典記録の新規作成</h1>
						<p className="text-muted-foreground">新しい香典受付記録を登録します</p>
					</div>
				</div>

				{/* フォーム */}
				<Card>
					<CardHeader>
						<CardTitle>香典情報入力</CardTitle>
					</CardHeader>
					<CardContent>
						<DonationForm cases={cases} selectedCaseId={selectedCaseId} />
					</CardContent>
				</Card>
			</div>
		</Container>
	);
}
