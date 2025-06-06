export function emailLayout(content: string): string {
	return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: sans-serif; margin: 0; padding: 0; }
      header, footer { background: #f5f5f5; padding: 10px; text-align: center; }
      main { padding: 20px; }
    </style>
  </head>
  <body>
    <header>
      <h1>香典帳アプリ</h1>
    </header>
    <main>
      ${content}
    </main>
    <footer>
      © ${new Date().getFullYear()} Kouden Inc.
    </footer>
  </body>
</html>`;
}
