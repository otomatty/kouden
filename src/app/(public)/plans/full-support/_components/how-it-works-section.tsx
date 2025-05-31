export default function HowItWorksSection() {
	return (
		<section className="mb-12 md:mb-16">
			<h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">サポートの進め方</h2>
			<ol className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gray-200 before:self-start before:dark:bg-gray-700">
				<li className="relative flex items-start">
					<span className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-primary font-semibold">
						1
					</span>
					<div className="ml-16 space-y-2">
						<h4 className="text-lg font-semibold">事前準備</h4>
						<p className="text-sm text-muted-foreground">
							ユーザー様は事前に香典袋や芳名帳をご準備ください。可能であればアプリのインストールとアカウント作成をお願いします（サポート時の実施も可）。オンラインビデオ通話ツール（Zoom,
							Google Meetなど）をご案内します。
						</p>
					</div>
				</li>
				<li className="relative flex items-start">
					<span className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-primary font-semibold">
						2
					</span>
					<div className="ml-16 space-y-2">
						<h4 className="text-lg font-semibold">サポート当日</h4>
						<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
							<li>簡単なヒアリング（香典の件数、現在の状況、特に困っている点など）。</li>
							<li>アプリの基本的な使い方、AI入力機能のデモンストレーション。</li>
							<li>
								共同入力（画面共有でのアドバイス、または一時的な情報共有による入力例の提示）。
							</li>
							<li>随時、疑問点に回答。</li>
							<li>入力データ全体の確認、集計機能やエクスポート機能の説明。</li>
						</ul>
					</div>
				</li>
				<li className="relative flex items-start">
					<span className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-primary font-semibold">
						3
					</span>
					<div className="ml-16 space-y-2">
						<h4 className="text-lg font-semibold">終了後</h4>
						<p className="text-sm text-muted-foreground">
							簡単なまとめや、今後のアプリ活用方法についてのアドバイスをいたします。
						</p>
					</div>
				</li>
			</ol>
		</section>
	);
}
