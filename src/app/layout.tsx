import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	themeColor: "#000000",
};

export const metadata: Metadata = {
	title: "香典帳",
	description: "香典帳の管理を行えるアプリです。",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "香典帳",
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
	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				<meta name="application-name" content="香典帳アプリ" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="香典帳" />
				<meta
					name="description"
					content="香典帳の管理をデジタル化し、効率的に記録・管理できるアプリケーション"
				/>
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="theme-color" content="#000000" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-muted`}>
				<TooltipProvider>
					<Providers>{children}</Providers>
				</TooltipProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
