import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { notoSansJP, zenOldMincho } from "./fonts";
import { Toaster } from "@/components/ui/sonner";
import { getUser } from "./_actions/user";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	themeColor: "#000000",
};

export const metadata: Metadata = {
	title: {
		default: "香典帳アプリ | デジタル香典管理で手間を解消",
		template: "%s | 香典帳アプリ",
	},
	description:
		"香典帳をデジタル化し、効率的に記録・管理できるWebアプリ。手書きの手間を解消し、家族との情報共有も簡単。無料で今すぐお試しください。",
	keywords: ["香典帳", "香典", "デジタル", "管理", "アプリ", "葬儀", "法要", "供物", "記録"],
	authors: [{ name: "Saedgewell" }],
	creator: "Saedgewell",
	publisher: "Saedgewell",
	openGraph: {
		type: "website",
		locale: "ja_JP",
		url: process.env.NEXT_PUBLIC_APP_URL,
		siteName: "香典帳アプリ",
		title: "香典帳アプリ | デジタル香典管理で手間を解消",
		description:
			"香典帳をデジタル化し、効率的に記録・管理できるWebアプリ。手書きの手間を解消し、家族との情報共有も簡単。",
		images: [
			{
				url: `${process.env.NEXT_PUBLIC_APP_URL}/images/og-image.png`,
				width: 1200,
				height: 630,
				alt: "香典帳アプリ",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "香典帳アプリ | デジタル香典管理で手間を解消",
		description:
			"香典帳をデジタル化し、効率的に記録・管理できるWebアプリ。手書きの手間を解消し、家族との情報共有も簡単。",
		images: [`${process.env.NEXT_PUBLIC_APP_URL}/images/og-image.png`],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "hY7LIXlVtyLJuBRuCAFomDF3JMV43pbzNURRoXDPkaQ",
	},
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
				<link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
				<meta name="msapplication-TileColor" content="#000000" />
				<meta name="msapplication-config" content="/browserconfig.xml" />
				<link rel="manifest" href="/manifest.json" />
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
