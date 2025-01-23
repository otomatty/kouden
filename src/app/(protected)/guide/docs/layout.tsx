"use client";

import { Provider } from "jotai";

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <Provider>{children}</Provider>;
}
