"use client";

import { LifeBuoy, User, Bug, Lightbulb, Briefcase, MoreHorizontal, Check } from "lucide-react";

export default function CategorySelect({
	value,
	onChange,
}: { value: string; onChange: (value: string) => void }) {
	const options = [
		{
			value: "support",
			label: "サポート",
			description: "製品やサービスの使い方や問題解決をサポート",
			icon: LifeBuoy,
			examples: [
				"操作方法がわからないとき",
				"エラーが出てどうすればよいかわからないとき",
				"機能の使い方を知りたいとき",
			],
		},
		{
			value: "account",
			label: "アカウント関連",
			description: "ログインやアカウント情報の管理に関するサポート",
			icon: User,
			examples: [
				"ログインできないとき",
				"パスワードを忘れて困ったとき",
				"名前やメールアドレスを変えたいとき",
			],
		},
		{
			value: "bug",
			label: "バグ報告",
			description: "アプリが正しく動かない現象の報告",
			icon: Bug,
			examples: [
				"画面が固まって動かないとき",
				"ボタンを押しても反応しないとき",
				"入力内容が保存されないとき",
			],
		},
		{
			value: "feature",
			label: "機能要望",
			description: "こんな機能があったら便利、という提案",
			icon: Lightbulb,
			examples: [
				"夜でも見やすいダークモードが欲しいとき",
				"データを一覧で保存・印刷したいとき",
				"英語でも操作したいとき",
			],
		},
		{
			value: "business",
			label: "法人問い合わせ",
			description: "会社向けの契約や請求などに関するご相談",
			icon: Briefcase,
			examples: [
				"会社で使うプランの見積もりが欲しいとき",
				"請求書を発行してほしいとき",
				"複数アカウント契約を検討しているとき",
			],
		},
		{
			value: "other",
			label: "その他",
			description: "上記以外のご質問やご意見など",
			icon: MoreHorizontal,
			examples: [
				"その他に知りたいことがあるとき",
				"サービスの感想や意見を伝えたいとき",
				"困りごと全般を相談したいとき",
			],
		},
	];

	return (
		<div className="grid grid-cols-2 gap-4">
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onChange(opt.value)}
					className={`relative p-4 rounded-lg bg-background text-left transition ${
						value === opt.value ? "border-2 border-primary" : "border border-muted hover:shadow-sm"
					}`}
				>
					<div className="flex items-center space-x-2 mb-2">
						<opt.icon
							className={`w-6 h-6 ${value === opt.value ? "text-primary" : "text-muted-foreground"}`}
						/>
						<span
							className={`font-semibold ${value === opt.value ? "text-primary" : "text-foreground"}`}
						>
							{opt.label}
						</span>
					</div>
					<p className="text-base text-muted-foreground">{opt.description}</p>
					<ul className="list-disc list-inside text-sm text-muted-foreground mt-2 mb-2">
						{opt.examples.map((ex) => (
							<li key={ex}>{ex}</li>
						))}
					</ul>
					{value === opt.value && <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />}
				</button>
			))}
		</div>
	);
}
