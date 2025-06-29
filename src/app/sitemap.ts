import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kouden-app.com";

	// 静的ページ
	const staticPages = [
		"",
		"/features",
		"/features/cloud-sync",
		"/features/auto-calc-graph",
		"/features/export",
		"/features/multi-device",
		"/features/return-management",
		"/features/invite-security",
		"/features/dedicated-ui",
		"/pricing",
		"/faq",
		"/guide",
		"/enterprise",
		"/enterprise/funeral-management",
		"/enterprise/gift-management",
		"/contact",
		"/legal",
		"/privacy",
		"/terms",
		"/plans/full-support",
	];

	return staticPages.map((path) => ({
		url: `${baseUrl}${path}`,
		lastModified: new Date(),
		changeFrequency: path === "" ? "daily" : "weekly",
		priority: path === "" ? 1 : path.startsWith("/features") ? 0.8 : 0.7,
	}));
}
