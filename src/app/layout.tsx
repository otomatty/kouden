import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { notoSansJP, zenOldMincho } from "./fonts";
import { Toaster } from "sonner";
import { getUser } from "./_actions/user";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	themeColor: "#000000",
};

export const metadata: Metadata = {
	title: "香典帳アプリ",
	description: "香典帳をデジタル化し、効率的に記録・管理できるアプリケーション",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "香典帳アプリ",
	},
	formatDetection: {
		telephone: false,
	},
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getUser();

	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				<meta name="application-name" content="香典帳アプリ" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="香典帳アプリ" />
				<meta
					name="description"
					content="香典帳をデジタル化し、効率的に記録・管理できるアプリケーション"
				/>
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="theme-color" content="#000000" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
			</head>
			<body
				className={`${notoSansJP.className} ${zenOldMincho.className} antialiased bg-muted`}
				suppressHydrationWarning
			>
				<TooltipProvider>
					<Providers initialUser={user}>
						{children}
						<Toaster />
					</Providers>
				</TooltipProvider>
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	);
}
