import { StyleSheet } from "@react-pdf/renderer";
import "./registerFonts";

const styles = StyleSheet.create({
	page: {
		padding: 20,
		fontSize: 12,
		fontFamily: "Noto Sans JP",
		fontWeight: "semibold",
	},
	header: {
		marginBottom: 20,
		textAlign: "center",
	},
	table: {
		width: "auto",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "#f0f0f0",
		textAlign: "center",
	},
	tableRow: {
		flexDirection: "row",
	},
	column: {
		borderWidth: 0.5,
		borderColor: "#222",
		padding: 5,
	},
	colIndex: {
		width: 30,
		flexGrow: 0,
		flexShrink: 0,
		textAlign: "center",
	},
	colName: {
		width: 120,
		minWidth: 0,
		flexShrink: 1,
	},
	colOrg: {
		width: 140,
		minWidth: 0,
		flexShrink: 1,
	},
	colPostalCode: {
		width: 70,
		flexGrow: 0,
		flexShrink: 0,
	},
	colRelationship: {
		width: 60,
		flexGrow: 0,
		flexShrink: 0,
	},
	colAmount: {
		width: 60,
		flexGrow: 0,
		flexShrink: 0,
	},
	colAddress: {
		flex: 1,
		minWidth: 0,
	},
	colNote: {
		width: 100,
		minWidth: 0,
		flexGrow: 0,
		flexShrink: 1,
	},
	footer: {
		marginTop: 20,
		flexDirection: "row",
		justifyContent: "flex-end",
	},
});

export default styles;
