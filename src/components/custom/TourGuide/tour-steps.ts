import type { TourStep } from "@/types/tour";
import { moveToNextStep, waitForElement } from "./TourGuide";

export const tourSteps: TourStep[] = [
	{
		element: ".app",
		popover: {
			title: "ようこそ、香典帳アプリへ",
			description:
				"このアプリは、香典や供物の記録を簡単に管理できるツールです。",
			position: "auto",
		},
	},
	{
		element: ".create-kouden-button",
		popover: {
			title: "香典帳を作成する",
			description:
				"このボタンをクリックして、新しい香典帳を作成してみましょう。\n\n※ボタンをクリックすると次のステップに進みます。",
			position: "bottom",
			onNextClick: (element) => {
				if (element) {
					(element as HTMLElement).click();
					setTimeout(moveToNextStep, 500);
					return false;
				}
			},
		},
	},
	{
		element: ".create-kouden-form-title",
		popover: {
			title: "香典帳の作成",
			description: "香典帳のタイトルを入力してください。",
			position: "bottom",
		},
	},
	{
		element: ".create-kouden-form-button",
		popover: {
			title: "香典帳を作成する",
			description: "作成ボタンをクリックして、香典帳を作成しましょう。",
			position: "bottom",
			onNextClick: async (element) => {
				if (element) {
					(element as HTMLElement).click();
					const isElementVisible = await waitForElement(
						".kouden-card",
						"/koudens$",
						10,
					);
					if (isElementVisible) {
						moveToNextStep();
					} else {
						console.warn("香典帳カードが表示されませんでした");
					}
					return false;
				}
			},
		},
	},
	{
		element: ".kouden-card-button",
		popover: {
			title: "香典帳を確認する",
			description:
				"作成した香典帳の詳細を確認できます。クリックして詳細ページに移動しましょう。",
			position: "bottom",
			onNextClick: async (element) => {
				if (element) {
					(element as HTMLElement).click();
					const isElementVisible = await waitForElement(
						".kouden-entry-add",
						"/koudens/[^/]+$",
						20,
					);
					if (isElementVisible) {
						moveToNextStep();
					} else {
						console.warn("詳細ページの読み込みに失敗しました");
					}
					return false;
				}
			},
		},
	},
	{
		element: ".kouden-entry-add",
		popover: {
			title: "記録を追加する",
			description:
				"このボタンから香典や供物の記録を追加できます。\n\n記録を追加すると、一覧で確認することができます。",
			position: "bottom",
		},
	},
	{
		element: ".kouden-entry-spreadsheet",
		popover: {
			title: "記録の一覧",
			description:
				"追加した記録はここに表示されます。\n\n記録は表形式で管理され、編集や削除も可能です。",
			position: "top",
		},
	},
	{
		element: ".app",
		popover: {
			title: "さっそく始めましょう",
			description: "基本的な機能の説明は以上です。実際に使ってみましょう！",
			position: "auto",
		},
	},
];
