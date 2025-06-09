import type { Metadata } from "next";
import { PageHero } from "../_components/page-hero";
import { Heading } from "@/components/ui/heading";

export const metadata: Metadata = {
	title: "プライバシーポリシー | 香典帳",
	description: "香典帳アプリのプライバシーポリシーについて",
};

export default function PrivacyPage() {
	return (
		<div className="space-y-8 mb-24">
			<PageHero
				title="プライバシーポリシー"
				subtitle="香典帳アプリのプライバシーポリシーについて"
				className="bg-background"
			/>
			<section className="container mx-auto py-8 px-4">
				<article className="prose prose-lg prose-gray">
					<Heading level={2}>1. 個人情報の定義</Heading>
					<p>
						本ポリシーにおける「個人情報」とは、生存する個人に関する情報であって、氏名、メールアドレスなど特定の個人を識別できるものを指します。
					</p>

					<Heading level={2}>2. 個人情報の収集方法</Heading>
					<p>
						当社は、ユーザーが本サービスの利用登録やお問い合わせの際に、氏名、メールアドレスなどの情報を収集します。
					</p>

					<Heading level={2}>3. 個人情報の利用目的</Heading>
					<ul className="list-disc list-inside space-y-2 mt-2 mb-4 text-muted-foreground">
						<li>本サービスの提供・運営のため</li>
						<li>新機能、更新情報、お知らせの配信のため</li>
						<li>お問い合わせ対応のため</li>
					</ul>

					<Heading level={2}>4. 個人情報の第三者提供</Heading>
					<p>当社は、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供しません。</p>

					<Heading level={2}>5. 個人情報の開示・訂正・削除</Heading>
					<p>
						ユーザーは当社に対し、自己の個人情報の開示、訂正、追加または削除を請求することができます。請求は
						<a href="mailto:saedgewell@gmail.com">saedgewell@gmail.com</a>までご連絡ください。
					</p>

					<Heading level={2}>6. 個人情報の安全管理措置</Heading>
					<p>
						当社は、個人情報の漏えい、滅失、毀損を防止するため、必要かつ適切な安全管理措置を講じます。
					</p>

					<Heading level={2}>7. クッキー（Cookie）の使用について</Heading>
					<p>
						当社は、ユーザーの利便性向上およびサイト利用状況の分析のためクッキーを使用します。ブラウザの設定によりクッキーの拒否が可能ですが、一部機能が利用できなくなる場合があります。
					</p>

					<Heading level={2}>8. 本ポリシーの変更</Heading>
					<p>
						本ポリシーは予告なく変更されることがあり、変更後のポリシーは本ページに掲載した時点で効力を生じます。
					</p>

					<Heading level={2}>9. お問い合わせ</Heading>
					<p>
						本ポリシーに関するお問い合わせは、
						<a href="mailto:saedgewell@gmail.com">saedgewell@gmail.com</a>までご連絡ください。
					</p>

					<Heading level={2}>10. 個人情報の委託</Heading>
					<p>
						当社は、本サービスの提供に必要な範囲内で、業務委託先に個人情報を委託することがあります。この場合、委託先との間で機密保持契約を締結し、適切に監督します。
					</p>

					<Heading level={2}>11. SSL/TLS</Heading>
					<p>当社は、個人情報保護のため通信を暗号化し、SSL/TLSを使用しています。</p>

					<Heading level={2}>12. アクセスログの取得</Heading>
					<p>
						当社は、サービス改善のためアクセスログを取得・分析します。ただし、個人を特定できる情報は収集しません。
					</p>

					<Heading level={2}>13. クッキー設定の管理</Heading>
					<p>
						ユーザーはブラウザの設定でクッキーの許可・拒否を選択できます。ただし、拒否した場合は一部機能が利用できなくなる可能性があります。
					</p>
				</article>
			</section>
		</div>
	);
}
