import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import CalendarNavigator from "@/components/calendar/CalendarNavigator";
import { getWeeklyAvailability } from "@/app/_actions/calendar";

export default async function CalendarSection() {
	const today = new Date();
	const weekStartDate = new Date(today);
	weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
	const initialWeekStart = weekStartDate.toISOString();
	const initialAvailability = await getWeeklyAvailability(initialWeekStart);
	return (
		<Section id="reservation-calendar" bgClassName="bg-gray-50">
			<SectionTitle
				title="オンラインデモ予約カレンダー"
				subtitle="ご都合のよい日時を選択してください"
				className="mb-8"
			/>
			<CalendarNavigator
				initialWeekStart={initialWeekStart}
				initialAvailability={initialAvailability}
			/>
		</Section>
	);
}
