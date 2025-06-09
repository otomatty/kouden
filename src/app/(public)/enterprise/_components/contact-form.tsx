"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * お問い合わせ / 資料請求セクション
 */
export function ContactForm() {
	return (
		<section id="contact-form" className="container mx-auto px-4 pb-16">
			<h2 className="text-2xl font-semibold text-center mb-8">お問い合わせ / 資料請求</h2>
			<form className="max-w-md mx-auto bg-white p-6 rounded-lg shadow grid gap-4">
				<div>
					<Label htmlFor="email">メールアドレス</Label>
					<Input id="email" type="email" placeholder="example@example.com" className="mt-1" />
				</div>
				<div>
					<Label htmlFor="partnership">ご関心のあるパートナーシップ</Label>
					<Select>
						<SelectTrigger id="partnership" className="w-full mt-1">
							<SelectValue placeholder="選択してください" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>プログラム</SelectLabel>
								<SelectItem value="customer-support">カスタマーサポート・パートナー</SelectItem>
								<SelectItem value="solution">ソリューション・パートナー</SelectItem>
								<SelectItem value="business-development">
									ビジネスデベロップメント・パートナー
								</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<Button type="submit" variant="default">
					資料をダウンロード
				</Button>
			</form>
		</section>
	);
}
