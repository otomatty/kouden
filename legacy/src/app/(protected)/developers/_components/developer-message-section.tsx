import { Card, CardContent } from "@/components/ui/card";

export function DeveloperMessageSection() {
	return (
		<Card className="border-2 border-dashed border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
			<CardContent className="p-8">
				<div className="flex items-start gap-6">
					<div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
						📝
					</div>
					<div className="flex-1 space-y-4">
						<h2 className="text-2xl font-bold text-amber-900">開発者からの手紙</h2>
						<div className="space-y-3 text-amber-800 leading-relaxed">
							<p>
								このアプリは大きな会社のサービスではありません。 でも、だからこそ
								<strong>ユーザーの皆さまとの距離が近い</strong>のが私たちの強みです。
							</p>
							<p>
								機能追加のご要望や、使いにくい部分のご指摘など、 どんな小さなことでも
								<strong>直接開発者にお伝え</strong>いただけます。
							</p>
							<p>
								香典帳を通じて、皆さまの大切な想いが
								きちんと形になるよう、これからも改善を続けてまいります。
							</p>
						</div>
						<div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
							<p className="text-amber-800 text-sm font-medium text-center">
								✉️ お気軽にご連絡ください - 必ずお返事いたします
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
