import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DevelopmentStorySection() {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
				<CardTitle className="flex items-center gap-3 text-2xl">
					<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
						📖
					</div>
					開発ストーリー
				</CardTitle>
			</CardHeader>
			<CardContent className="p-8">
				<div className="relative">
					{/* タイムライン線 */}
					<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-200 via-yellow-200 via-blue-200 via-purple-200 via-green-200 to-emerald-200" />

					<div className="space-y-12">
						{/* Chapter 1: Excelとの格闘 */}
						<div className="relative flex items-start gap-6">
							<div className="relative z-10 w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
								<span className="text-2xl">😰</span>
							</div>
							<div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-6">
								<h3 className="text-lg font-semibold text-red-900 mb-3">
									Chapter 1: Excelのテンプレート地獄
								</h3>
								<div className="text-red-800 leading-relaxed space-y-3">
									<p>
										家族を亡くした直後、香典の管理をどうすればいいか全く分からず、
										<strong>「香典帳 テンプレート Excel」</strong>で何時間も検索していました。
									</p>
									<p>
										やっと見つけたテンプレートをダウンロードしても、項目が足りなかったり、
										使い方が分からなかったり...。住所録、香典の記録、返礼品の管理が
										すべて別々のファイルになってしまい、
										<strong>「この方にはもう返礼品をお送りしたっけ？」</strong>
										という確認だけで何度もファイルを行き来する始末。
									</p>
									<p>
										悲しみの中で、こんな煩雑な作業に時間を取られるのが
										本当に辛かったのを覚えています。
									</p>
								</div>
							</div>
						</div>

						{/* Chapter 2: 周りの人も同じだった */}
						<div className="relative flex items-start gap-6">
							<div className="relative z-10 w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
								<span className="text-2xl">🤝</span>
							</div>
							<div className="flex-1 bg-orange-50 border border-orange-100 rounded-xl p-6">
								<h3 className="text-lg font-semibold text-orange-900 mb-3">
									Chapter 2: 「みんな同じ苦労をしていた」
								</h3>
								<div className="text-orange-800 leading-relaxed space-y-3">
									<p>
										後日、友人や知人に相談してみると、
										<strong>「私も同じことで困った」</strong>という声が次々と...。
									</p>
									<ul className="list-disc list-inside space-y-1 ml-4">
										<li>「手書きの香典帳から住所を転記するのが大変だった」</li>
										<li>「返礼品を重複して送ってしまった」</li>
										<li>「金額の合計計算で何度もミスした」</li>
										<li>「葬儀社にお任せしたけど、後で自分でも管理したくなった」</li>
									</ul>
									<p>
										こんなに多くの人が同じ悩みを抱えているのに、
										<strong>なぜ適切な解決策がないんだろう？</strong>
										その疑問が、開発への第一歩となりました。
									</p>
								</div>
							</div>
						</div>

						{/* Chapter 3: 開発への決意とリサーチ */}
						<div className="relative flex items-start gap-6">
							<div className="relative z-10 w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
								<span className="text-2xl">🔍</span>
							</div>
							<div className="flex-1 bg-yellow-50 border border-yellow-100 rounded-xl p-6">
								<h3 className="text-lg font-semibold text-yellow-900 mb-3">
									Chapter 3: エンジニアとして何かできるはず
								</h3>
								<div className="text-yellow-800 leading-relaxed space-y-3">
									<p>
										エンジニアとして10年以上働いてきた経験があるなら、
										<strong>この問題を解決できるはず。</strong>
										まずは既存の解決策を徹底的に調査しました。
									</p>
									<div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
										<h4 className="font-semibold mb-2">調査結果：</h4>
										<ul className="list-disc list-inside space-y-1 text-sm">
											<li>市販ソフト：高価（3〜5万円）で機能が複雑すぎる</li>
											<li>無料ツール：デザインが古く、使い勝手が悪い</li>
											<li>手書き管理：時間がかかり、ミスが起こりやすい</li>
										</ul>
									</div>
									<p>
										<strong>「本当に必要な機能だけを、シンプルに使えるツール」</strong>
										そんなコンセプトで、自分で作ることを決意しました。
									</p>
								</div>
							</div>
						</div>

						{/* Chapter 4: プロトタイプ作成と初期フィードバック */}
						<div className="relative flex items-start gap-6">
							<div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
								<span className="text-2xl">👥</span>
							</div>
							<div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-6">
								<h3 className="text-lg font-semibold text-blue-900 mb-3">
									Chapter 4: 最初のβ版と貴重なフィードバック
								</h3>
								<div className="text-blue-800 leading-relaxed space-y-3">
									<p>
										基本機能ができた段階で、身近な人にテストをお願いしました。
										そこで得られたフィードバックは、開発者一人では気づけない
										貴重なものばかりでした。
									</p>
									<div className="grid md:grid-cols-2 gap-4">
										<div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
											<h4 className="font-semibold mb-2 text-blue-900">ユーザーの声：</h4>
											<ul className="list-disc list-inside space-y-1 text-sm">
												<li>「住所入力が面倒。郵便番号から自動入力できない？」</li>
												<li>「印刷した時のレイアウトがもう少しきれいに...」</li>
												<li>「返礼品の発送状況がパッと見て分からない」</li>
											</ul>
										</div>
										<div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
											<h4 className="font-semibold mb-2 text-blue-900">改善ポイント：</h4>
											<ul className="list-disc list-inside space-y-1 text-sm">
												<li>郵便番号API連携の実装</li>
												<li>印刷専用CSSの最適化</li>
												<li>ステータス表示の視覚的改善</li>
											</ul>
										</div>
									</div>
									<p>
										<strong>「作り手の思い込みではなく、実際に使う人の声」</strong>
										の大切さを、この時に痛感しました。
									</p>
								</div>
							</div>
						</div>

						{/* Chapter 5: 「シンプル」の追求 */}
						<div className="relative flex items-start gap-6">
							<div className="relative z-10 w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
								<span className="text-2xl">✨</span>
							</div>
							<div className="flex-1 bg-purple-50 border border-purple-100 rounded-xl p-6">
								<h3 className="text-lg font-semibold text-purple-900 mb-3">
									Chapter 5: 機能を削る勇気
								</h3>
								<div className="text-purple-800 leading-relaxed space-y-3">
									<p>
										開発を進める中で気づいたのは、
										<strong>「機能を追加することより、不要な機能を削ることの方が難しい」</strong>
										ということでした。
									</p>
									<p>
										悲しみの中にいる方が、複雑な操作で混乱することは絶対に避けたい。
										「必要なときに、必要な情報が、すぐに見つかる」を実現するため、
										UIの試行錯誤を何度も重ねました。
									</p>
									<div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
										<h4 className="font-semibold mb-2">シンプル設計の原則：</h4>
										<ul className="list-disc list-inside space-y-1 text-sm">
											<li>3クリック以内で目的の操作ができる</li>
											<li>専門用語を使わない、分かりやすい表現</li>
											<li>エラーが起きにくい、直感的な操作</li>
											<li>スマートフォンでもストレスなく使える</li>
										</ul>
									</div>
								</div>
							</div>
						</div>

						{/* Chapter 6: 現在も続く改善 */}
						<div className="relative flex items-start gap-6">
							<div className="relative z-10 w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
								<span className="text-2xl">🌱</span>
							</div>
							<div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-6">
								<h3 className="text-lg font-semibold text-green-900 mb-3">
									Chapter 6: ユーザーと一緒に成長するアプリ
								</h3>
								<div className="text-green-800 leading-relaxed space-y-3">
									<p>
										リリース後、多くの方からご利用いただく中で、
										心温まるメッセージをいただくことがあります。
									</p>
									<div className="bg-green-100 border border-green-200 rounded-lg p-4 italic">
										<p className="text-sm">
											「おかげで返礼品の手配がスムーズにできました。大変な時期に、
											こんなに使いやすいツールがあって本当に助かりました。」
										</p>
									</div>
									<p>
										<strong>個人開発だからこそできること</strong>があります。
										大企業のようにたくさんの機能は追加できませんが、
										本当に必要な改善を素早く対応することができる。
										ユーザーの声にしっかりと耳を傾け、一つひとつ丁寧に対応していく。
									</p>
									<p>
										<strong>「大切な人への感謝の気持ちを、きちんと形にしたい」</strong>
										そんな皆さまの想いをサポートし続けること。
										それが、このアプリの存在意義だと思っています。
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
