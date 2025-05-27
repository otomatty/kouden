"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useSetAtom } from "jotai";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatInputCurrency } from "@/utils/currency";
import { formatPostalCode, searchAddress } from "./entry-form";
import { addressSearchStateAtom } from "@/store/entries";

export function EntryFormBasic() {
	const form = useFormContext();
	const setAddressSearchState = useSetAtom(addressSearchStateAtom);

	// 郵便番号が変更されたら住所を自動入力
	useEffect(() => {
		const fetchAddress = async () => {
			const postalCode = form.getValues("postal_code");
			const address = form.getValues("address");

			// 住所が既に入力されている場合は検索しない
			if (address) return;

			// 7桁の数字のみの場合に検索
			if (postalCode?.replace(/[^\d]/g, "").length === 7) {
				setAddressSearchState({ isSearching: true, error: null });
				try {
					const newAddress = await searchAddress(postalCode);
					if (newAddress) {
						form.setValue("address", newAddress);
						toast({
							title: "住所を自動入力しました",
							description: newAddress,
						});
					} else {
						toast({
							title: "住所が見つかりませんでした",
							description: "郵便番号を確認してください",
						});
					}
				} catch (error: unknown) {
					console.error("住所検索中にエラーが発生しました:", error);
					setAddressSearchState({
						isSearching: false,
						error: "住所の検索に失敗しました。しばらく時間をおいて再度お試しください。",
					});
				} finally {
					setAddressSearchState({ isSearching: false, error: null });
				}
			}
		};
		fetchAddress();
	}, [form, setAddressSearchState]);

	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="organization"
					render={({ field }) => (
						<FormItem>
							<FormLabel optional>団体名</FormLabel>
							<FormControl>
								<Input placeholder="例：株式会社〇〇" {...field} value={field.value || ""} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="position"
					render={({ field }) => (
						<FormItem>
							<FormLabel optional>役職</FormLabel>
							<FormControl>
								<Input placeholder="例：代表取締役" {...field} value={field.value || ""} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>ご芳名</FormLabel>
						<FormControl>
							<Input placeholder="例：山田太郎" {...field} value={field.value || ""} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="postalCode"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>郵便番号</FormLabel>
						<FormControl>
							<Input
								placeholder="000-0000"
								{...field}
								value={field.value || ""}
								onChange={async (e) => {
									const formatted = formatPostalCode(e.target.value);
									field.onChange(formatted);

									if (formatted.length === 8) {
										const address = await searchAddress(formatted);
										if (address) {
											form.setValue("address", address);
										}
									}
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="address"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>住所</FormLabel>
						<FormControl>
							<Input
								placeholder="例：東京都千代田区永田町1-7-1"
								{...field}
								value={field.value || ""}
								onChange={(e) => field.onChange(e.target.value)}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="amount"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>金額</FormLabel>
						<FormControl>
							<Input
								type="text"
								inputMode="numeric"
								className="text-right"
								{...field}
								value={formatInputCurrency(field.value || 0)}
								onChange={(e) => {
									const value = Number(e.target.value.replace(/[^\d]/g, ""));
									field.onChange(value);
								}}
							/>
						</FormControl>
						{field.value > 0 && (
							<div className="text-sm text-muted-foreground text-right">
								{formatCurrency(field.value)}
							</div>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
