import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Mail, Globe } from "lucide-react";
import Link from "next/link";

export function DeveloperInfoSection() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Mail className="h-5 w-5" />
					開発者情報
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<h3 className="font-semibold">菅井 瑛正 (Akimasa Sugai)</h3>
					<p className="text-sm text-muted-foreground">フルスタックエンジニア</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<Button asChild variant="outline" size="sm" className="justify-start">
						<Link href="https://saedgewell.net" target="_blank" rel="noopener noreferrer">
							<Globe className="h-4 w-4 mr-2" />
							公式サイト
							<ExternalLink className="h-3 w-3 ml-auto" />
						</Link>
					</Button>
					<Button asChild variant="outline" size="sm" className="justify-start">
						<Link href="https://github.com/otomatty" target="_blank" rel="noopener noreferrer">
							<Github className="h-4 w-4 mr-2" />
							GitHub
							<ExternalLink className="h-3 w-3 ml-auto" />
						</Link>
					</Button>
					<Button asChild variant="outline" size="sm" className="justify-start">
						<Link href="mailto:saedgewell@gmail.com">
							<Mail className="h-4 w-4 mr-2" />
							お問い合わせ
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
