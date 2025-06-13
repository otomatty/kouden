// library
import { useFormContext } from "react-hook-form";
// ui
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
// types
import type { Entry } from "@/types/entries";
import type { OfferingFormValues } from "@/types/offerings";
import { SearchableCheckboxList } from "@/components/ui/searchable-checkbox-list";

interface OfferingFormBasicProps {
	entries: Entry[];
}

export function OfferingFormBasic({ entries }: OfferingFormBasicProps) {
	const form = useFormContext<OfferingFormValues>();

	return (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="provider_name"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>提供者名</FormLabel>
						<FormControl>
							<Input placeholder="例：山田太郎" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="type"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>種類</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="種類を選択" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="FLOWER">供花</SelectItem>
								<SelectItem value="FOOD">供物</SelectItem>
								<SelectItem value="OTHER">その他</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="kouden_entry_ids"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>香典情報</FormLabel>
						<FormControl>
							<SearchableCheckboxList
								items={entries.map((entry) => ({
									value: entry.id,
									label: entry.name || entry.organization || "名前なし",
								}))}
								selectedItems={field.value}
								onSelectionChange={field.onChange}
								searchPlaceholder="香典情報を検索..."
								className="w-full"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>内容</FormLabel>
						<FormControl>
							<Input
								placeholder="例：胡蝶蘭"
								{...field}
								value={field.value || ""}
								onChange={(e) => {
									const value = e.target.value;
									field.onChange(value === "" ? null : value);
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="price"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>金額</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={0}
								max={9999999}
								placeholder="例：10000"
								{...field}
								value={field.value || ""}
								onChange={(e) => {
									const value = e.target.value;
									field.onChange(value === "" ? null : Number(value));
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
