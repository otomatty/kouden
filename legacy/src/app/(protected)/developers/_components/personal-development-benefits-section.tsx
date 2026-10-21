import { Card, CardContent } from "@/components/ui/card";

export function PersonalDevelopmentBenefitsSection() {
	return (
		<Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-0 shadow-xl">
			<CardContent className="p-8">
				<div className="text-center space-y-6">
					<h2 className="text-2xl font-bold">🎯 個人開発だからできること</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						大企業のサービスにはない、個人開発ならではの価値をお届けします
					</p>

					<div className="grid md:grid-cols-2 gap-6 mt-8">
						<div className="bg-white/70 backdrop-blur rounded-xl p-6 border border-white/50 shadow-sm">
							<div className="text-3xl mb-3">⚡</div>
							<h3 className="font-semibold mb-2">素早い対応</h3>
							<p className="text-sm text-muted-foreground">
								ユーザーの声に直接お応えします。大企業では難しい迅速な機能追加や改善が可能です。
							</p>
						</div>
						<div className="bg-white/70 backdrop-blur rounded-xl p-6 border border-white/50 shadow-sm">
							<div className="text-3xl mb-3">💬</div>
							<h3 className="font-semibold mb-2">直接対話</h3>
							<p className="text-sm text-muted-foreground">
								開発者と直接コミュニケーション。要望や不具合報告も、必ずお返事いたします。
							</p>
						</div>
						<div className="bg-white/70 backdrop-blur rounded-xl p-6 border border-white/50 shadow-sm">
							<div className="text-3xl mb-3">🎨</div>
							<h3 className="font-semibold mb-2">本質に集中</h3>
							<p className="text-sm text-muted-foreground">
								本当に必要な機能だけを厳選。複雑さを排除し、使いやすさを追求しています。
							</p>
						</div>
						<div className="bg-white/70 backdrop-blur rounded-xl p-6 border border-white/50 shadow-sm">
							<div className="text-3xl mb-3">❤️</div>
							<h3 className="font-semibold mb-2">想いを込めて</h3>
							<p className="text-sm text-muted-foreground">
								一人ひとりのユーザーを大切に。数字ではなく、人を見つめたサービス作りです。
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
