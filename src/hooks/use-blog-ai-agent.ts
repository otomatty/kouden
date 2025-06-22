"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type {
	ChatMessage,
	BlogMetadata,
	SuggestionOption,
	ClarifyingQuestion,
} from "@/types/blog-ai-agent";
import { generateInitialMessage } from "@/utils/blog-ai-agent";
import { callAI, processQuestionAnswers } from "@/services/blog-ai-service";
import { generateSlugFromTitle, generateSlugFromTitleSync } from "@/utils/slug-generator";

interface UseBlogAIAgentParams {
	metadata: BlogMetadata;
	content: string;
	onMetadataChange: (metadata: BlogMetadata) => void;
	onContentChange: (content: string) => void;
	pageType: "new" | "edit";
}

export function useBlogAIAgent({
	metadata,
	content,
	onMetadataChange,
	onContentChange,
	pageType,
}: UseBlogAIAgentParams) {
	// 最新の値を参照するためのref
	const metadataRef = useRef(metadata);
	const contentRef = useRef(content);

	// refを最新の値で更新
	useEffect(() => {
		metadataRef.current = metadata;
	}, [metadata]);

	useEffect(() => {
		contentRef.current = content;
	}, [content]);

	// 初期メッセージを動的に生成
	const [messages, setMessages] = useState<ChatMessage[]>(() => [
		{
			id: "welcome",
			role: "assistant",
			content: generateInitialMessage(pageType, metadata, content),
			timestamp: new Date(),
			type: "suggestion",
			canRetry: false,
		},
	]);

	const [inputMessage, setInputMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// 逆質問の回答を管理する状態
	const [pendingQuestions, setPendingQuestions] = useState<ClarifyingQuestion[]>([]);
	const [questionAnswers, setQuestionAnswers] = useState<
		Array<{
			questionId: string;
			answer: string;
			category: string;
		}>
	>([]);

	// メッセージリストの最下部にスクロール
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	// 記事情報が更新された時に初期メッセージも更新
	useEffect(() => {
		setMessages((prev) => {
			if (prev.length === 0) return prev;
			return [
				{
					...prev[0],
					content: generateInitialMessage(pageType, metadata, content),
					canRetry: false,
				} as ChatMessage,
				...prev.slice(1),
			];
		});
	}, [pageType, metadata, content]);

	// 逆質問に回答する処理
	const handleQuestionAnswer = useCallback(
		async (questionId: string, answer: string) => {
			const question = pendingQuestions.find((q) => q.id === questionId);
			if (!question) return;

			// 回答を記録
			const newAnswer = {
				questionId,
				answer,
				category: question.category,
			};

			const updatedAnswers = [...questionAnswers, newAnswer];
			setQuestionAnswers(updatedAnswers);

			// 質問を回答済みにマーク
			setPendingQuestions((prev) =>
				prev.map((q) => (q.id === questionId ? { ...q, answered: true, answer } : q)),
			);

			// ユーザーの回答をメッセージに追加
			const userAnswerMessage: ChatMessage = {
				id: `answer-${Date.now()}`,
				role: "user",
				content: `${question.question}\n→ ${answer}`,
				timestamp: new Date(),
				canRetry: true,
			};

			setMessages((prev) => [...prev, userAnswerMessage]);

			// 全ての質問に回答したか確認
			const allAnswered = pendingQuestions.every(
				(q) => q.id === questionId || questionAnswers.some((qa) => qa.questionId === q.id),
			);

			if (allAnswered) {
				setIsLoading(true);
				try {
					// 最新の値を使用して回答を処理
					const currentMetadata = metadataRef.current;
					const currentContent = contentRef.current;

					// 回答を基に具体的な提案を生成
					const aiResponse = await processQuestionAnswers(
						updatedAnswers,
						currentMetadata,
						currentContent,
						pageType,
					);

					const assistantMessage: ChatMessage = {
						id: `response-${Date.now()}`,
						role: "assistant",
						content: aiResponse.message,
						timestamp: new Date(),
						type: aiResponse.type,
						options: aiResponse.options,
						canRetry: true,
					};

					setMessages((prev) => [...prev, assistantMessage]);

					// 質問状態をリセット
					setPendingQuestions([]);
					setQuestionAnswers([]);
				} catch (error) {
					console.error("Error processing question answers:", error);
					const errorMessage: ChatMessage = {
						id: `error-${Date.now()}`,
						role: "assistant",
						content: "申し訳ありません。回答の処理中にエラーが発生しました。",
						timestamp: new Date(),
						type: "suggestion",
						canRetry: true,
					};
					setMessages((prev) => [...prev, errorMessage]);
				} finally {
					setIsLoading(false);
				}
			}
		},
		[pendingQuestions, questionAnswers, pageType],
	);

	// 選択肢を選択したときの処理
	const handleOptionSelect = useCallback(
		(messageId: string, option: SuggestionOption) => {
			// カテゴリ型の選択肢の場合は子選択肢を表示
			if (option.type === "category" && option.children) {
				// 新しいメッセージとして子選択肢を表示
				const categoryMessage: ChatMessage = {
					id: `category-${Date.now()}`,
					role: "assistant",
					content: `「${option.title}」の具体的な改善方法をお選びください：`,
					timestamp: new Date(),
					type: "options",
					options: option.children,
					canRetry: true,
				};

				setMessages((prev) => [...prev, categoryMessage]);
				return;
			}

			// 通常の選択肢の場合は従来通りの処理
			// メッセージを更新して選択済みにする
			setMessages((prev) =>
				prev.map((msg) => (msg.id === messageId ? { ...msg, selectedOptionId: option.id } : msg)),
			);

			// 選択された内容を適用
			if (option.data) {
				if (option.data.metadata) {
					const newMetadata = { ...metadataRef.current, ...option.data.metadata };

					// タイトルが変更された場合、slugも自動生成
					if (
						option.data.metadata?.title &&
						option.data.metadata.title !== metadataRef.current.title
					) {
						// 非同期でslugを生成
						generateSlugFromTitle(option.data.metadata.title)
							.then((slug) => {
								const updatedMetadata = { ...newMetadata, slug };
								onMetadataChange(updatedMetadata);
							})
							.catch((error) => {
								console.error("Slug generation failed:", error);
								// フォールバックとして同期版を使用
								const fallbackSlug = generateSlugFromTitleSync(option.data?.metadata?.title || "");
								const updatedMetadata = { ...newMetadata, slug: fallbackSlug };
								onMetadataChange(updatedMetadata);
							});

						// 一時的にタイトルのみ更新（slugは後で更新）
						onMetadataChange(newMetadata);
					} else {
						onMetadataChange(newMetadata);
					}
				}
				if (option.data.content) {
					onContentChange(option.data.content);
				}
			}

			// 適用完了メッセージを追加
			const confirmMessage: ChatMessage = {
				id: `confirm-${Date.now()}`,
				role: "assistant",
				content: `「${option.title}」を適用しました。他にご要望はありますか？`,
				timestamp: new Date(),
				type: "suggestion",
				canRetry: false,
			};

			setMessages((prev) => [...prev, confirmMessage]);
		},
		[onMetadataChange, onContentChange],
	);

	// 選択肢の変更（再選択）処理
	const handleOptionChange = useCallback((messageId: string) => {
		// 選択を取り消して選択肢一覧を再表示
		setMessages((prev) =>
			prev.map((msg) => (msg.id === messageId ? { ...msg, selectedOptionId: undefined } : msg)),
		);

		// 変更開始メッセージを追加
		const changeMessage: ChatMessage = {
			id: `change-${Date.now()}`,
			role: "assistant",
			content: "選択肢を変更できます。お好みの選択肢をお選びください。",
			timestamp: new Date(),
			type: "suggestion",
			canRetry: false,
		};

		setMessages((prev) => [...prev, changeMessage]);
	}, []);

	// メッセージ送信処理
	const handleSendMessage = useCallback(async () => {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			role: "user",
			content: inputMessage,
			timestamp: new Date(),
			canRetry: true,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputMessage("");
		setIsLoading(true);

		try {
			// refから最新のフォーム状態を取得
			const currentMetadata = metadataRef.current;
			const currentContent = contentRef.current;

			// デバッグ用ログ（開発環境のみ）
			if (process.env.NODE_ENV === "development") {
				console.log("AI Chat - Current form state:", {
					title: currentMetadata.title,
					contentLength: currentContent.length,
					contentPreview:
						currentContent.substring(0, 100) + (currentContent.length > 100 ? "..." : ""),
					userMessage: inputMessage,
				});
			}

			const aiResponse = await callAI({
				userMessage: inputMessage,
				metadata: currentMetadata,
				content: currentContent,
				pageType,
				messagesLength: messages.length,
				questionAnswers: questionAnswers.length > 0 ? questionAnswers : undefined,
			});

			// 逆質問の場合
			if (aiResponse.type === "question" && aiResponse.questions) {
				setPendingQuestions(aiResponse.questions);

				const questionMessage: ChatMessage = {
					id: (Date.now() + 1).toString(),
					role: "assistant",
					content: aiResponse.message,
					timestamp: new Date(),
					type: "question",
					questions: aiResponse.questions,
					canRetry: true,
				};

				setMessages((prev) => [...prev, questionMessage]);
			} else {
				// 通常の応答
				const assistantMessage: ChatMessage = {
					id: (Date.now() + 1).toString(),
					role: "assistant",
					content: aiResponse.message,
					timestamp: new Date(),
					type: aiResponse.type,
					options: aiResponse.options,
					canRetry: true,
				};

				setMessages((prev) => [...prev, assistantMessage]);
			}
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "申し訳ありません。メッセージの処理中にエラーが発生しました。",
				timestamp: new Date(),
				type: "suggestion",
				canRetry: true,
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	}, [inputMessage, isLoading, messages.length, pageType, questionAnswers]);

	// 定型的な質問ボタン
	const handleQuickQuestion = useCallback((question: string) => {
		setInputMessage(question);
	}, []);

	// チャットのやり直し機能
	const handleRetryFromMessage = useCallback((messageId: string) => {
		setMessages((prev) => {
			const messageIndex = prev.findIndex((msg) => msg.id === messageId);
			if (messageIndex === -1) return prev;

			// 指定されたメッセージ以降を削除
			const newMessages = prev.slice(0, messageIndex);

			// やり直しポイントをクリア
			return newMessages.map((msg) => ({
				...msg,
				isRetryPoint: false,
			}));
		});

		// 関連する状態もリセット
		setPendingQuestions([]);
		setQuestionAnswers([]);
		setIsLoading(false);

		// やり直し開始メッセージを追加
		const retryMessage: ChatMessage = {
			id: `retry-${Date.now()}`,
			role: "assistant",
			content: "こちらからやり直しましょう。新しい指示をお聞かせください。",
			timestamp: new Date(),
			type: "suggestion",
			canRetry: false,
		};

		setMessages((prev) => [...prev, retryMessage]);
	}, []);

	// メッセージを編集してやり直す機能
	const handleEditAndRetry = useCallback((messageId: string, newContent: string) => {
		setMessages((prev) => {
			const messageIndex = prev.findIndex((msg) => msg.id === messageId);
			if (messageIndex === -1) return prev;

			// 指定されたメッセージを更新し、それ以降を削除
			const updatedMessage = {
				...prev[messageIndex],
				content: newContent,
				timestamp: new Date(),
			} as ChatMessage;

			const newMessages = prev.slice(0, messageIndex + 1);
			newMessages[messageIndex] = updatedMessage;

			return newMessages.map((msg) => ({
				...msg,
				isRetryPoint: false,
			}));
		});

		// 関連する状態をリセット
		setPendingQuestions([]);
		setQuestionAnswers([]);
		setIsLoading(false);

		// 編集されたメッセージの内容を入力欄にセット
		setInputMessage(newContent);

		// 編集完了メッセージを追加
		const editMessage: ChatMessage = {
			id: `edit-${Date.now()}`,
			role: "assistant",
			content: "メッセージを編集しました。送信ボタンを押して再実行してください。",
			timestamp: new Date(),
			type: "suggestion",
			canRetry: false,
		};

		setMessages((prev) => [...prev, editMessage]);
	}, []);

	// メッセージにやり直しポイントをマークする機能
	const handleMarkRetryPoint = useCallback((messageId: string) => {
		setMessages((prev) =>
			prev.map((msg) => ({
				...msg,
				isRetryPoint: msg.id === messageId,
			})),
		);
	}, []);

	return {
		messages,
		inputMessage,
		setInputMessage,
		isLoading,
		messagesEndRef,
		handleOptionSelect,
		handleOptionChange,
		handleSendMessage,
		handleQuickQuestion,
		// 逆質問機能
		pendingQuestions,
		handleQuestionAnswer,
		// やり直し機能
		handleRetryFromMessage,
		handleEditAndRetry,
		handleMarkRetryPoint,
	};
}
