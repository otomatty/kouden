import type { Step } from "@/types/tour";

interface TourStepConfig {
	[key: string]: Step[];
}

export const tourStepsConfig: TourStepConfig = {
	"/koudens": [
		{
			element: ".app-header",
			popover: {
				title: "ヘッダー",
				description: "通知、ガイド、ユーザーメニューにアクセスできます。",
			},
		},
		{
			element: ".kouden-list",
			popover: {
				title: "香典帳一覧",
				description:
					"作成した香典帳の一覧が表示されます。新しい香典帳を作成することもできます。",
			},
		},
	],
	"/koudens/[id]": [
		{
			element: ".kouden-detail",
			popover: {
				title: "香典帳の詳細",
				description: "香典帳の基本情報を確認・編集できます。",
			},
		},
		{
			element: ".offering-section",
			popover: {
				title: "香典・供物の管理",
				description:
					"香典や供物の記録を管理できます。新しい記録を追加したり、既存の記録を編集したりできます。",
			},
		},
		{
			element: ".entry-section",
			popover: {
				title: "参列者の管理",
				description:
					"参列者の情報を管理できます。新しい参列者を追加したり、既存の情報を編集したりできます。",
			},
		},
	],
};

export const getTourSteps = (pathname: string): Step[] => {
	// パスからIDを除去して一致するパターンを探す
	const normalizedPath = pathname.replace(/\/[^/]+$/, "/[id]");
	return tourStepsConfig[pathname] || tourStepsConfig[normalizedPath] || [];
};
