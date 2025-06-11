export interface Case {
	id: string;
	title: string;
	date: string;
	location: string;
}
export const mockCases: Case[] = [
	{ id: "1", title: "山田様お別れの会", date: "2025-06-10", location: "東京会館" },
	{ id: "2", title: "鈴木様お別れの会", date: "2025-06-12", location: "大阪会堂" },
];

export interface Attendee {
	id: string;
	name: string;
	relation: string;
	caseId: string;
}
export const mockAttendees: Attendee[] = [
	{ id: "1", name: "田中太郎", relation: "友人", caseId: "1" },
	{ id: "2", name: "佐藤花子", relation: "親戚", caseId: "1" },
];

export interface Donation {
	id: string;
	name: string;
	amount: number;
	message: string;
	caseId: string;
}
export const mockDonations: Donation[] = [
	{ id: "1", name: "田中太郎", amount: 5000, message: "ご冥福をお祈りします", caseId: "1" },
	{ id: "2", name: "佐藤花子", amount: 10000, message: "", caseId: "1" },
];

export interface Contact {
	id: string;
	name: string;
	method: string;
	status: string;
}
export const mockContacts: Contact[] = [
	{ id: "1", name: "山田太郎", method: "メール", status: "送信済み" },
	{ id: "2", name: "鈴木一郎", method: "SMS", status: "未送信" },
];

export interface MonthlyReport {
	month: string;
	total: number;
}
export const mockMonthlyReports: MonthlyReport[] = [
	{ month: "2025-04", total: 150000 },
	{ month: "2025-05", total: 200000 },
];

export interface VenueUsage {
	venue: string;
	count: number;
}
export const mockVenueUsage: VenueUsage[] = [
	{ venue: "東京会館", count: 5 },
	{ venue: "大阪会堂", count: 3 },
];

export interface User {
	id: string;
	name: string;
	role: string;
}
export const mockUsers: User[] = [
	{ id: "1", name: "管理者A", role: "管理者" },
	{ id: "2", name: "担当者B", role: "担当者" },
];

// Settings mock
export interface Setting {
	id: string;
	name: string;
	enabled: boolean;
}
export const mockSettings: Setting[] = [
	{ id: "sms", name: "SMS通知", enabled: false },
	{ id: "email", name: "Email通知", enabled: true },
];
