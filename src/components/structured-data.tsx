import Script from "next/script";

interface StructuredDataProps {
	type: "WebApplication" | "SoftwareApplication" | "Organization" | "Article";
	data: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
	const structuredData = {
		"@context": "https://schema.org",
		"@type": type,
		...data,
	};

	return (
		<Script
			id={`structured-data-${type.toLowerCase()}`}
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(structuredData),
			}}
		/>
	);
}

// 香典帳アプリ用のプリセット
export function KoudenAppStructuredData() {
	const appData = {
		name: "香典帳アプリ",
		description: "香典帳をデジタル化し、効率的に記録・管理できるWebアプリケーション",
		url: process.env.NEXT_PUBLIC_APP_URL,
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web Browser",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "JPY",
			availability: "https://schema.org/InStock",
		},
		creator: {
			"@type": "Organization",
			name: "Saedgewell",
			url: process.env.NEXT_PUBLIC_APP_URL,
		},
		keywords: "香典帳,香典,デジタル,管理,アプリ,葬儀,法要",
		inLanguage: "ja-JP",
		screenshot: "https://kouden-app.com/screenshots/desktop.png",
	};

	return <StructuredData type="SoftwareApplication" data={appData} />;
}

export function OrganizationStructuredData() {
	const orgData = {
		name: "Saedgewell",
		url: process.env.NEXT_PUBLIC_APP_URL,
		logo: `${process.env.NEXT_PUBLIC_APP_URL}/icons/icon-512x512.png`,
		description: "香典帳アプリの開発・運営を行っています",
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "customer service",
			email: "saedgewell@gmail.com",
		},
		sameAs: [
			// 'https://twitter.com/yourhandle',
			// 'https://github.com/yourorg',
		],
	};

	return <StructuredData type="Organization" data={orgData} />;
}
