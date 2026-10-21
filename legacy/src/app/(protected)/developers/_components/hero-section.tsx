export function HeroSection() {
	return (
		<div className="text-center space-y-6 py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl border">
			<div className="space-y-4">
				<div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
					<span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
					個人開発プロジェクト
				</div>
				<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					香典帳
				</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					大切な方をお見送りする際の香典管理を、
					<br />
					少しでも楽にしたいという想いから生まれた
					<br />
					<strong className="text-foreground">一人の開発者による手作りアプリ</strong>
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto pt-8">
				<div className="text-center">
					<div className="text-2xl font-bold text-blue-600">1人</div>
					<div className="text-sm text-muted-foreground">開発者</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-purple-600">6ヶ月</div>
					<div className="text-sm text-muted-foreground">開発期間</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-green-600">24時間</div>
					<div className="text-sm text-muted-foreground">サポート対応</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-orange-600">100%</div>
					<div className="text-sm text-muted-foreground">想いを込めて</div>
				</div>
			</div>
		</div>
	);
}
