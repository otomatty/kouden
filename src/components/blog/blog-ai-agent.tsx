"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Bot,
	User,
	Send,
	Sparkles,
	FileText,
	Edit,
	Lightbulb,
	Loader2,
	Check,
	X,
	ChevronRight,
	FolderOpen,
	HelpCircle,
	RotateCcw,
	Edit3,
	MoreHorizontal,
} from "lucide-react";

// 分割されたコンポーネントとフックをインポート
import type {
	BlogAIAgentProps,
	ChatMessage,
	SuggestionOption,
	ClarifyingQuestion,
} from "@/types/blog-ai-agent";
import { ChatMessageContent } from "./chat-markdown";
import { useBlogAIAgent } from "@/hooks/use-blog-ai-agent";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

// UI関連のヘルパー関数群
const getMessageIcon = (message: ChatMessage) => {
	if (message.role === "user") return <User className="h-4 w-4" />;

	switch (message.type) {
		case "edit":
			return <Edit className="h-4 w-4" />;
		case "metadata":
			return <FileText className="h-4 w-4" />;
		case "content":
			return <Sparkles className="h-4 w-4" />;
		case "options":
			return <Lightbulb className="h-4 w-4" />;
		case "question":
			return <HelpCircle className="h-4 w-4" />;
		default:
			return <Bot className="h-4 w-4" />;
	}
};

const getMessageBadge = (message: ChatMessage) => {
	if (message.role === "user") return null;

	switch (message.type) {
		case "edit":
			return (
				<Badge variant="secondary" className="text-xs">
					編集提案
				</Badge>
			);
		case "metadata":
			return (
				<Badge variant="secondary" className="text-xs">
					メタデータ
				</Badge>
			);
		case "content":
			return (
				<Badge variant="secondary" className="text-xs">
					コンテンツ
				</Badge>
			);
		case "options":
			return (
				<Badge variant="outline" className="text-xs">
					選択肢
				</Badge>
			);
		case "question":
			return (
				<Badge variant="default" className="text-xs">
					質問
				</Badge>
			);
		case "suggestion":
			return (
				<Badge variant="outline" className="text-xs">
					提案
				</Badge>
			);
		default:
			return null;
	}
};

// 定型的な質問ボタンの設定
const quickQuestions = [
	{ text: "タイトルを改善して", icon: <Edit className="h-4 w-4" /> },
	{ text: "記事の構成を提案して", icon: <FileText className="h-4 w-4" /> },
	{ text: "SEO最適化のアドバイス", icon: <Lightbulb className="h-4 w-4" /> },
	{ text: "文章を校正して", icon: <Sparkles className="h-4 w-4" /> },
];

/**
 * AI執筆エージェントコンポーネント
 * Gemini APIを使用してブログ記事の執筆支援を行う
 * 複数案提示型のインタラクションをサポート
 */
