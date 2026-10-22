// 画面カタログの各画面に入れる小さなスクリプト（build.ts が dist/assets/ にコピーする）。
// - カタログの枠（index.html）に、内容の高さを知らせる
// - アプリの中へのリンクは、対応する画面の状態へ移る（枠の中ならカタログの表示を切り替える）
// - フォームは送信しない（サーバーがないため）
(() => {
	const framed = window.parent !== window;
	const post = (message) => {
		if (framed) window.parent.postMessage(message, "*");
	};

	let last = 0;
	const report = () => {
		const height = document.documentElement.scrollHeight;
		if (height === last) return;
		last = height;
		post({ type: "kc-height", height });
	};
	window.addEventListener("load", report);
	new ResizeObserver(report).observe(document.body);
	document.addEventListener("toggle", report, true);

	document.addEventListener("click", (e) => {
		const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
		if (!link) return;
		if (link.hasAttribute("data-kc-dead")) {
			// カタログにない画面（Excel のダウンロード・Google ログインなど）
			e.preventDefault();
			return;
		}
		if (framed && link.dataset.kcScreen) {
			e.preventDefault();
			post({ type: "kc-nav", screen: link.dataset.kcScreen, state: link.dataset.kcState });
		}
	});
	document.addEventListener("submit", (e) => e.preventDefault());
})();
