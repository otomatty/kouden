"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SurveyModal } from "./survey-modal";
import { getUserSurveyStatus, checkOneWeekOwnershipSurvey } from "@/app/_actions/user-surveys";
import type { SurveyTrigger as SurveyTriggerType } from "@/schemas/user-surveys";

interface SurveyTriggerProps {
	trigger: SurveyTriggerType;
	/** PDF出力成功時のトリガーの場合に使用 */
	shouldShow?: boolean;
	/** アンケート表示後のコールバック */
	onShown?: () => void;
}

/**
 * アンケート表示の判定とトリガー管理を行うコンポーネント
 */
export function SurveyTrigger({ trigger, shouldShow = false, onShown }: SurveyTriggerProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const isCheckingRef = useRef(false);

	/**
	 * アンケート表示の可否を判定
	 */
	const checkShouldShowSurvey = useCallback(async (): Promise<boolean> => {
		if (isCheckingRef.current) return false;

		isCheckingRef.current = true;
		try {
			// 既に回答済みかスキップ済みかチェック
			const surveyStatus = await getUserSurveyStatus(trigger);
			if (surveyStatus.hasAnswered || surveyStatus.isSkipped) {
				return false;
			}

			switch (trigger) {
				case "pdf_export":
					// PDF出力後トリガーの場合、shouldShowプロップで制御
					return shouldShow;

				case "one_week_usage":
					// 1週間経過チェック
					return await checkOneWeekOwnershipSurvey();

				default:
					return false;
			}
		} catch (error) {
			console.error("アンケート表示判定エラー:", error);
			return false;
		} finally {
			isCheckingRef.current = false;
		}
	}, [trigger, shouldShow]);

	/**
	 * PDF出力後トリガーの場合の処理
	 */
	useEffect(() => {
		if (trigger === "pdf_export" && shouldShow) {
			const showSurvey = async () => {
				const shouldDisplay = await checkShouldShowSurvey();
				if (shouldDisplay) {
					setIsModalOpen(true);
					onShown?.();
				}
			};

			showSurvey();

			// 少し遅延させて自然な表示にする
			// const timer = setTimeout(showSurvey, 1000);
			// return () => clearTimeout(timer);
		}
	}, [trigger, shouldShow, checkShouldShowSurvey, onShown]);

	/**
	 * 1週間後トリガーの場合の処理
	 */
	useEffect(() => {
		if (trigger === "one_week_usage") {
			const showSurvey = async () => {
				const shouldDisplay = await checkShouldShowSurvey();
				if (shouldDisplay) {
					setIsModalOpen(true);
					onShown?.();
				}
			};

			showSurvey();
		}
	}, [trigger, checkShouldShowSurvey, onShown]);

	const handleClose = () => {
		setIsModalOpen(false);
	};

	const handleSuccess = () => {
		setIsModalOpen(false);
	};

	return (
		<SurveyModal
			trigger={trigger}
			isOpen={isModalOpen}
			onClose={handleClose}
			onSuccess={handleSuccess}
		/>
	);
}

/**
 * PDF出力後アンケートトリガー用のヘルパーコンポーネント
 */
interface PdfExportSurveyTriggerProps {
	showSurvey: boolean;
	onShown?: () => void;
}

export function PdfExportSurveyTrigger({ showSurvey, onShown }: PdfExportSurveyTriggerProps) {
	return <SurveyTrigger trigger="pdf_export" shouldShow={showSurvey} onShown={onShown} />;
}

/**
 * 1週間経過後アンケートトリガー用のヘルパーコンポーネント
 */
interface OneWeekSurveyTriggerProps {
	onShown?: () => void;
}

export function OneWeekSurveyTrigger({ onShown }: OneWeekSurveyTriggerProps) {
	return <SurveyTrigger trigger="one_week_usage" onShown={onShown} />;
}
