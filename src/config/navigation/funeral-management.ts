import {
	LayoutDashboard,
	Users,
	Calendar,
	User,
	Heart,
	Mail,
	FileText,
	DollarSign,
	Package,
	CheckSquare,
	Phone,
	BarChart3,
	Settings,
} from "lucide-react";
import type { NavigationItem, NavigationSection } from "./types";

/**
 * 葬儀管理システムのナビゲーションメニュー設定
 */
export const funeralManagementNavigation: NavigationSection[] = [
	{
		title: "基本機能",
		items: [
			{
				title: "ダッシュボード",
				href: "/funeral-management",
				icon: LayoutDashboard,
				description: "売上・案件進捗サマリー",
			},
			{
				title: "顧客管理",
				href: "/funeral-management/customers",
				icon: Users,
				description: "CRM・顧客情報管理",
			},
			{
				title: "葬儀案件",
				href: "/funeral-management/cases",
				icon: Calendar,
				description: "案件・スケジュール管理",
			},
			{
				title: "参列者",
				href: "/funeral-management/attendees",
				icon: User,
				description: "参列者管理",
			},
		],
	},
	{
		title: "受付・記録",
		items: [
			{
				title: "香典受付",
				href: "/funeral-management/donations",
				icon: Heart,
				description: "香典記録・管理",
			},
			{
				title: "顧客連絡",
				href: "/funeral-management/contacts",
				icon: Mail,
				description: "メール・SMS管理",
			},
		],
	},
	{
		title: "業務管理",
		items: [
			{
				title: "見積管理",
				href: "/funeral-management/quotes",
				icon: FileText,
				description: "見積書作成・管理",
			},
			{
				title: "請求管理",
				href: "/funeral-management/invoices",
				icon: DollarSign,
				description: "請求書・入金管理",
			},
			{
				title: "資材管理",
				href: "/funeral-management/materials",
				icon: Package,
				description: "発注・在庫管理",
			},
			{
				title: "タスク管理",
				href: "/funeral-management/tasks",
				icon: CheckSquare,
				description: "スケジュール・担当者管理",
			},
		],
	},
	{
		title: "予約・分析",
		items: [
			{
				title: "オンライン予約",
				href: "/funeral-management/reservations",
				icon: Phone,
				description: "火葬予約管理",
			},
			{
				title: "レポート",
				href: "/funeral-management/reports",
				icon: BarChart3,
				description: "売上・分析レポート",
			},
			{
				title: "設定",
				href: "/funeral-management/settings",
				icon: Settings,
				description: "システム設定",
			},
		],
	},
];

/**
 * クイックアクセス用のメニュー（ヘッダーに表示される主要な機能）
 */
export const funeralQuickAccessNavigation: NavigationItem[] = [
	{
		title: "ダッシュボード",
		href: "/funeral-management",
		icon: LayoutDashboard,
	},
	{
		title: "顧客管理",
		href: "/funeral-management/customers",
		icon: Users,
	},
	{
		title: "案件管理",
		href: "/funeral-management/cases",
		icon: Calendar,
	},
	{
		title: "香典受付",
		href: "/funeral-management/donations",
		icon: Heart,
	},
	{
		title: "レポート",
		href: "/funeral-management/reports",
		icon: BarChart3,
	},
];
