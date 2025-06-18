"use server";

/**
 * 一括更新のパフォーマンス監視とデバッグユーティリティ
 * @module performance-monitor
 */

interface PerformanceMetrics {
	operation: string;
	startTime: number;
	endTime?: number;
	duration?: number;
	metadata?: Record<string, unknown>;
}

interface BulkUpdateMetrics {
	totalGroups: number;
	totalEntries: number;
	totalReturnItems: number;
	processingTime: number;
	avgTimePerGroup: number;
	avgTimePerEntry: number;
	successRate: number;
}

/**
 * パフォーマンス測定器
 */
export class PerformanceMonitor {
	private metrics: PerformanceMetrics[] = [];

	/**
	 * 操作の開始を記録
	 * @param operation - 操作名
	 * @param metadata - 追加メタデータ
	 * @returns 測定ID
	 */
	start(operation: string, metadata?: Record<string, unknown>): string {
		const id = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.metrics.push({
			operation: `${operation}(${id})`,
			startTime: Date.now(),
			metadata,
		});
		return id;
	}

	/**
	 * 操作の終了を記録
	 * @param operation - 操作名（IDを含む）
	 * @param metadata - 追加メタデータ
	 */
	end(operation: string, metadata?: Record<string, unknown>): void {
		const metric = this.metrics.find((m) => m.operation.includes(operation));
		if (metric) {
			metric.endTime = Date.now();
			metric.duration = metric.endTime - metric.startTime;
			if (metadata) {
				metric.metadata = { ...metric.metadata, ...metadata };
			}
		}
	}

	/**
	 * エラーを記録
	 * @param operation - 操作名
	 * @param error - エラー情報
	 */
	error(operation: string, error: Error | string): void {
		const errorMsg = error instanceof Error ? error.message : error;
		console.error(`❌ エラー: ${operation} - ${errorMsg}`);

		const metric = this.metrics.find((m) => m.operation.includes(operation));
		if (metric) {
			metric.endTime = Date.now();
			metric.duration = metric.endTime - metric.startTime;
			metric.metadata = { ...metric.metadata, error: errorMsg };
		}
	}

	/**
	 * 一括更新の統計情報を計算
	 * @param totalGroups - 処理グループ数
	 * @param totalEntries - 処理エントリー数
	 * @param totalReturnItems - 処理返礼品数
	 * @param successCount - 成功件数
	 * @param failureCount - 失敗件数
	 * @returns 統計情報
	 */
	calculateBulkUpdateMetrics(
		totalGroups: number,
		totalEntries: number,
		totalReturnItems: number,
		successCount: number,
		_failureCount: number,
	): BulkUpdateMetrics {
		const totalTime = this.getTotalDuration();
		const successRate = totalEntries > 0 ? (successCount / totalEntries) * 100 : 0;

		const metrics: BulkUpdateMetrics = {
			totalGroups,
			totalEntries,
			totalReturnItems,
			processingTime: totalTime,
			avgTimePerGroup: totalGroups > 0 ? totalTime / totalGroups : 0,
			avgTimePerEntry: totalEntries > 0 ? totalTime / totalEntries : 0,
			successRate,
		};

		return metrics;
	}

	/**
	 * 全体の処理時間を取得
	 */
	private getTotalDuration(): number {
		const durations = this.metrics
			.filter((m): m is PerformanceMetrics & { duration: number } => m.duration !== undefined)
			.map((m) => m.duration);

		return durations.length > 0 ? Math.max(...durations) : 0;
	}

	/**
	 * メトリクスをクリア
	 */
	clear(): void {
		this.metrics = [];
	}

	/**
	 * 全メトリクスを取得
	 */
	getMetrics(): PerformanceMetrics[] {
		return [...this.metrics];
	}
}

/**
 * バッチ処理の推奨サイズを計算
 * @param totalItems - 総アイテム数
 * @param avgItemProcessingTime - アイテム1件あたりの平均処理時間（ms）
 * @param maxBatchTime - バッチの最大処理時間（ms）
 * @returns 推奨バッチサイズ
 */
export function calculateOptimalBatchSize(
	avgItemProcessingTime = 50, // デフォルト50ms
	maxBatchTime = 5000, // デフォルト5秒
): number {
	const maxItemsPerBatch = Math.floor(maxBatchTime / avgItemProcessingTime);
	const recommendedBatchSize = Math.min(maxItemsPerBatch, 100); // 最大100件

	return Math.max(1, recommendedBatchSize); // 最低1件
}

/**
 * データベースの負荷状況を推定
 * @param concurrentOperations - 同時実行操作数
 * @param avgResponseTime - 平均応答時間（ms）
 * @returns 負荷レベル（1-5）
 */
export function estimateDbLoad(
	concurrentOperations: number,
	avgResponseTime: number,
): { level: number; description: string; recommendation: string } {
	let level: number;
	let description: string;
	let recommendation: string;

	if (avgResponseTime < 100 && concurrentOperations < 3) {
		level = 1;
		description = "軽負荷";
		recommendation = "同時実行数を増やしても問題なし";
	} else if (avgResponseTime < 300 && concurrentOperations < 5) {
		level = 2;
		description = "普通";
		recommendation = "現在の設定を維持";
	} else if (avgResponseTime < 500 && concurrentOperations < 7) {
		level = 3;
		description = "やや高負荷";
		recommendation = "同時実行数を減らすことを検討";
	} else if (avgResponseTime < 1000) {
		level = 4;
		description = "高負荷";
		recommendation = "バッチサイズと同時実行数を減らす";
	} else {
		level = 5;
		description = "過負荷";
		recommendation = "処理を一時停止し、システム状況を確認";
	}

	return { level, description, recommendation };
}
