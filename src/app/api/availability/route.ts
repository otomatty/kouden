import { NextResponse } from "next/server";
import { getWeeklyAvailability } from "@/app/_actions/calendar";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const weekStart = searchParams.get("weekStart");
	if (!weekStart) {
		return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
	}
	try {
		const availability = await getWeeklyAvailability(weekStart);
		return NextResponse.json(availability);
	} catch (err: unknown) {
		console.error("Error fetching availability", err);
		const message = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
