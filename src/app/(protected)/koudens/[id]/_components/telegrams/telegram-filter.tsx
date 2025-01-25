import { useAtom } from "jotai";
import { telegramFilterTextAtom } from "@/atoms/telegrams";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function TelegramFilter() {
	const [filterText, setFilterText] = useAtom(telegramFilterTextAtom);

	return (
		<div className="relative">
			<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder="送信者名、所属、役職、メッセージで検索"
				value={filterText}
				onChange={(e) => setFilterText(e.target.value)}
				className="pl-8"
			/>
		</div>
	);
}
