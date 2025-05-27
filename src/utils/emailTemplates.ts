/**
 * Returns HTML string for invitation email.
 * @param title Title of the Kouden
 * @param link Invitation URL
 */
export function generateInvitationEmailHtml(title: string, link: string): string {
	const homepage = process.env.NEXT_PUBLIC_APP_URL ?? "https://kouden-app.com";
	return `
  <!DOCTYPE html>
  <html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        background-color: #fff;
        color: #222;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
      }
      .header {
        text-align: center;
        margin-bottom: 24px;
      }
      .logo {
        font-size: 28px;
        font-weight: bold;
        color: #222;
        text-decoration: none;
      }
      .description {
        font-size: 14px;
        margin-bottom: 24px;
        color: #222;
      }
      h1 {
        font-size: 22px;
        margin-bottom: 20px;
      }
      .btn {
        display: inline-block;
        background-color: #222;
        color: #fff;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 4px;
        font-weight: bold;
        margin: 16px 0;
      }
      a {
        color: #222;
        text-decoration: none;
      }
      .footer {
        font-size: 12px;
        color: #222;
        margin-top: 32px;
        color: #666666;
        margin-top: 24px;
        border-top: 1px solid #eaeaea;
        padding-top: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <a href="${homepage}" class="logo">香典帳アプリ</a>
      </div>
      <div class="description">
        香典帳アプリは、デジタル化された香典帳です。香典の情報を簡単に共有・管理できます。
      </div>
      <h1>「${title}」へのご招待</h1>
      <p>下記のボタンから参加してください：</p>
      <div style="text-align: center;">
        <a href="${link}" class="btn">参加する</a>
      </div>
      <div class="footer">
        <p>このメールに心当たりがない場合は、破棄してください。</p>
        <p><a href="${homepage}">${homepage}</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
}
