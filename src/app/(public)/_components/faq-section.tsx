"use client";

import type * as React from "react";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { SectionTitle } from "@/components/ui/section-title";

interface FAQ {
	id: string;
	question: string;
	answer: string | React.ReactNode;
}

const defaultFaqs: FAQ[] = [
	{
		id: "faq-1",
		question: "無料プランの利用制限はありますか？",
		answer:
			"無料プランでも基本的な機能は利用可能ですが、1ヶ月あたりの記録数に制限があります。また、サポートはメールのみとなります。",
	},
	{
		id: "faq-2",
		question: "データのエクスポートはできますか？",
		answer:
			"はい、CSV形式でデータをエクスポート可能です。画面右上のエクスポートボタンから操作してください。",
	},
	{
		id: "faq-3",
		question: "複数ユーザーで共有できますか？",
		answer:
			"チームプランでは、複数ユーザーでの共有と権限管理が利用できます。プラン詳細をご確認ください。",
	},
];

/**
 * FAQセクションのプロパティ
 * faqsを渡すことでページごとに質問事項を変更可能
 */
export interface FAQSectionProps {
	faqs?: FAQ[];
}

export function FAQSection({ faqs = defaultFaqs }: FAQSectionProps) {
	return (
		<section className="py-64 bg-white dark:bg-gray-800">
			<div className="container px-4 md:px-6 mx-auto">
				<SectionTitle
					title="よくある質問"
					subtitle="ご不明点はこちらをご覧ください"
					className="mb-16"
				/>
				<Accordion type="single" collapsible className="space-y-4">
					{faqs.map((faq) => (
						<AccordionItem key={faq.id} value={faq.id}>
							<AccordionTrigger>{faq.question}</AccordionTrigger>
							<AccordionContent>
								<p className="text-gray-500 dark:text-gray-400">{faq.answer}</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
