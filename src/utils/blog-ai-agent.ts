import type { BlogMetadata, SuggestionOption, ArticleState } from "@/types/blog-ai-agent";

/**
 * 記事の状態を分析する関数
 */
export const analyzeArticleState = (metadata: BlogMetadata, content: string): ArticleState => {
	const hasTitle = !!(metadata.title && metadata.title.trim().length > 0);
	const hasContent = !!(content && content.trim().length > 0);
	const contentLength = content.trim().length;
	const wordCount = content.trim().split(/\s+/).length;

	return {
		hasTitle,
		hasContent,
		contentLength,
		wordCount,
		isEmpty: !(hasTitle || hasContent),
		isPartial: hasTitle || hasContent,
		isSubstantial: contentLength > 500,
	};
};

/**
 * ページタイプと記事状態に応じた初期メッセージを生成
 */
export const generateInitialMessage = (
	pageType: "new" | "edit",
	metadata: BlogMetadata,
	content: string,
): string => {
	const articleState = analyzeArticleState(metadata, content);

	if (pageType === "new") {
		if (articleState.isEmpty) {
			return `こんにちは！新しい記事の執筆をお手伝いします。

**現在の状態：** 新規記事作成
**記事情報：** まだ何も入力されていません

以下のようなお手伝いができます：
- 魅力的なタイトルの提案
- 記事の構成・アウトラインの作成
- ターゲット読者に合わせた内容提案
- SEO最適化のアドバイス

まずは「どのような記事を書きたいか」を教えてください！`;
		}
		if (articleState.hasTitle && !articleState.hasContent) {
			return `新しい記事の執筆をお手伝いします。

**現在の状態：** 新規記事作成
**記事タイトル：** "${metadata.title}"
**記事内容：** まだ作成されていません

タイトルは設定されていますね！次は記事の内容を作成しましょう。

以下のお手伝いができます：
- このタイトルに最適な記事構成の提案
- 導入文の作成
- 詳細な内容の執筆サポート
- SEO最適化のアドバイス

どのような内容の記事にしたいか教えてください！`;
		}
		return `新しい記事の執筆をお手伝いします。

**現在の状態：** 新規記事作成中
**記事タイトル：** "${metadata.title || "未設定"}"
**記事内容：** ${articleState.wordCount}語（${articleState.contentLength}文字）

すでに作成を開始されていますね！現在の内容を分析して、さらに良い記事にするお手伝いをします。

以下のようなことができます：
- 現在の内容の改善提案
- 追加すべき要素の提案
- 文章の校正・最適化
- SEO効果の向上

どのような改善をお望みですか？`;
	}

	// edit ページの場合
	if (articleState.isEmpty) {
		return `記事の編集をお手伝いします。

**現在の状態：** 記事編集モード
**記事情報：** 内容が空の状態です

この記事を充実させるお手伝いをします：
- 魅力的なタイトルの作成
- 記事構成の設計
- 内容の執筆サポート
- 既存内容の改善

どのような記事にしたいか教えてください！`;
	}
	return `記事の編集をお手伝いします。

**現在の状態：** 記事編集モード
**記事タイトル：** "${metadata.title || "未設定"}"
**記事内容：** ${articleState.wordCount}語（${articleState.contentLength}文字）
**ステータス：** ${metadata.status === "published" ? "公開済み" : "下書き"}

現在の記事を分析して、より良い内容にするお手伝いをします：

- 現在の内容の詳細分析と改善提案
- タイトルの最適化
- SEO効果の向上
- 読みやすさの改善
- 追加すべき情報の提案

現在の記事について、どのような改善をお望みですか？`;
};

/**
 * 記事の状態を考慮した選択肢生成関数（改善版）
 */
