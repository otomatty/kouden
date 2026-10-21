/**
 * モバイル向けのデータテーブルツールバーコンポーネント
 *
 * 検索、フィルタリング、ソート機能を提供するモバイル最適化されたツールバー。
 * Drawerを使用してフィルターとソートのオプションを表示します。
 *
 * @example
 * ```tsx
 * <MobileDataTableToolbar
 *   searchOptions={[
 *     { value: 'name', label: '名前で検索' },
 *     { value: 'email', label: 'メールで検索' }
 *   ]}
 *   filterOptions={[
 *     { value: 'active', label: 'アクティブ' },
 *     { value: 'inactive', label: '非アクティブ' }
 *   ]}
 *   sortOptions={[
 *     { value: 'name_asc', label: '名前（昇順）' },
 *     { value: 'name_desc', label: '名前（降順）' }
 *   ]}
 *   onSearchChange={(value) => console.log(value)}
 * />
 * ```
 */

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, ArrowDownAZ, ArrowUpAZ, Columns, SlidersHorizontal } from "lucide-react";
import { MobileDisplaySettings } from "./mobile-display-settings";
import type { MemberOption } from "./display-settings";

/**
 * 検索オプションの型定義
 * @interface SearchOption
 */
interface SearchOption {
	/** 検索オプションの値 */
	value: string;
	/** 検索オプションのラベル */
	label: string;
	/** オプションのアイコン（任意） */
	icon?: React.ReactNode;
	/** オプションの説明文（任意） */
	description?: string;
}

/**
 * フィルターオプションの型定義
 * @interface FilterOption
 */
interface FilterOption {
	/** フィルターオプションの値 */
	value: string;
	/** フィルターオプションのラベル */
	label: string;
	/** オプションのアイコン（任意） */
	icon?: React.ReactNode;
	/** オプションの説明文（任意） */
	description?: string;
}

/**
 * ソートオプションの型定義
 * @interface SortOption
 */
interface SortOption {
	/** ソートオプションの値 */
	value: string;
	/** ソートオプションのラベル */
	label: string;
	/** オプションのアイコン（任意） */
	icon?: React.ReactNode;
	/** オプションの説明文（任意） */
	description?: string;
}

/**
 * モバイルデータテーブルツールバーのプロパティ
 * @interface MobileDataTableToolbarProps
 */
export interface MobileDataTableToolbarProps {
	/** 検索オプションの配列
	 * @example
	 * ```tsx
	 * searchOptions={[
	 *   { value: 'name', label: '名前で検索' },
	 *   { value: 'email', label: 'メールで検索' }
	 * ]}
	 * ```
	 */
	searchOptions?: SearchOption[];
	/** 現在選択されているフィルターカラム
	 * @example
	 * ```tsx
	 * filterColumn="name"
	 * ```
	 */
	filterColumn?: string;
	/** フィルターカラムが変更された時のコールバック
	 * @example
	 * ```tsx
	 * onFilterColumnChange={(value) => console.log(value)}
	 * ```
	 */
	onFilterColumnChange?: (value: string) => void;
	/** フィルターオプションの配列
	 * @example
	 * ```tsx
	 * filterOptions={[
	 *   { value: 'active', label: 'アクティブ' },
	 *   { value: 'inactive', label: '非アクティブ' }
	 * ]}
	 * ```
	 */
	filterOptions?: FilterOption[];
	/** ソートオプションの配列
	 * @example
	 * ```tsx
	 * sortOptions={[
	 *   { value: 'name_asc', label: '名前（昇順）' },
	 *   { value: 'name_desc', label: '名前（降順）' }
	 * ]}
	 * ```
	 */
	sortOptions?: SortOption[];
	/** フィルター機能の表示/非表示
	 * @example
	 * ```tsx
	 * showFilter={true}
	 * ```
	 */
	showFilter?: boolean;
	/** ソート機能の表示/非表示
	 * @example
	 * ```tsx
	 * showSort={true}
	 * ```
	 */
	showSort?: boolean;
	/** 検索フィールドの現在の値
	 * @example
	 * ```tsx
	 * searchValue="検索"
	 * ```
	 */
	searchValue?: string;
	/** 検索値が変更された時のコールバック
	 * @example
	 * ```tsx
	 * onSearchChange={(value) => console.log(value)}
	 * ```
	 */
	onSearchChange?: (value: string) => void;
	/** 現在選択されている検索フィールド
	 * @example
	 * ```tsx
	 * searchField="name"
	 * ```
	 */
	searchField?: string;
	/** 現在のソート順
	 * @example
	 * ```tsx
	 * sortOrder="name_asc"
	 * ```
	 */
	sortOrder?: string;
	/** ソート順が変更された時のコールバック
	 * @example
	 * ```tsx
	 * onSortOrderChange={(value) => console.log(value)}
	 * ```
	 */
	onSortOrderChange?: (value: string) => void;
	/** 検索フィールドのプレースホルダーテキスト */
	searchPlaceholder?: string;
	/** 表示設定用のビュー範囲 */
	viewScope?: "own" | "all" | "others";
	/** 表示設定: ビュー範囲変更時 */
	onViewScopeChange?: (scope: "own" | "all" | "others") => void;
	/** 表示設定: メンバーオプション一覧 */
	members?: MemberOption[];
	/** 表示設定: 選択中のメンバーID */
	selectedMemberIds?: string[];
	/** 表示設定: メンバー選択変更時 */
	onMemberSelectionChange?: (ids: string[]) => void;
	/** 日付フィルターを表示するか */
	showDateFilter?: boolean;
	/** 日付範囲 */
	dateRange?: { from?: Date; to?: Date };
	/** 日付範囲変更時 */
	onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
	/** 重複フィルターオンオフ */
	duplicateFilter?: boolean;
	/** 重複フィルター変更時 */
	onDuplicateFilterChange?: (value: boolean) => void;
}

