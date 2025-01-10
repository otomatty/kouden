import type {
	UpdateKoudenEntryInput,
	KoudenEntryResponse,
	CreateKoudenEntryInput,
} from "@/types/actions";
import type { KoudenEntry } from "@/types/kouden";

export interface KoudenEntrySpreadsheetProps {
	entries: KoudenEntry[];
	koudenId: string;
	updateKoudenEntry: (
		id: string,
		input: UpdateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
	createKoudenEntry: (
		input: CreateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
	deleteKoudenEntries: (ids: string[]) => Promise<void>;
}

export interface SpreadsheetData {
	id: string;
	name: string;
	organization: string;
	position: string;
	relationship?: string;
	amount: number;
	postal_code: string;
	address: string;
	phone_number: string;
	attendance_type: "葬儀" | "弔問" | "欠席" | null;
	has_offering: "有" | "無";
	notes: string;
	isSelected?: boolean;
}

export const ATTENDANCE_OPTIONS = ["葬儀", "弔問", "欠席"] as const;
export const BOOLEAN_OPTIONS = ["有", "無"] as const;
export const COMPLETION_OPTIONS = ["済", "未"] as const;
export const AMOUNT_OPTIONS = [
	1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 100000,
] as const;
