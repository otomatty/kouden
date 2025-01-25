import { useAtom } from "jotai";
import {
	telegramSortStateAtom,
	type TelegramSortState,
	type Telegram,
} from "@/atoms/telegrams";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Button } from "@/components/ui/button";

const sortOptions: { value: keyof Telegram; label: string }[] = [
	{ value: "senderName", label: "送信者名" },
	{ value: "senderOrganization", label: "所属" },
	{ value: "senderPosition", label: "役職" },
	{ value: "createdAt", label: "作成日時" },
];

export function TelegramSort() {
	const [sortState, setSortState] = useAtom(telegramSortStateAtom);

	const toggleDirection = () => {
		setSortState((prev) => ({
			...prev,
			direction: prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	return (
		<div className="flex items-center gap-2">
			<Select
				value={sortState.field}
				onValueChange={(value) =>
					setSortState((prev) => ({
						...prev,
						field: value as keyof Telegram,
					}))
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="並び替え" />
				</SelectTrigger>
				<SelectContent>
					{sortOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				variant="outline"
				size="icon"
				onClick={toggleDirection}
				className="h-10 w-10"
			>
				{sortState.direction === "asc" ? (
					<ArrowUpAZ className="h-4 w-4" />
				) : (
					<ArrowDownAZ className="h-4 w-4" />
				)}
			</Button>
		</div>
	);
}
