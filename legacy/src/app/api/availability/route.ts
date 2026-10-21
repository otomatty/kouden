import { NextResponse } from "next/server";
import { getWeeklyAvailability } from "@/app/_actions/calendar";
import logger from "@/lib/logger";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const weekStart = searchParams.get("weekStart");
	if (!weekStart) {
		return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
	}
	try {
		const result = await getWeeklyAvailability(weekStart);
		if (!result.ok) {
			// `getWeeklyAvailability` は ActionResult を返すため、ここで unwrap
			// しないと `{ ok, data, ... }` を JSON として返してしまい、
			// 既存の API 利用側 (`DayAvailability[]` を期待) が壊れる。
			logger.error(
				{
					code: result.error.code,
					error: result.error.message,
					weekStart,
				},
				"Error fetching availability",
			);
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}
		return NextResponse.json(result.data);
	} catch (err: unknown) {
		logger.error(
			{
				error: err instanceof Error ? err.message : String(err),
				weekStart,
			},
			"Error fetching availability",
		);
		const message = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
