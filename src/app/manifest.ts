import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "香典帳アプリ",
		short_name: "香典帳",
		description:
			"香典帳の管理をデジタル化し、効率的に記録・管理できるアプリケーション",
		start_url: "/koudens",
		scope: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		orientation: "any",
		icons: [
			{
				src: "/icons/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/icons/icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
		screenshots: [
			{
				src: "/screenshots/desktop.png",
				sizes: "3360x1924",
				type: "image/png",
				form_factor: "wide",
			},
			{
				src: "/screenshots/mobile.png",
				sizes: "764x1654",
				type: "image/png",
				form_factor: "narrow",
			},
		],
		categories: ["productivity", "utilities"],
		prefer_related_applications: false,
	};
}
