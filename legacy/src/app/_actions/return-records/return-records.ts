/**
 * 返礼情報に関するServer Actions（統合エクスポート）
 * @module return-records
 */

// 基本CRUD操作
export {
	createReturnEntry,
	getReturnEntryRecord,
	getReturnEntriesByKouden,
	deleteReturnEntry,
	deleteReturnRecords,
} from "./crud";

// 更新操作
export {
	updateReturnEntry,
	updateReturnEntryStatus,
	updateReturnRecordField,
	updateReturnRecordFieldByKoudenEntryId,
} from "./updates";

// 一括操作
export {
	getAllReturnRecordsForBulkUpdate,
	bulkUpdateReturnRecords,
} from "./bulk-operations";

// ページング処理
export { getReturnEntriesByKoudenPaginated } from "./pagination";

// 型定義の再エクスポート
export type {
	ReturnEntryRecord,
	ReturnEntryRecordWithKoudenEntry,
	ReturnStatus,
	CreateReturnEntryInput,
	UpdateReturnEntryInput,
	BulkUpdateConfig,
	ReturnManagementSummary,
	ReturnItem,
} from "@/types/return-records/return-records";
