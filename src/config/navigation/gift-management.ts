import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	Users,
	Gift,
	Truck,
	BarChart3,
	FileText,
	Settings,
	Tag,
	Store,
} from "lucide-react";
import type { NavigationItem, NavigationSection } from "./types";

/**
 * ギフトショップ管理システムのナビゲーションメニュー設定
 */
export const giftManagementNavigation: NavigationSection[] = [
	{
		title: "基本機能",
		items: [
			{
				title: "ダッシュボード",
				href: "/gift-management",
				icon: LayoutDashboard,
				description: "売上・注文状況サマリー",
			},
			{
				title: "商品管理",
				href: "/gift-management/products",
				icon: Package,
				description: "商品・在庫管理",
			},
			{
				title: "注文管理",
				href: "/gift-management/orders",
				icon: ShoppingCart,
				description: "注文・配送管理",
			},
			{
				title: "顧客管理",
				href: "/gift-management/customers",
				icon: Users,
				description: "顧客情報・購入履歴",
			},
		],
	},
	{
		title: "ギフト機能",
		items: [
			{
				title: "ギフトセット",
				href: "/gift-management/gift-sets",
				icon: Gift,
				description: "ギフトセット管理",
			},
			{
				title: "のし・包装",
				href: "/gift-management/wrapping",
				icon: Tag,
				description: "のし・包装設定",
			},
		],
	},
	{
		title: "業務管理",
		items: [
			{
				title: "配送管理",
				href: "/gift-management/shipping",
				icon: Truck,
				description: "配送・追跡管理",
			},
			{
				title: "店舗管理",
				href: "/gift-management/stores",
				icon: Store,
				description: "店舗・拠点管理",
			},
			{
				title: "請求管理",
				href: "/gift-management/invoices",
				icon: FileText,
				description: "請求書・決済管理",
			},
		],
	},
	{
		title: "分析・設定",
		items: [
			{
				title: "売上分析",
				href: "/gift-management/analytics",
				icon: BarChart3,
				description: "売上・顧客分析",
			},
			{
				title: "設定",
				href: "/gift-management/settings",
				icon: Settings,
				description: "システム設定",
			},
		],
	},
];

/**
 * クイックアクセス用のメニュー（ヘッダーに表示される主要な機能）
 */
export const giftQuickAccessNavigation: NavigationItem[] = [
	{
		title: "ダッシュボード",
		href: "/gift-management",
		icon: LayoutDashboard,
	},
	{
		title: "商品管理",
		href: "/gift-management/products",
		icon: Package,
	},
	{
		title: "注文管理",
		href: "/gift-management/orders",
		icon: ShoppingCart,
	},
	{
		title: "ギフトセット",
		href: "/gift-management/gift-sets",
		icon: Gift,
	},
	{
		title: "売上分析",
		href: "/gift-management/analytics",
		icon: BarChart3,
	},
];