export const generateContextualOptions = (
	userMessage: string,
	metadata: BlogMetadata,
	content: string,
	articleState: ArticleState,
): SuggestionOption[] => {
	const lowerMessage = userMessage.toLowerCase();

	if (lowerMessage.includes("タイトル") || lowerMessage.includes("題名")) {
		const currentTitle = metadata.title || "";
		return [
			{
				id: "title-analyze-current",
				title: "現在のタイトルを分析・改善",
				description: currentTitle
					? `「${currentTitle}」を分析し、より魅力的で検索されやすいタイトルに改善`
					: "記事内容を基に最適なタイトルを提案",
				type: "metadata",
				data: {
					metadata: {
						title: currentTitle
							? `${currentTitle} - 完全ガイド【2024年最新版】`
							: `${content.substring(0, 30)}... の完全解説`,
					},
				},
			},
			{
				id: "title-seo-optimized",
				title: "SEO最適化タイトル",
				description: "検索エンジンで上位表示されやすいキーワードを含んだタイトル",
				type: "metadata",
				data: {
					metadata: {
						title: `【2024年最新】${currentTitle || "新記事"} | 専門家が解説する完全ガイド`,
					},
				},
			},
			{
				id: "title-emotional",
				title: "感情訴求型タイトル",
				description: "読者の関心を引く心理的アプローチを使用したタイトル",
				type: "metadata",
				data: {
					metadata: {
						title: `知らないと損する！${currentTitle || "重要な情報"}の真実`,
					},
				},
			},
		];
	}

	if (
		lowerMessage.includes("構成") ||
		lowerMessage.includes("目次") ||
		lowerMessage.includes("アウトライン")
	) {
		const hasExistingContent = articleState.hasContent;
		return [
			{
				id: "structure-analyze-current",
				title: hasExistingContent ? "現在の構成を分析・改善" : "記事構成を新規作成",
				description: hasExistingContent
					? `現在の内容（${articleState.wordCount}語）を分析し、より読みやすい構成に改善`
					: "読者にとって分かりやすい論理的な構成を設計",
				type: "content",
				data: {
					content: hasExistingContent
						? `# ${metadata.title || "記事タイトル"}

## 現在の内容を改善した構成

${content.split("\n").slice(0, 5).join("\n")}

## 追加すべき要素
- より詳細な説明
- 具体例やケーススタディ
- まとめと次のステップ`
						: `# ${metadata.title || "新しい記事"}

## はじめに
- 問題の提起
- この記事で解決できること

## 本文
- 主要なポイント1
- 主要なポイント2
- 主要なポイント3

## まとめ
- 重要ポイントの再確認
- 読者への行動提案`,
				},
			},
			{
				id: "structure-problem-solution",
				title: "問題解決型構成",
				description: "読者の課題を明確にし、段階的に解決策を提示する構成",
				type: "content",
			},
			{
				id: "structure-howto",
				title: "ハウツー型構成",
				description: "具体的な手順を分かりやすく説明するステップバイステップ構成",
				type: "content",
			},
		];
	}

	if (
		lowerMessage.includes("改善") ||
		lowerMessage.includes("校正") ||
		lowerMessage.includes("文章")
	) {
		return [
			{
				id: "improve-current-content",
				title: "現在の記事内容を総合改善",
				description: `${articleState.wordCount}語の内容を分析し、読みやすさ・説得力・SEO効果を向上`,
				type: "edit",
				data: {
					content:
						content.length > 0
							? `${content}\n\n[AI改善提案]\n- 文章の流れを改善\n- より具体的な例を追加\n- 読者への行動提案を強化`
							: "まず記事の内容を入力してください。その後、詳細な改善提案を行います。",
				},
			},
			{
				id: "improve-readability",
				title: "読みやすさの向上",
				description: "文章の構造、段落分け、表現を改善して読者体験を向上",
				type: "edit",
			},
			{
				id: "improve-seo",
				title: "SEO最適化",
				description: "検索エンジンでの発見性を高めるキーワード配置と構造改善",
				type: "suggestion",
			},
		];
	}

	// デフォルトの記事状態に応じた選択肢
	if (articleState.isEmpty) {
		return [
			{
				id: "start-with-title",
				title: "魅力的なタイトルから始める",
				description: "読者の関心を引く効果的なタイトルを提案",
				type: "metadata",
			},
			{
				id: "start-with-outline",
				title: "記事の構成・アウトラインを作成",
				description: "論理的で読みやすい記事構成を設計",
				type: "content",
			},
			{
				id: "start-with-intro",
				title: "導入文から執筆開始",
				description: "読者を引き込む効果的な導入文を作成",
				type: "content",
			},
		];
	}
	if (!articleState.hasTitle) {
		return [
			{
				id: "generate-title-from-content",
				title: "内容に基づいたタイトル生成",
				description: `現在の記事内容（${articleState.wordCount}語）を分析して最適なタイトルを提案`,
				type: "metadata",
			},
			{
				id: "improve-content-structure",
				title: "記事構成の改善",
				description: "現在の内容をより読みやすく整理",
				type: "content",
			},
		];
	}
	return [
		{
			id: "comprehensive-improvement",
			title: "記事全体の包括的改善",
			description: `「${metadata.title}」の内容を分析し、タイトル・構成・文章を総合的に改善`,
			type: "suggestion",
		},
		{
			id: "content-expansion",
			title: "内容の充実・拡張",
			description: "現在の記事にさらに価値ある情報を追加",
			type: "content",
		},
		{
			id: "finalize-for-publish",
			title: "公開準備の最終チェック",
			description: "誤字脱字、SEO、読者体験の最終確認と調整",
			type: "suggestion",
		},
	];
};

/**
 * ユーザーの入力が抽象的かどうかを判定する
 */
