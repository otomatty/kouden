"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Users, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface InvitationSuccessAlertProps {
	status: string;
}

export function InvitationSuccessAlert({ status }: InvitationSuccessAlertProps) {
	const [show, setShow] = useState(true);
	const router = useRouter();

	// 5秒後に自動で非表示にする
	useEffect(() => {
		const timer = setTimeout(() => {
			setShow(false);
			// URLからクエリパラメータを削除
			const url = new URL(window.location.href);
			url.searchParams.delete("invitation");
			router.replace(url.pathname);
		}, 5000);

		return () => clearTimeout(timer);
	}, [router]);

	if (!show) return null;

	const getAlertContent = () => {
		switch (status) {
			case "accepted":
				return {
					icon: <CheckCircle className="h-4 w-4" />,
					title: "招待を受け入れました",
					description:
						"香典帳のメンバーとして正常に追加されました。香典帳の管理や記録の追加ができるようになりました。",
				};
			case "existing":
				return {
					icon: <Users className="h-4 w-4" />,
					title: "既にメンバーです",
					description:
						"あなたは既にこの香典帳のメンバーです。香典帳一覧から該当の香典帳にアクセスできます。",
				};
			default:
				return {
					icon: <Home className="h-4 w-4" />,
					title: "招待処理が完了しました",
					description: "招待に関する処理が完了しました。",
				};
		}
	};

	const content = getAlertContent();

	const handleDismiss = () => {
		setShow(false);
		// URLからクエリパラメータを削除
		const url = new URL(window.location.href);
		url.searchParams.delete("invitation");
		router.replace(url.pathname);
	};

	return (
		<Alert
			data-tour="invitation-success-alert"
			className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{content.icon}
			<AlertTitle className="flex items-center justify-between">
				{content.title}
				<Button
					variant="ghost"
					size="sm"
					onClick={handleDismiss}
					className="h-6 w-6 p-0 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
				>
					×
				</Button>
			</AlertTitle>
			<AlertDescription>{content.description}</AlertDescription>
		</Alert>
	);
}
