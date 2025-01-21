"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { updateUserSettings } from "@/app/_actions/settings";
import { useGuideMode } from "@/hooks/use-guide-mode";

interface SettingsFormProps {
	userId: string;
	initialSettings: {
		guide_mode: boolean;
		theme: "light" | "dark" | "system";
	};
}

export function SettingsForm({ userId, initialSettings }: SettingsFormProps) {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const { setIsEnabled: setGuideMode } = useGuideMode();

	const handleGuideMode = async (checked: boolean) => {
		try {
			setIsPending(true);
			const { error } = await updateUserSettings(userId, {
				guide_mode: checked,
			});

			if (error) {
				throw new Error(error);
			}

			setGuideMode(checked);
			toast({
				title: "設定を更新しました",
			});
			router.refresh();
		} catch (error) {
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "設定の更新に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleTheme = async (value: "light" | "dark" | "system") => {
		try {
			setIsPending(true);
			const { error } = await updateUserSettings(userId, {
				theme: value,
			});

			if (error) {
				throw new Error(error);
			}

			toast({
				title: "設定を更新しました",
			});
			router.refresh();
		} catch (error) {
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "設定の更新に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsPending(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between space-x-2">
				<Label htmlFor="guide-mode" className="flex flex-col space-y-1">
					<span>ガイドモード</span>
					<span className="font-normal text-sm text-muted-foreground">
						各機能の説明をホバー時に表示します
					</span>
				</Label>
				<Switch
					id="guide-mode"
					checked={initialSettings.guide_mode}
					onCheckedChange={handleGuideMode}
					disabled={isPending}
				/>
			</div>
			<div className="flex items-center justify-between space-x-2">
				<Label htmlFor="theme" className="flex flex-col space-y-1">
					<span>テーマ</span>
					<span className="font-normal text-sm text-muted-foreground">
						アプリケーションの表示テーマを設定します
					</span>
				</Label>
				<Select
					defaultValue={initialSettings.theme}
					onValueChange={handleTheme}
					disabled={isPending}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="テーマを選択" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="light">ライトモード</SelectItem>
						<SelectItem value="dark">ダークモード</SelectItem>
						<SelectItem value="system">システム設定に従う</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
