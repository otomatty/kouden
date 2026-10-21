// 印刷用ページの「印刷する」ボタン（docs/rebuild/04-architecture.md §8）。
// CSP のためインラインのイベントハンドラは使わない。
document.addEventListener("click", (e) => {
	if (e.target instanceof Element && e.target.closest("[data-print]")) window.print();
});