export function isAbstractInput(userInput: string): boolean {
	const input = userInput.toLowerCase().trim();

	// 抽象的なキーワードパターン
	const abstractPatterns = [
		// 曖昧な依頼
		/いい感じの?/,
		/適当に?/,
		/よろしく/,
		/お任せ/,
		/何か/,
		/なんか/,

		// 具体性のない要求
		/^(タイトル|題名)を?(作って|考えて|生成して)$/,
		/^(内容|文章|記事)を?(書いて|作って|考えて)$/,
		/^(構成|アウトライン)を?(作って|考えて)$/,
		/^改善して$/,
		/^直して$/,
		/^修正して$/,

		// 一般的すぎる質問
		/どうすれば?いい/,
		/何を書けば?いい/,
		/どんな(内容|タイトル|構成)/,

		// 短すぎる入力（5文字以下で具体的でない）
		/^.{1,5}$/,
	];

	// パターンマッチング
	const hasAbstractPattern = abstractPatterns.some((pattern) => pattern.test(input));

	// 具体的な情報が含まれているかチェック
	const hasSpecificInfo =
		/[0-9]|年|月|日|時間|分|秒|円|万|千|百|個|人|社|会社|製品|サービス|技術|方法|手順|ステップ/.test(
			input,
		);

	// 固有名詞が含まれているかチェック（カタカナ3文字以上、英単語など）
	const hasProperNouns = /[ァ-ヶー]{3,}|[A-Za-z]{3,}/.test(input);

	return hasAbstractPattern && !hasSpecificInfo && !hasProperNouns;
}

/**
 * 記事の状態とユーザー入力に基づいて逆質問を生成する
 */
export function generateClarifyingQuestions(
	userInput: string,
	metadata: BlogMetadata,
	content: string,
): {
	questions: Array<{
		id: string;
		question: string;
		category: "topic" | "audience" | "purpose" | "format" | "tone" | "details";
		priority: number;
	}>;
	message: string;
} {
	const hasTitle = metadata.title && metadata.title.trim().length > 0;
	const hasContent = content && content.trim().length > 0;
	const contentLength = content.trim().length;

	const questions: Array<{
		id: string;
		question: string;
		category: "topic" | "audience" | "purpose" | "format" | "tone" | "details";
		priority: number;
	}> = [];

	// ユーザー入力の種類を判定
	const inputLower = userInput.toLowerCase();
	const isAboutTitle = /タイトル|題名/.test(inputLower);
	const isAboutContent = /内容|文章|記事|本文/.test(inputLower);
	const isAboutStructure = /構成|アウトライン|目次/.test(inputLower);

	// 基本的な質問（常に含める）
	if (!hasTitle || isAboutTitle) {
		questions.push({
			id: "topic-main",
			question: "どのようなテーマ・トピックについて書きたいですか？",
			category: "topic",
			priority: 10,
		});

		questions.push({
			id: "audience-target",
			question: "想定している読者層はどなたですか？（初心者、専門家、一般の方など）",
			category: "audience",
			priority: 9,
		});
	}

	if (!hasContent || isAboutContent || contentLength < 100) {
		questions.push({
			id: "purpose-goal",
			question: "この記事で読者に何を伝えたい、または何を解決したいですか？",
			category: "purpose",
			priority: 8,
		});

		questions.push({
			id: "format-type",
			question: "どのような形式の記事をお考えですか？（解説記事、ハウツー、レビュー、体験談など）",
			category: "format",
			priority: 7,
		});
	}

	// 記事の状態に応じた追加質問
	if (hasTitle && !hasContent) {
		questions.push({
			id: "content-focus",
			question: `「${metadata.title}」について、特に詳しく説明したいポイントはありますか？`,
			category: "details",
			priority: 8,
		});
	}

	if (contentLength > 0 && contentLength < 300) {
		questions.push({
			id: "content-expand",
			question: "現在の内容をどの方向に発展させたいですか？（具体例、詳細説明、関連情報など）",
			category: "details",
			priority: 6,
		});
	}

	// トーンや文体について
	if (isAboutContent || (!hasContent && hasTitle)) {
		questions.push({
			id: "tone-style",
			question: "どのような文体・トーンで書きたいですか？（丁寧語、親しみやすい、専門的など）",
			category: "tone",
			priority: 5,
		});
	}

	// 優先度順にソート
	questions.sort((a, b) => b.priority - a.priority);

	// 上位3-4個の質問を選択
	const selectedQuestions = questions.slice(0, Math.min(4, questions.length));

	const message = `より具体的で効果的な${isAboutTitle ? "タイトル" : isAboutContent ? "内容" : isAboutStructure ? "構成" : "提案"}を作成するために、いくつか質問させてください：`;

	return {
		questions: selectedQuestions,
		message,
	};
}
