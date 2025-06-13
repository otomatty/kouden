import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDonation } from "@/app/_actions/funeral/donations/getDonation";
import { listCases } from "@/app/_actions/funeral/cases/listCases";
import { DonationForm } from "../../_components/donation-form";

interface EditDonationPageProps {
	params: Promise<{
		donationId: string;
	}>;
}

export default async function EditDonationPage({ params }: EditDonationPageProps) {
	try {
		const { donationId } = await params;
		const [donation, cases] = await Promise.all([getDonation(donationId), listCases()]);

		if (!donation) {
			notFound();
		}

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
							<h1 className="text-3xl font-bold">香典記録の編集</h1>
							<p className="text-muted-foreground">香典受付記録を編集します</p>
						</div>
					</div>

					{/* フォーム */}
					<Card>
						<CardHeader>
							<CardTitle>香典情報編集</CardTitle>
						</CardHeader>
						<CardContent>
							<DonationForm cases={cases} donation={donation} mode="edit" />
						</CardContent>
					</Card>
				</div>
			</Container>
		);
	} catch (error) {
		console.error("Error loading donation:", error);
		notFound();
	}
}
