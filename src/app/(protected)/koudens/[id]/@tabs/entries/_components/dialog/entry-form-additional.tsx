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
import type { AttendanceType } from "@/types/entries";

const attendanceTypeMap: Record<AttendanceType, string> = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "香典のみ",
} as const;

interface EntryFormAdditionalProps {
	relationships: Relationship[];
}

export function EntryFormAdditional({ relationships }: EntryFormAdditionalProps) {
	const form = useFormContext();

	return (
		<div className="grid gap-4">
			<FormField
				control={form.control}
				name="attendanceType"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>参列</FormLabel>
						<FormControl>
							<Select
								value={field.value || "FUNERAL"}
								onValueChange={(value: AttendanceType) => field.onChange(value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(attendanceTypeMap).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="phoneNumber"
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
				name="relationshipId"
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
