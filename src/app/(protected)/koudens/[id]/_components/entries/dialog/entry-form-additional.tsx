"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Relationship } from "@/types/relationships";

interface EntryFormAdditionalProps {
	relationships: Relationship[];
}

export function EntryFormAdditional({ relationships }: EntryFormAdditionalProps) {
	const form = useFormContext();

	return (
		<div className="grid gap-4">
			<FormField
				control={form.control}
				name="phone_number"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>電話番号</FormLabel>
						<FormControl>
							<Input placeholder="000-0000-0000" {...field} value={field.value || ""} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="relationship_id"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>ご関係</FormLabel>
						<Select
							onValueChange={(value) => field.onChange(value === "none" ? null : value)}
							value={field.value || "none"}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="関係性を選択" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="none">未選択</SelectItem>
								{relationships?.map((relationship) => (
									<SelectItem key={relationship.id} value={relationship.id}>
										{relationship.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="has_offering"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>供物</FormLabel>
						<Select
							onValueChange={(value) => field.onChange(value === "true")}
							value={String(field.value)}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="true">あり</SelectItem>
								<SelectItem value="false">なし</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="is_return_completed"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>返礼</FormLabel>
						<Select
							onValueChange={(value) => field.onChange(value === "true")}
							value={String(field.value)}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="true">完了</SelectItem>
								<SelectItem value="false">未完了</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="notes"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>備考</FormLabel>
						<FormControl>
							<Input {...field} value={field.value || ""} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
