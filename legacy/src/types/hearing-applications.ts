/**
 * ヒアリング申し込みのフォームデータ型
 */
export interface HearingApplicationFormData {
	name: string;
	email: string;
	phone?: string;
	currentUsage: "new" | "free" | "basic" | "premium";
	videoTool: "googlemeet" | "zoom" | "teams";
	feedback?: string;
	selectedSlot: {
		start: string;
		end: string;
	};
	submittedAt?: string;
	userAgent?: string;
}

/**
 * データベースに保存されるヒアリング申し込みデータ
 */
export interface HearingApplication {
	id: string;
	user_id: string;
	form_data: HearingApplicationFormData;
	google_event_id?: string;
	status: "submitted" | "confirmed" | "completed" | "cancelled";
	created_at: string;
	updated_at: string;
}

/**
 * ヒアリング申し込みのステータス表示用
 */
export const HEARING_STATUS_LABELS = {
	submitted: "申し込み済み",
	confirmed: "確定済み",
	completed: "実施完了",
	cancelled: "キャンセル",
} as const;

/**
 * 利用状況の表示用ラベル
 */
export const USAGE_STATUS_LABELS = {
	new: "初めて利用する",
	free: "無料プランを利用中",
	basic: "ベーシックプランを利用中",
	premium: "プレミアムプランを利用中",
} as const;

/**
 * ビデオツールの表示用ラベル
 */
export const VIDEO_TOOL_LABELS = {
	googlemeet: "Google Meet",
	zoom: "Zoom",
	teams: "Microsoft Teams",
} as const;

/**
 * Server Actionの返り値型
 */
export interface HearingApplicationResult {
	success: boolean;
	applicationId?: string;
	message?: string;
	error?: string;
	details?: unknown;
}

/**
 * ヒアリング申し込み一覧取得結果型
 */
export interface HearingApplicationsResult {
	success: boolean;
	applications?: HearingApplication[];
	error?: string;
}

/**
 * ステータス更新結果型
 */
export interface StatusUpdateResult {
	success: boolean;
	application?: HearingApplication;
	error?: string;
}
