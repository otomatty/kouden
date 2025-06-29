import Script from "next/script";

interface BlogSEOProps {
	title: string;
	description: string;
	slug: string;
	publishDate: string;
	modifiedDate?: string;
	tags?: string[];
	author?: string;
	readingTime?: number;
}

export function BlogSEO({
	title,
	description,
	slug,
	publishDate,
	modifiedDate,
	tags = [],
	author = "Saedgewell",
	readingTime = 5,
}: BlogSEOProps) {
	const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${slug}`;
	const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/images/blog/${slug}-og.png`;

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: title,
		description: description,
		url: articleUrl,
		image: imageUrl,
		datePublished: publishDate,
		dateModified: modifiedDate || publishDate,
		author: {
			"@type": "Person",
			name: author,
			url: process.env.NEXT_PUBLIC_APP_URL,
		},
		publisher: {
			"@type": "Organization",
			name: "Saedgewell",
			logo: {
				"@type": "ImageObject",
				url: `${process.env.NEXT_PUBLIC_APP_URL}/icons/icon-512x512.png`,
			},
		},
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": articleUrl,
		},
		keywords: tags.join(","),
		wordCount: readingTime * 200, // 概算
		timeRequired: `PT${readingTime}M`,
	};

	return (
		<Script
			id={`blog-structured-data-${slug}`}
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(structuredData),
			}}
		/>
	);
}
