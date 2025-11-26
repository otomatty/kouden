import { getEntries } from "@/app/_actions/entries";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id: koudenId } = await params;
	const url = new URL(req.url);
	const page = Number(url.searchParams.get("page") ?? "1");
	const pageSize = Number(url.searchParams.get("pageSize") ?? "50");
	const memberIdsParam = url.searchParams.get("memberIds");
	const memberIds = memberIdsParam
		? memberIdsParam
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
		: undefined;
	const searchValue = url.searchParams.get("search") ?? undefined;
	const sortValue = url.searchParams.get("sort") ?? undefined;
	const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
	const dateTo = url.searchParams.get("dateTo") ?? undefined;
	const showDuplicates = url.searchParams.get("isDuplicate") === "true";

	try {
		const { entries, count } = await getEntries(
			koudenId,
			page,
			pageSize,
			memberIds,
			searchValue,
			sortValue,
			dateFrom,
			dateTo,
			showDuplicates,
		);

		return NextResponse.json({ entries, count });
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				koudenId,
				page,
				pageSize,
			},
			"[API] GET /api/koudens/[id]/entries error",
		);
		return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
	}
}
