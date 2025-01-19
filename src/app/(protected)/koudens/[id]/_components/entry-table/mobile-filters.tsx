import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Search,
	ArrowDownAZ,
	User,
	Building2,
	MapPin,
	BadgeIcon,
	CalendarClock,
	CalendarCheck,
	BanknoteIcon,
	Coins,
	SlidersHorizontal,
} from "lucide-react";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MobileFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
}

const searchOptions = [
	{
		value: "name",
		label: "ご芳名",
		icon: <User className="h-4 w-4" />,
		description: "参列者のお名前で検索",
	},
	{
		value: "address",
		label: "住所",
		icon: <MapPin className="h-4 w-4" />,
		description: "住所情報で検索",
	},
	{
		value: "organization",
		label: "団体名",
		icon: <Building2 className="h-4 w-4" />,
		description: "所属団体で検索",
	},
	{
		value: "position",
		label: "役職",
		icon: <BadgeIcon className="h-4 w-4" />,
		description: "役職名で検索",
	},
] as const;

const sortOptions = [
	{
		value: "created_at_desc",
		label: "新しい順",
		icon: <CalendarCheck className="h-4 w-4" />,
		description: "登録日時が新しい順",
	},
	{
		value: "created_at_asc",
		label: "古い順",
		icon: <CalendarClock className="h-4 w-4" />,
		description: "登録日時が古い順",
	},
	{
		value: "amount_desc",
		label: "金額が高い順",
		icon: <BanknoteIcon className="h-4 w-4" />,
		description: "香典金額が高い順",
	},
	{
		value: "amount_asc",
		label: "金額が低い順",
		icon: <Coins className="h-4 w-4" />,
		description: "香典金額が低い順",
	},
	{
		value: "name_asc",
		label: "名前順",
		icon: <ArrowDownAZ className="h-4 w-4" />,
		description: "ご芳名の五十音順",
	},
] as const;

export function MobileFilters({
	searchQuery,
	onSearchChange,
	searchField,
	onSearchFieldChange,
	sortOrder,
	onSortOrderChange,
}: MobileFiltersProps) {
	const currentSort = sortOptions.find((option) => option.value === sortOrder);
	const currentSearch = searchOptions.find(
		(option) => option.value === searchField,
	);

	return (
		<div className="sticky top-2 z-50 py-4">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
						{currentSearch?.icon || (
							<Search className="h-4 w-4 text-muted-foreground" />
						)}
					</div>
					<Input
						placeholder={`${currentSearch?.label || "ご芳名"}で検索...`}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full h-12 pl-9 pr-12 text-sm bg-background"
					/>
					<div className="absolute inset-y-0 right-1 flex items-center">
						<Drawer>
							<DrawerTrigger asChild>
								<Button variant="ghost" size="sm" className="h-7 px-2">
									<SlidersHorizontal className="h-4 w-4" />
								</Button>
							</DrawerTrigger>
							<DrawerContent>
								<div className="max-w-md mx-auto p-8">
									<Tabs defaultValue="search" className="px-4">
										<TabsList className="grid w-full grid-cols-2 mb-4">
											<TabsTrigger value="search" className="text-sm">
												検索対象
											</TabsTrigger>
											<TabsTrigger value="sort" className="text-sm">
												並び替え
											</TabsTrigger>
										</TabsList>
										<TabsContent value="search" className="mt-0">
											<div className="p-4 space-y-4">
												<RadioGroup
													value={searchField}
													onValueChange={(value) => {
														onSearchFieldChange(value);
														onSearchChange("");
													}}
													className="space-y-3"
												>
													{searchOptions.map((option) => (
														<div
															key={option.value}
															className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
														>
															<RadioGroupItem
																value={option.value}
																id={`search-${option.value}`}
															/>
															<Label
																htmlFor={`search-${option.value}`}
																className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
															>
																{option.icon}
																<div className="flex flex-col">
																	<span>{option.label}</span>
																	<span className="text-xs text-muted-foreground">
																		{option.description}
																	</span>
																</div>
															</Label>
														</div>
													))}
												</RadioGroup>
											</div>
										</TabsContent>
										<TabsContent value="sort" className="mt-0">
											<div className="p-4 space-y-4">
												<RadioGroup
													value={sortOrder}
													onValueChange={onSortOrderChange}
													className="space-y-3"
												>
													{sortOptions.map((option) => (
														<div
															key={option.value}
															className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
														>
															<RadioGroupItem
																value={option.value}
																id={`sort-${option.value}`}
															/>
															<Label
																htmlFor={`sort-${option.value}`}
																className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
															>
																{option.icon}
																<div className="flex flex-col">
																	<span>{option.label}</span>
																	<span className="text-xs text-muted-foreground">
																		{option.description}
																	</span>
																</div>
															</Label>
														</div>
													))}
												</RadioGroup>
											</div>
										</TabsContent>
									</Tabs>
								</div>
							</DrawerContent>
						</Drawer>
					</div>
				</div>
			</div>
		</div>
	);
}
