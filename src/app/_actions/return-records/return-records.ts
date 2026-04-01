/**
 * 返礼情報に関するServer Actions（統合エクスポート）
 * @module return-records
 */

// 型定義の再エクスポート
export type {
	BulkUpdateConfig,
	CreateReturnEntryInput,
	ReturnEntryRecord,
	ReturnEntryRecordWithKoudenEntry,
	ReturnItem,
	ReturnManagementSummary,
	ReturnStatus,
	UpdateReturnEntryInput,
} from "@/types/return-records/return-records";
// 一括操作
export {
	bulkUpdateReturnRecords,
	getAllReturnRecordsForBulkUpdate,
} from "./bulk-operations";
// 基本CRUD操作
export {
	createReturnEntry,
	deleteReturnEntry,
	deleteReturnRecords,
	getReturnEntriesByKouden,
	getReturnEntryRecord,
} from "./crud";

// ページング処理
export { getReturnEntriesByKoudenPaginated } from "./pagination";
// 更新操作
export {
	updateReturnEntry,
	updateReturnEntryStatus,
	updateReturnRecordField,
	updateReturnRecordFieldByKoudenEntryId,
} from "./updates";
