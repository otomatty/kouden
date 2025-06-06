// library
import { useFormContext } from "react-hook-form";
// ui
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// types
import type { OfferingFormValues } from "@/types/offerings";
// components
import { OfferingPhotoUploader } from "./offering-photo-uploader";

interface OfferingFormAdditionalProps {
	defaultValues?: boolean;
	onPhotosChange?: (photos: File[]) => void;
}

export function OfferingFormAdditional({
	defaultValues,
	onPhotosChange,
}: OfferingFormAdditionalProps) {
	const form = useFormContext<OfferingFormValues>();

	return (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="quantity"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>数量</FormLabel>
						<FormControl>
							<Input type="number" min={1} max={999} {...field} />
						</FormControl>
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
							<Textarea
								placeholder="備考を入力"
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
			{!defaultValues && onPhotosChange && (
				<div>
					<Label>写真（任意）</Label>
					<OfferingPhotoUploader onPhotosChange={onPhotosChange} />
				</div>
			)}
		</div>
	);
}