/**
 * モバイル向けデータテーブルツールバーコンポーネント
 *
 * 検索、フィルタリング、ソート機能を提供するモバイル最適化されたツールバー。
 * ドロワーUIを使用してフィルターとソートのオプションを表示します。
 *
 * @param props - コンポーネントのプロパティ
 * @returns モバイルツールバーのReactコンポーネント
 */
export function MobileDataTableToolbar({
	searchOptions = [],
	filterColumn,
	onFilterColumnChange,
	filterOptions = [],
	sortOptions = [],
	searchField,
	showFilter = true,
	showSort = true,
	onSearchChange,
	sortOrder,
	onSortOrderChange,
	searchPlaceholder,
	searchValue,
	viewScope = "all",
	onViewScopeChange = () => {},
	members = [],
	selectedMemberIds = [],
	onMemberSelectionChange = () => {},
	showDateFilter = false,
	dateRange = {},
	onDateRangeChange = () => {},
	duplicateFilter = false,
	onDuplicateFilterChange = () => {},
}: MobileDataTableToolbarProps) {
	const [globalFilter, setGlobalFilter] = React.useState(searchValue || "");
	const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

	// 外部からの searchValue の変更を同期
	React.useEffect(() => {
		if (searchValue !== undefined) {
			setGlobalFilter(searchValue);
		}
	}, [searchValue]);

	/**
	 * グローバル検索の処理を行うコールバック関数
	 *
	 * デバウンス処理を実装し、パフォーマンスを最適化します。
	 * また、スクロール位置を保持します。
	 *
	 * @param value - 新しい検索値
	 */
	const handleSearch = React.useCallback(
		(value: string) => {
			// 現在のスクロール位置を保存
			const currentScroll = window.scrollY;

			// 内部の状態を即時更新
			setGlobalFilter(value);

			// 既存のタイムアウトをクリア
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			// 新しい検索処理をスケジュール
			searchTimeoutRef.current = setTimeout(() => {
				if (onSearchChange) {
					onSearchChange(value);
					// スクロール位置を復元
					requestAnimationFrame(() => {
						window.scrollTo(0, currentScroll);
					});
				}
			}, 300); // 300ms のデバウンス
		},
		[onSearchChange],
	);

	// コンポーネントのアンマウント時にタイムアウトをクリア
	React.useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	// 現在選択されている検索オプションを取得
	const currentSearch = searchOptions.find((option) => option.value === searchField);

	return (
		<div className="sticky top-2 z-50 py-4">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
						<Search className="h-4 w-4 text-muted-foreground" />
					</div>
					<Input
						placeholder={searchPlaceholder || `${currentSearch?.label || "検索"}...`}
						value={globalFilter}
						onChange={(e) => handleSearch(e.target.value)}
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
								<DrawerHeader>
									<DrawerTitle>表示設定と並び替え</DrawerTitle>
								</DrawerHeader>
								<div className="max-w-md mx-auto p-8">
									<Tabs defaultValue="sort" className="px-4">
										<TabsList className="grid w-full grid-cols-2 mb-4">
											<TabsTrigger value="display" className="text-sm">
												表示設定
											</TabsTrigger>
											{showSort && (
												<TabsTrigger value="sort" className="text-sm">
													並び替え
												</TabsTrigger>
											)}
										</TabsList>

										{/* 表示設定 */}
										<TabsContent value="display" className="mt-0">
											<MobileDisplaySettings
												viewScope={viewScope}
												onViewScopeChange={onViewScopeChange}
												members={members}
												selectedMemberIds={selectedMemberIds}
												onMemberSelectionChange={onMemberSelectionChange}
												showDateFilter={showDateFilter}
												dateRange={dateRange}
												onDateRangeChange={onDateRangeChange}
												duplicateFilter={duplicateFilter}
												onDuplicateFilterChange={onDuplicateFilterChange}
												showFilter={showFilter}
												filterColumn={filterColumn}
												filterOptions={filterOptions}
												onFilterColumnChange={onFilterColumnChange}
											/>
										</TabsContent>

										{/* 並び替えオプション */}
										{showSort && (
											<TabsContent value="sort" className="mt-0">
												<div className="p-4 space-y-4">
													<RadioGroup
														value={sortOrder || "default"}
														onValueChange={(value) => {
															if (onSortOrderChange) {
																onSortOrderChange(value);
															}
														}}
														className="space-y-3"
													>
														<div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
															<RadioGroupItem value="default" id="sort-default" />
															<Label
																htmlFor="sort-default"
																className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
															>
																<ArrowDownAZ className="h-4 w-4" />
																<div className="flex flex-col">
																	<span>デフォルト</span>
																</div>
															</Label>
														</div>
														{sortOptions.map((option) => (
															<div
																key={option.value}
																className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
															>
																<RadioGroupItem value={option.value} id={`sort-${option.value}`} />
																<Label
																	htmlFor={`sort-${option.value}`}
																	className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
																>
																	{option.icon ||
																		(option.value.includes("desc") ? (
																			<ArrowDownAZ className="h-4 w-4" />
																		) : (
																			<ArrowUpAZ className="h-4 w-4" />
																		))}
																	<div className="flex flex-col">
																		<span>{option.label}</span>
																		{option.description && (
																			<span className="text-xs text-muted-foreground">
																				{option.description}
																			</span>
																		)}
																	</div>
																</Label>
															</div>
														))}
													</RadioGroup>
												</div>
											</TabsContent>
										)}
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
