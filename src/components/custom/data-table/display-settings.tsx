import * as React from "react";
import { useAtomValue } from "jotai";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { userAtom } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ListFilter } from "lucide-react";

export interface MemberOption {
	value: string;
	label: string;
}

interface DisplaySettingsProps {
	viewScope: "own" | "all" | "others";
	onViewScopeChange: (scope: "own" | "all" | "others") => void;
	members: MemberOption[];
	selectedMemberIds: string[];
	onMemberSelectionChange: (selectedIds: string[]) => void;
}

/**
 * 独自実装のドロップダウンメニューです。
 * 表示対象のタグとメンバー選択のチェックボックスを提供します。
 */
export function DisplaySettings({
	viewScope,
	onViewScopeChange,
	members,
	selectedMemberIds,
	onMemberSelectionChange,
}: DisplaySettingsProps) {
	const currentUser = useAtomValue(userAtom);
	const currentUserId = currentUser?.id ?? "";
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = React.useState(false);
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	// ドロップダウン外クリックで閉じる
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleScopeChange = (scope: "own" | "all" | "others") => {
		onViewScopeChange(scope);
		let newSelected: string[] = [];
		switch (scope) {
			case "all":
				newSelected = members.map((m) => m.value);
				break;
			case "own":
				newSelected = currentUserId ? [currentUserId] : [];
				break;
			case "others":
				newSelected = members.filter((m) => m.value !== currentUserId).map((m) => m.value);
				break;
		}
		onMemberSelectionChange(newSelected);
		// Update URL query for server-side filtering and preserve view scope
		const params = new URLSearchParams(searchParams.toString());
		params.set("viewScope", scope);
		if (newSelected.length > 0) {
			params.set("memberIds", newSelected.join(","));
		} else {
			params.delete("memberIds");
		}
		// Reset to first page when filters change
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="relative inline-block text-left" ref={dropdownRef}>
			<Button variant="outline" onClick={() => setIsOpen((prev) => !prev)}>
				<ListFilter className="h-4 w-4" />
				表示設定
			</Button>
			{isOpen && (
				<div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4">
					<div>
						<div className="mb-2 text-sm font-semibold">表示対象</div>
						<div className="flex flex-wrap gap-2">
							{(["all", "own", "others"] as const).map((scope) => {
								const label = scope === "all" ? "全員" : scope === "own" ? "自分のみ" : "自分以外";
								return (
									<button
										key={scope}
										type="button"
										onClick={() => handleScopeChange(scope)}
										className={`cursor-pointer px-2 py-1 rounded-full text-sm ${
											viewScope === scope
												? "bg-primary text-primary-foreground"
												: "bg-secondary text-secondary-foreground"
										}`}
									>
										{label}
									</button>
								);
							})}
						</div>
					</div>
					<div className="mt-4">
						<div className="mb-2 text-sm font-semibold">メンバー</div>
						<div className="space-y-2 max-h-48 overflow-y-auto">
							{members.map((member) => (
								<div key={member.value} className="flex items-center gap-2">
									<Checkbox
										checked={selectedMemberIds.includes(member.value)}
										onCheckedChange={(checked) => {
											const newSelected = checked
												? [...selectedMemberIds, member.value]
												: selectedMemberIds.filter((id) => id !== member.value);
											onMemberSelectionChange(newSelected);
											// Update URL query for server-side filtering
											const params = new URLSearchParams(searchParams.toString());
											if (newSelected.length > 0) {
												params.set("memberIds", newSelected.join(","));
											} else {
												params.delete("memberIds");
											}
											// Reset to first page when filters change
											params.set("page", "1");
											router.push(`${pathname}?${params.toString()}`);
										}}
									/>
									<span className="text-sm">{member.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
