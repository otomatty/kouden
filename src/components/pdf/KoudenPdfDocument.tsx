import type React from "react";
import type { KoudenData } from "@/types/entries";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import styles from "./pdfStyles";

interface KoudenPdfDocumentProps {
	data: KoudenData;
}

// Column-specific wrap character limits
const wrapConfig: Record<"name" | "org" | "note" | "address", number> = {
	name: 8,
	org: 12,
	note: 8,
	address: 20,
};

/**
 * Wraps text into lines without leaving trailing hyphens at line ends.
 * Splits on hyphens and moves hyphens to the start of next line if needed.
 */
function wrapTextWithoutTrailingHyphen(text: string, maxChars: number): string[] {
	const tokens = text.split(/(-)/g);
	const lines: string[] = [];
	let current = "";
	for (const token of tokens) {
		if (current.length + token.length <= maxChars) {
			current += token;
		} else {
			if (current.endsWith("-")) {
				current = current.slice(0, -1);
				lines.push(current);
				current = `-${token}`;
			} else {
				lines.push(current);
				current = token;
			}
		}
	}
	if (current) lines.push(current);
	return lines;
}

/**
 * Wraps text into lines by fixed character length.
 */
function wrapByLength(text: string, maxChars: number): string[] {
	const lines: string[] = [];
	let pos = 0;
	while (pos < text.length) {
		lines.push(text.slice(pos, pos + maxChars));
		pos += maxChars;
	}
	return lines;
}

const KoudenPdfDocument: React.FC<KoudenPdfDocumentProps> = ({ data }) => (
	<Document>
		<Page size="A4" orientation="landscape" style={styles.page}>
			{/* ヘッダー */}
			<View style={styles.header}>
				<Text>{data.title}</Text>
			</View>

			{/* テーブル */}
			<View style={styles.table}>
				{/* ヘッダー行 */}
				<View style={styles.tableHeader} fixed>
					<Text style={[styles.column, styles.colIndex]}>No.</Text>
					<Text style={[styles.column, styles.colName]}>氏名</Text>
					<Text style={[styles.column, styles.colOrg]}>団体名</Text>
					<Text style={[styles.column, styles.colPostalCode]}>郵便番号</Text>
					<Text style={[styles.column, styles.colAddress]}>住所</Text>
					<Text style={[styles.column, styles.colRelationship]}>ご関係</Text>
					<Text style={[styles.column, styles.colAmount]}>金額</Text>
					<Text style={[styles.column, styles.colNote]}>備考</Text>
				</View>
				{/* データ行 */}
				{data.entries.map((entry, index) => (
					<View style={styles.tableRow} wrap={false} key={entry.id}>
						<Text style={[styles.column, styles.colIndex]}>{index + 1}</Text>
						<View style={[styles.column, styles.colName]}>
							{wrapByLength(entry.name, wrapConfig.name).map((line, i) => (
								<Text key={`${entry.id}-name-${i}`}>{line}</Text>
							))}
						</View>
						<View style={[styles.column, styles.colOrg]}>
							{wrapByLength(entry.organization, wrapConfig.org).map((line, i) => (
								<Text key={`${entry.id}-org-${i}`}>{line}</Text>
							))}
						</View>
						<Text style={[styles.column, styles.colPostalCode]}>
							{entry.postalCode ? `〒${entry.postalCode}` : ""}
						</Text>
						{(() => {
							const addressLines = wrapTextWithoutTrailingHyphen(entry.address, wrapConfig.address);
							return (
								<View style={[styles.column, styles.colAddress]}>
									{addressLines.map((line) => (
										<Text key={line}>{line}</Text>
									))}
								</View>
							);
						})()}
						<Text style={[styles.column, styles.colRelationship]}>{entry.relationship}</Text>
						<Text style={[styles.column, styles.colAmount]}>{`¥${entry.amount}`}</Text>
						<View style={[styles.column, styles.colNote]}>
							{wrapByLength(entry.note || "", wrapConfig.note).map((line, i) => (
								<Text key={`${entry.id}-note-${i}`}>{line}</Text>
							))}
						</View>
					</View>
				))}
			</View>

			{/* フッター */}
			<View style={styles.footer}>
				<Text>合計金額: {`¥${data.total}`}</Text>
			</View>
		</Page>
	</Document>
);

export default KoudenPdfDocument;
