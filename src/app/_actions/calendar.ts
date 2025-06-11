"use server";

import { google } from "googleapis";

// 環境変数の取得と必須チェック
const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_CALENDAR_ID } =
	process.env;
if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
	throw new Error("環境変数 GOOGLE_SERVICE_ACCOUNT_EMAIL が未設定です");
}
if (!GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
	throw new Error("環境変数 GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY が未設定です");
}
if (!GOOGLE_CALENDAR_ID) {
	throw new Error("環境変数 GOOGLE_CALENDAR_ID が未設定です");
}

// JWT認証クライアントの初期化
const auth = new google.auth.JWT({
	email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\n/g, "\n"),
	scopes: ["https://www.googleapis.com/auth/calendar"],
});
const calendar = google.calendar({ version: "v3", auth });

export type Slot = {
	start: string; // ISO文字列
	end: string; // ISO文字列
	available: boolean;
};

export type DayAvailability = {
	date: string; // YYYY-MM-DD
	slots: Slot[];
};

/**
 * 指定週の空き状況を1時間単位で返します。
 * @param weekStart ISO 形式の週開始日 (例: "2025-07-14T00:00:00.000Z")
 * @returns 各日の日時と空きスロットリスト
 */
export async function getWeeklyAvailability(weekStart: string): Promise<DayAvailability[]> {
	const startDate = new Date(weekStart);
	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + 7);

	// カレンダーイベントを取得
	const res = await calendar.events.list({
		calendarId: GOOGLE_CALENDAR_ID,
		timeMin: startDate.toISOString(),
		timeMax: endDate.toISOString(),
		singleEvents: true,
		orderBy: "startTime",
	});
	const events = res.data.items || [];

	// 時間重複チェック
	const isOverlap = (s1: Date, e1: Date, s2: Date, e2: Date) => s1 < e2 && s2 < e1;

	const availability: DayAvailability[] = [];

	for (let day = 0; day < 7; day++) {
		const current = new Date(startDate);
		current.setDate(startDate.getDate() + day);
		const dateKey = current.toISOString().split("T")[0] ?? "";

		const slots: Slot[] = [];
		for (let hour = 0; hour < 24; hour++) {
			const slotStart = new Date(current);
			slotStart.setHours(hour, 0, 0, 0);
			const slotEnd = new Date(slotStart);
			slotEnd.setHours(hour + 1);

			const busy = events.some((ev) => {
				const evStartRaw = ev.start?.dateTime ?? ev.start?.date;
				const evEndRaw = ev.end?.dateTime ?? ev.end?.date;
				if (!evStartRaw) return false;
				if (!evEndRaw) return false;
				const evStart = new Date(evStartRaw);
				const evEnd = new Date(evEndRaw);
				return isOverlap(slotStart, slotEnd, evStart, evEnd);
			});

			slots.push({
				start: slotStart.toISOString(),
				end: slotEnd.toISOString(),
				available: !busy,
			});
		}

		availability.push({ date: dateKey, slots });
	}

	return availability;
}

/**
 * FormData から値を抽出し、指定したスロットでイベントを登録します。
 */
export async function reserveSlot(formData: FormData): Promise<void> {
	const summary = formData.get("summary");
	const email = formData.get("email");
	const notes = formData.get("notes");
	if (!email) {
		throw new Error("フォームデータ email が不足しています");
	}
	const description = `メールアドレス: ${email.toString()}${notes ? `\n備考: ${notes.toString()}` : ""}`;
	const startDateTime = formData.get("startDateTime");
	const endDateTime = formData.get("endDateTime");
	if (!summary) {
		throw new Error("フォームデータ summary が不足しています");
	}
	if (!startDateTime) {
		throw new Error("フォームデータ startDateTime が不足しています");
	}
	if (!endDateTime) {
		throw new Error("フォームデータ endDateTime が不足しています");
	}
	await calendar.events.insert({
		calendarId: GOOGLE_CALENDAR_ID,
		requestBody: {
			summary: summary.toString(),
			description,
			start: { dateTime: startDateTime.toString() },
			end: { dateTime: endDateTime.toString() },
		},
	});
}
