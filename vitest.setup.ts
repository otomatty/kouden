// vitest.setup.ts
// This file is required by Vitest setupFiles configuration.
// Add global test setup code here if needed.
import PDFDocument from "pdfkit/js/pdfkit.standalone";

// Stub out font loading in PDFKit to prevent font format errors in tests
PDFDocument.prototype.registerFont = function (_name: string, _src: string) {
	// set a dummy font with lineHeight method
	this._font = { lineHeight: (_size: number, _includeGap: boolean) => _size };
	return this;
};
PDFDocument.prototype.font = function () {
	return this;
};
PDFDocument.prototype.fontSize = function () {
	return this;
};
PDFDocument.prototype.text = function () {
	return this;
};
PDFDocument.prototype.moveDown = function () {
	return this;
};
// Ensure end triggers immediately
PDFDocument.prototype.end = function () {
	this.emit("end");
	return this;
};
