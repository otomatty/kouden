import type { Metadata } from "next";
import { PageHero } from "../_components/page-hero";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
	title: "利用規約 | 香典帳",
	description: "香典帳アプリの利用規約について",
};

export default function TermsPage() {
	return (
		<div className="space-y-8 mb-24">
			<PageHero
				title="利用規約"
				subtitle="香典帳アプリの利用規約について"
				className="bg-background"
			/>
			<Section className="py-8 px-4">
				<article className="prose prose-lg prose-gray">
					<Heading level={2}>第1条（適用）</Heading>
					<p>
						本規約は、本サービスの利用条件を定めるものであり、ユーザーは本規約に同意した上で本サービスを利用するものとします。
					</p>

					<Heading level={2}>第2条（利用登録）</Heading>
					<p>
						利用希望者が当社所定の方法で利用登録を申請し、当社がこれを承認することで登録完了となります。
					</p>

					<Heading level={2}>第3条（ユーザーIDおよびパスワードの管理）</Heading>
					<p>
						ユーザーは自己の責任においてユーザーIDおよびパスワードを適切に管理するものとし、第三者による不正使用などの損害について当社は一切の責任を負いません。
					</p>

					<Heading level={2}>第4条（禁止事項）</Heading>
					<ul className="list-disc list-inside space-y-2 mt-2 mb-4 text-muted-foreground">
						<li>法令または公序良俗に違反する行為</li>
						<li>犯罪行為に関連する行為</li>
						<li>本サービスの運営を妨害する行為</li>
						<li>他のユーザーや第三者の権利を侵害する行為</li>
					</ul>

					<Heading level={2}>第5条（サービス提供の停止等）</Heading>
					<p>
						当社は以下の場合に事前の通知なくサービスを停止または中断することがあります:
						システム保守点検、障害、天災地変など。
					</p>

					<Heading level={2}>第6条（免責事項）</Heading>
					<p>
						当社は本サービスに起因してユーザーに生じた損害について、一切の責任を負わないものとします。
					</p>

					<Heading level={2}>第7条（規約の変更）</Heading>
					<p>
						当社は本規約を変更できるものとし、変更後の規約は本サイト上に表示した時点で効力を生じます。
					</p>

					<Heading level={2}>第8条（準拠法・裁判管轄）</Heading>
					<p>
						本規約の解釈には日本法を適用し、本サービスに関して紛争が生じた場合には東京地方裁判所を専属的合意管轄とします。
					</p>

					<Heading level={2}>お問い合わせ</Heading>
					<p>
						本規約に関するお問い合わせは、
						<a href="mailto:saedgewell@gmail.com">saedgewell@gmail.com</a>までご連絡ください。
					</p>

					<Heading level={2}>第9条（知的財産権）</Heading>
					<p>
						本サービスに関する一切の権利（著作権、商標権等）は当社または当社にライセンスを許諾した第三者に帰属します。ユーザーは当社の許可なく、これらを複製、改変、頒布等してはなりません。
					</p>

					<Heading level={2}>第10条（利用停止等）</Heading>
					<ul className="list-disc list-inside space-y-2 mt-2 mb-4 text-muted-foreground">
						<li>本規約違反があった場合</li>
						<li>不正行為があった場合</li>
						<li>その他当社が利用者として不適切と判断した場合</li>
					</ul>

					<Heading level={2}>付則</Heading>
					<p>本規約は2025年6月1日から施行します。</p>
				</article>
			</Section>
		</div>
	);
}
