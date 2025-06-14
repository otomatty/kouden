"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { faqData } from "../_data";

/**
 * よくある質問データ。カテゴリごとに質問をまとめています。
 */
export interface FAQItem {
	id: string;
	question: string;
	answer: string;
}

export interface FAQCategory {
	category: string;
	items: FAQItem[];
}

export default function FAQClient() {
	const [search, setSearch] = useState("");
	const filteredData = useMemo(() => {
		if (!search) {
			return faqData;
		}
		const term = search.toLowerCase();
		return faqData
			.map(({ category, items }) => ({
				category,
				items: items.filter(
					({ question, answer }) =>
						question.toLowerCase().includes(term) || answer.toLowerCase().includes(term),
				),
			}))
			.filter(({ items }) => items.length > 0);
	}, [search]);

	const defaultTab = filteredData.length > 0 ? filteredData[0]?.category : "";

	return (
		<>
			<div className="flex justify-center mb-6">
				<input
					type="text"
					placeholder="質問を検索"
					className="mb-6 w-1/2 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>
			{filteredData.length === 0 ? (
				<p className="text-center text-gray-500">該当するQ&Aがありません。</p>
			) : (
				<Tabs defaultValue={defaultTab} className="space-y-4">
					<TabsList>
						{filteredData.map(({ category }) => (
							<TabsTrigger key={category} value={category}>
								{category}
							</TabsTrigger>
						))}
					</TabsList>
					{filteredData.map(({ category, items }) => (
						<TabsContent key={category} value={category}>
							<Accordion type="single" collapsible className="space-y-4">
								{items.map(({ id, question, answer }) => (
									<AccordionItem key={id} value={id}>
										<AccordionTrigger>{question}</AccordionTrigger>
										<AccordionContent>
											<p className="text-gray-500 dark:text-gray-400">{answer}</p>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</TabsContent>
					))}
				</Tabs>
			)}
		</>
	);
}
