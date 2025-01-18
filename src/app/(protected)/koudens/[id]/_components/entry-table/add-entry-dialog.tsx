import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { KoudenEntry } from "@/types/kouden";
import { PlusCircle } from "lucide-react";
import {
	formatCurrency,
	formatInputCurrency,
	formatInputPhoneNumber,
	formatInputPostalCode,
	searchAddress,
} from "./utils";
import { useToast } from "@/hooks/use-toast";

const attendanceTypeMap = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

interface AddEntryDialogProps {
	onAddEntry: (entry: Omit<KoudenEntry, "id">) => void;
}

export function AddEntryDialog({ onAddEntry }: AddEntryDialogProps) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const [formData, setFormData] = useState<Partial<KoudenEntry>>({
		attendance_type: "FUNERAL",
		has_offering: false,
		is_return_completed: false,
		amount: 0,
	});
	const [isSearchingAddress, setIsSearchingAddress] = useState(false);
	const [formHistory, setFormHistory] = useState<Partial<KoudenEntry>[]>([]);

	// 郵便番号から住所を検索
	const handlePostalCodeChange = async (value: string) => {
		const formattedValue = formatInputPostalCode(value);
		setFormData((prev) => ({ ...prev, postal_code: formattedValue }));

		const numbers = formattedValue.replace(/[^\d]/g, "");
		if (numbers.length === 7) {
			setIsSearchingAddress(true);
			const result = await searchAddress(numbers);
			setIsSearchingAddress(false);

			if (result) {
				setFormData((prev) => ({ ...prev, address: result.address }));
				toast({
					title: "住所を自動入力しました",
					description: result.address,
				});
			}
		}
	};

	// 電話番号のフォーマット
	const handlePhoneNumberChange = (value: string) => {
		const formattedValue = formatInputPhoneNumber(value);
		setFormData((prev) => ({ ...prev, phone_number: formattedValue }));
	};

	// 金額のフォーマット
	const handleAmountChange = (value: string) => {
		const numericValue = Number(value.replace(/[^\d]/g, ""));
		setFormData((prev) => ({ ...prev, amount: numericValue }));
	};

	// ショートカットキーの処理
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "Enter") {
				setOpen(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// バリデーション
		if (!formData.name?.trim()) {
			toast({
				title: "入力エラー",
				description: "ご芳名は必須項目です",
				variant: "destructive",
			});
			return;
		}

		if (!formData.address?.trim()) {
			toast({
				title: "入力エラー",
				description: "住所は必須項目です",
				variant: "destructive",
			});
			return;
		}

		if (
			formData.postal_code &&
			formData.postal_code.replace(/[^\d]/g, "").length !== 7
		) {
			toast({
				title: "入力エラー",
				description: "郵便番号は7桁で入力してください",
				variant: "destructive",
			});
			return;
		}

		if (
			formData.phone_number &&
			!/^\d{10,11}$/.test(formData.phone_number.replace(/[^\d]/g, ""))
		) {
			toast({
				title: "入力エラー",
				description: "電話番号は10桁または11桁で入力してください",
				variant: "destructive",
			});
			return;
		}

		// 入力履歴を保存（最大10件）
		setFormHistory((prev) => [formData, ...prev].slice(0, 10));

		onAddEntry(formData as Omit<KoudenEntry, "id">);
		setFormData({
			attendance_type: "FUNERAL",
			has_offering: false,
			is_return_completed: false,
			amount: 0,
		});
		setOpen(false);

		toast({
			title: "保存しました",
			description: "新しい香典記録を追加しました",
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="kouden-entry-add flex items-center gap-2">
					<PlusCircle className="h-4 w-4" />
					<span>行を追加 (Ctrl+Enter)</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>新規香典記録</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="name">ご芳名 *</Label>
							<Input
								id="name"
								value={formData.name || ""}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="organization">団体名</Label>
							<Input
								id="organization"
								value={formData.organization || ""}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										organization: e.target.value,
									}))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="position">役職</Label>
							<Input
								id="position"
								value={formData.position || ""}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, position: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="amount">金額</Label>
							<Input
								id="amount"
								type="text"
								inputMode="numeric"
								value={
									formData.amount ? formatInputCurrency(formData.amount) : ""
								}
								onChange={(e) => handleAmountChange(e.target.value)}
								className="text-right"
							/>
							{(formData.amount ?? 0) > 0 && (
								<div className="text-sm text-muted-foreground text-right">
									{formatCurrency(formData.amount ?? 0)}
								</div>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="postal_code">
								郵便番号
								{isSearchingAddress && (
									<span className="ml-2 text-muted-foreground">
										(検索中...)
									</span>
								)}
							</Label>
							<Input
								id="postal_code"
								value={formData.postal_code || ""}
								onChange={(e) => handlePostalCodeChange(e.target.value)}
								placeholder="000-0000"
								inputMode="numeric"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="phone_number">電話番号</Label>
							<Input
								id="phone_number"
								value={formData.phone_number || ""}
								onChange={(e) => handlePhoneNumberChange(e.target.value)}
								placeholder="000-0000-0000"
								inputMode="numeric"
							/>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="address">住所 *</Label>
						<Input
							id="address"
							value={formData.address || ""}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, address: e.target.value }))
							}
							required
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="relationship_id">ご関係</Label>
							<Input
								id="relationship_id"
								value={formData.relationship_id || ""}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										relationship_id: e.target.value,
									}))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="attendance_type">参列</Label>
							<Select
								value={formData.attendance_type}
								onValueChange={(value: KoudenEntry["attendance_type"]) =>
									setFormData((prev) => ({ ...prev, attendance_type: value }))
								}
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
						</div>
						<div className="grid gap-2">
							<Label htmlFor="has_offering">供物</Label>
							<Select
								value={String(formData.has_offering)}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										has_offering: value === "true",
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="true">あり</SelectItem>
									<SelectItem value="false">なし</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="is_return_completed">返礼</Label>
							<Select
								value={String(formData.is_return_completed)}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										is_return_completed: value === "true",
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="true">完了</SelectItem>
									<SelectItem value="false">未完了</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="notes">備考</Label>
						<Input
							id="notes"
							value={formData.notes || ""}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, notes: e.target.value }))
							}
						/>
					</div>
					<DialogFooter>
						<Button type="submit">保存</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