export function BlogAIAgent({
	metadata,
	content,
	onMetadataChange,
	onContentChange,
	pageType = "new",
	className,
}: BlogAIAgentProps) {
	// カスタムフックから状態とハンドラーを取得
	const {
		messages,
		inputMessage,
		setInputMessage,
		isLoading,
		messagesEndRef,
		handleOptionSelect,
		handleOptionChange,
		handleSendMessage,
		handleQuickQuestion,
		// pendingQuestions,
		handleQuestionAnswer,
		// やり直し機能
		handleRetryFromMessage,
		handleEditAndRetry,
		handleMarkRetryPoint,
	} = useBlogAIAgent({
		metadata,
		content,
		onMetadataChange,
		onContentChange,
		pageType,
	});

	// 選択肢UIのレンダリング
	const renderOptions = (message: ChatMessage) => {
		if (!message.options || message.selectedOptionId) return null;

		return (
			<div className="mt-3 space-y-2 w-full overflow-hidden">
				{message.options.map((option) => (
					<HoverCard key={option.id}>
						<HoverCardTrigger asChild>
							<Button
								variant="outline"
								className={`w-full text-left justify-start h-auto p-3 hover:bg-muted/50 transition-colors min-w-0 ${
									option.type === "category"
										? "border-blue-200 bg-blue-50/30 hover:bg-blue-50/50"
										: ""
								}`}
								onClick={() => handleOptionSelect(message.id, option)}
							>
								<div className="flex items-center gap-2 flex-1 min-w-0">
									<div className="flex-shrink-0">
										{option.type === "category" ? (
											<FolderOpen className="h-4 w-4 text-blue-600" />
										) : option.type === "metadata" ? (
											<FileText className="h-4 w-4 text-purple-600" />
										) : option.type === "content" ? (
											<Sparkles className="h-4 w-4 text-green-600" />
										) : option.type === "edit" ? (
											<Edit className="h-4 w-4 text-orange-600" />
										) : (
											<Lightbulb className="h-4 w-4 text-gray-600" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm flex items-center gap-1 truncate">
											<span className="truncate">{option.title}</span>
											{option.type === "category" && (
												<ChevronRight className="h-3 w-3 text-blue-600 flex-shrink-0" />
											)}
										</div>
										<div className="text-xs text-muted-foreground mt-1 line-clamp-2">
											{option.description}
										</div>
									</div>
								</div>
								<div className="ml-2 flex-shrink-0">
									<Badge
										variant={option.type === "category" ? "default" : "secondary"}
										className="text-xs"
									>
										{option.type === "category" && "カテゴリ"}
										{option.type === "metadata" && "メタデータ"}
										{option.type === "content" && "コンテンツ"}
										{option.type === "edit" && "編集"}
										{option.type === "suggestion" && "提案"}
									</Badge>
								</div>
							</Button>
						</HoverCardTrigger>
						<HoverCardContent className="w-80 p-4" side="top" align="start">
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									{option.type === "category" ? (
										<FolderOpen className="h-5 w-5 text-blue-600" />
									) : option.type === "metadata" ? (
										<FileText className="h-5 w-5 text-purple-600" />
									) : option.type === "content" ? (
										<Sparkles className="h-5 w-5 text-green-600" />
									) : option.type === "edit" ? (
										<Edit className="h-5 w-5 text-orange-600" />
									) : (
										<Lightbulb className="h-5 w-5 text-gray-600" />
									)}
									<div className="flex items-center gap-2">
										<h4 className="font-semibold text-sm">{option.title}</h4>
										<Badge
											variant={option.type === "category" ? "default" : "secondary"}
											className="text-xs"
										>
											{option.type === "category" && "カテゴリ"}
											{option.type === "metadata" && "メタデータ"}
											{option.type === "content" && "コンテンツ"}
											{option.type === "edit" && "編集"}
											{option.type === "suggestion" && "提案"}
										</Badge>
									</div>
								</div>
								<div className="text-sm text-muted-foreground leading-relaxed">
									{option.description}
								</div>
								{option.data && (
									<div className="border-t pt-3 space-y-2">
										<div className="text-xs font-medium text-muted-foreground">プレビュー:</div>
										{option.data.metadata?.title && (
											<div className="text-xs">
												<span className="font-medium">タイトル: </span>
												<span className="text-muted-foreground">{option.data.metadata.title}</span>
											</div>
										)}
										{option.data.content && (
											<div className="text-xs">
												<span className="font-medium">コンテンツ: </span>
												<span className="text-muted-foreground line-clamp-3">
													{option.data.content.substring(0, 100)}
													{option.data.content.length > 100 && "..."}
												</span>
											</div>
										)}
									</div>
								)}
								<div className="text-xs text-muted-foreground border-t pt-2">クリックして適用</div>
							</div>
						</HoverCardContent>
					</HoverCard>
				))}
			</div>
		);
	};

	// 選択済みオプションの表示
	const renderSelectedOption = (message: ChatMessage) => {
		const hasSelectedOption = message.selectedOptionId && message.options;
		if (!hasSelectedOption) return null;

		const selectedOption = message.options?.find((opt) => opt.id === message.selectedOptionId);
		if (!selectedOption) return null;

		return (
			<div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg w-full overflow-hidden">
				<div className="flex items-center justify-between gap-2 min-w-0">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<Check className="h-4 w-4 text-green-600 flex-shrink-0" />
						<span className="text-sm font-medium text-green-800 truncate">
							選択済み: {selectedOption.title}
						</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleOptionChange(message.id)}
						className="text-xs h-7 px-2 hover:bg-green-100 flex-shrink-0"
					>
						<Edit className="h-3 w-3 mr-1" />
						変更
					</Button>
				</div>
				<div className="text-xs text-green-700 mt-1 pl-6 line-clamp-2">
					{selectedOption.description}
				</div>
			</div>
		);
	};

	// 逆質問UIのレンダリング
	const renderQuestions = (message: ChatMessage) => {
		if (!message.questions || message.questions.length === 0) return null;

		return (
			<div className="mt-3 space-y-3 w-full">
				<div className="text-sm font-medium text-muted-foreground">
					以下の質問にお答えください：
				</div>
				{message.questions.map((question) => (
					<QuestionCard key={question.id} question={question} onAnswer={handleQuestionAnswer} />
				))}
			</div>
		);
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<Bot className="h-5 w-5" />
					AI執筆アシスタント
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 flex flex-col h-[calc(100vh-12rem)]">
				{/* チャットメッセージエリア */}
				<div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
					<div className="space-y-4 w-full max-w-full">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex gap-3 w-full group ${
									message.role === "user" ? "flex-row-reverse" : "flex-row"
								}`}
							>
								<div
									className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
										message.role === "user"
											? "text-left bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{getMessageIcon(message)}
								</div>
								<div
									className={`flex-1 space-y-1 min-w-0 ${
										message.role === "user" ? "text-right" : "text-left"
									}`}
								>
									<div className="flex items-center gap-2">
										{message.role === "assistant" && getMessageBadge(message)}
										<span className="text-xs text-muted-foreground">
											{message.timestamp.toLocaleTimeString()}
										</span>
									</div>
									<div
										className={`inline-block p-3 rounded-lg max-w-[80%] w-full ${
											message.role === "user"
												? "bg-primary text-primary-foreground ml-auto"
												: "bg-muted text-foreground"
										} ${message.isRetryPoint ? "ring-2 ring-blue-500 ring-opacity-50" : ""}`}
									>
										<ChatMessageContent content={message.content} />
										{message.role === "assistant" && (
											<>
												{renderOptions(message)}
												{renderSelectedOption(message)}
												{renderQuestions(message)}
											</>
										)}
									</div>
									{/* やり直しアクションボタン */}
									<MessageActions
										message={message}
										onRetryFromMessage={handleRetryFromMessage}
										onEditAndRetry={handleEditAndRetry}
										onMarkRetryPoint={handleMarkRetryPoint}
									/>
								</div>
							</div>
						))}
						{isLoading && (
							<div className="flex gap-3 w-full">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
									<Loader2 className="h-4 w-4 animate-spin" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="inline-block p-3 rounded-lg bg-muted text-foreground">
										<p className="text-sm">考え中...</p>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				</div>

				<Separator />

				{/* クイック質問ボタン */}
				<div className="p-4 space-y-3 flex-shrink-0">
					<div className="flex flex-wrap gap-2">
						{quickQuestions.map((question) => (
							<Button
								key={question.text}
								variant="outline"
								size="sm"
								onClick={() => handleQuickQuestion(question.text)}
								className="text-xs"
							>
								{question.icon}
								<span className="ml-1">{question.text}</span>
							</Button>
						))}
					</div>

					{/* メッセージ入力エリア */}
					<div className="flex gap-2">
						<Textarea
							value={inputMessage}
							onChange={(e) => setInputMessage(e.target.value)}
							placeholder="AIに質問や依頼を入力してください..."
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSendMessage();
								}
							}}
							disabled={isLoading}
						/>
						<Button
							onClick={handleSendMessage}
							disabled={!inputMessage.trim() || isLoading}
							size="icon"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * 質問カードコンポーネント
 */
interface QuestionCardProps {
	question: ClarifyingQuestion;
	onAnswer: (questionId: string, answer: string) => void;
}

function QuestionCard({ question, onAnswer }: QuestionCardProps) {
	const [answer, setAnswer] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = () => {
		if (answer.trim() && !isSubmitted) {
			onAnswer(question.id, answer.trim());
			setIsSubmitted(true);
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "topic":
				return <FileText className="h-4 w-4" />;
			case "audience":
				return <User className="h-4 w-4" />;
			case "purpose":
				return <Lightbulb className="h-4 w-4" />;
			case "format":
				return <Edit className="h-4 w-4" />;
			case "tone":
				return <Sparkles className="h-4 w-4" />;
			case "details":
				return <FolderOpen className="h-4 w-4" />;
			default:
				return <HelpCircle className="h-4 w-4" />;
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "topic":
				return "text-blue-600 bg-blue-50 border-blue-200";
			case "audience":
				return "text-purple-600 bg-purple-50 border-purple-200";
			case "purpose":
				return "text-green-600 bg-green-50 border-green-200";
			case "format":
				return "text-orange-600 bg-orange-50 border-orange-200";
			case "tone":
				return "text-pink-600 bg-pink-50 border-pink-200";
			case "details":
				return "text-gray-600 bg-gray-50 border-gray-200";
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	if (isSubmitted) {
		return (
			<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
				<div className="flex items-center gap-2">
					<Check className="h-4 w-4 text-green-600" />
					<span className="text-sm font-medium text-green-800">回答済み</span>
				</div>
				<div className="text-sm text-green-700 mt-1">{question.question}</div>
				<div className="text-sm text-green-600 mt-1 pl-6">→ {answer}</div>
			</div>
		);
	}

	return (
		<div className={`p-3 border rounded-lg ${getCategoryColor(question.category)}`}>
			<div className="flex items-start gap-2 mb-2">
				{getCategoryIcon(question.category)}
				<div className="flex-1">
					<div className="text-sm font-medium">{question.question}</div>
					<div className="text-xs text-muted-foreground mt-1">
						{question.category === "topic" && "テーマ・トピック"}
						{question.category === "audience" && "読者層"}
						{question.category === "purpose" && "目的・ゴール"}
						{question.category === "format" && "記事形式"}
						{question.category === "tone" && "文体・トーン"}
						{question.category === "details" && "詳細情報"}
					</div>
				</div>
			</div>
			<div className="space-y-2">
				<Textarea
					value={answer}
					onChange={(e) => setAnswer(e.target.value)}
					placeholder="こちらに回答を入力してください..."
					className="min-h-[60px] text-sm"
					onKeyDown={(e) => {
						if (e.key === "Enter" && e.ctrlKey) {
							e.preventDefault();
							handleSubmit();
						}
					}}
				/>
				<div className="flex justify-between items-center">
					<div className="text-xs text-muted-foreground">Ctrl + Enter で送信</div>
					<Button size="sm" onClick={handleSubmit} disabled={!answer.trim()} className="text-xs">
						<Send className="h-3 w-3 mr-1" />
						送信
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * メッセージアクションボタンコンポーネント
 */
interface MessageActionsProps {
	message: ChatMessage;
	onRetryFromMessage: (messageId: string) => void;
	onEditAndRetry: (messageId: string, newContent: string) => void;
	onMarkRetryPoint: (messageId: string) => void;
}

function MessageActions({
	message,
	onRetryFromMessage,
	onEditAndRetry,
	onMarkRetryPoint,
}: MessageActionsProps) {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editContent, setEditContent] = useState(message.content);

	const handleEditSubmit = () => {
		if (editContent.trim() && editContent !== message.content) {
			onEditAndRetry(message.id, editContent.trim());
			setIsEditDialogOpen(false);
		}
	};

	// 初回メッセージや確認メッセージなど、やり直し不可のメッセージは非表示
	if (!message.canRetry || message.id === "welcome") {
		return null;
	}

	return (
		<div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
						<MoreHorizontal className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-48">
					<DropdownMenuItem onClick={() => onRetryFromMessage(message.id)} className="text-xs">
						<RotateCcw className="h-3 w-3 mr-2" />
						ここからやり直し
					</DropdownMenuItem>
					{message.role === "user" && (
						<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
							<DialogTrigger asChild>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs">
									<Edit3 className="h-3 w-3 mr-2" />
									編集してやり直し
								</DropdownMenuItem>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>メッセージを編集</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<Textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										className="min-h-[100px]"
										placeholder="メッセージを編集してください..."
									/>
									<div className="flex justify-end gap-2">
										<Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
											キャンセル
										</Button>
										<Button
											size="sm"
											onClick={handleEditSubmit}
											disabled={!editContent.trim() || editContent === message.content}
										>
											編集して再実行
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					)}
					<DropdownMenuItem onClick={() => onMarkRetryPoint(message.id)} className="text-xs">
						<Check className="h-3 w-3 mr-2" />
						{message.isRetryPoint ? "マーク解除" : "やり直しポイント"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{message.isRetryPoint && (
				<Badge variant="secondary" className="text-xs ml-1">
					やり直しポイント
				</Badge>
			)}
		</div>
	);
}
