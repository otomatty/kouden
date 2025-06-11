"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TypeOption {
	id: string;
	name: string;
}
interface Props {
	types: TypeOption[];
}
type FormValues = { name: string; typeId: string };

export default function OrganizationRequestForm({ types }: Props) {
	const router = useRouter();
	const form = useForm<FormValues>({ defaultValues: { name: "", typeId: types[0]?.id || "" } });

	async function onSubmit(data: FormValues) {
		const res = await fetch("/api/organizations/request", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			console.error("Request failed", await res.json());
			return;
		}
		router.push("/organizations/request/success");
	}

	return (
		<Form {...form}>
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>法人アカウント申請</CardTitle>
					<CardDescription>必要事項を入力して申請してください</CardDescription>
				</CardHeader>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>組織名</FormLabel>
								<FormControl>
									<Input placeholder="組織名を入力" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="typeId"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>種別</FormLabel>
								<FormControl>
									<Select defaultValue={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="種別を選択" />
										</SelectTrigger>
										<SelectContent>
											{types.map((t) => (
												<SelectItem key={t.id} value={t.id}>
													{t.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full">
						リクエスト送信
					</Button>
				</form>
			</Card>
		</Form>
	);
}
