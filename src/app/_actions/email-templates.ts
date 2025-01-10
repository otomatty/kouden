interface KoudenInvitationEmailProps {
	koudenTitle: string;
	inviterName: string;
	role: "viewer" | "editor";
	invitationLink: string;
	expiresAt: Date;
}

export function generateKoudenInvitationEmail({
	koudenTitle,
	inviterName,
	role,
	invitationLink,
	expiresAt,
}: KoudenInvitationEmailProps) {
	const roleText = role === "viewer" ? "閲覧" : "編集";
	const expiresAtText = new Date(expiresAt).toLocaleString("ja-JP", {
		timeZone: "Asia/Tokyo",
	});

	const text = `
${inviterName}さんから香典帳「${koudenTitle}」に招待されました。

あなたには${roleText}権限が付与されます。

香典帳にアクセスするには以下のリンクをクリックしてください：
${invitationLink}

※この招待リンクは${expiresAtText}まで有効です。
`;

	const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>香典帳「${koudenTitle}」への招待</title>
  </head>
  <body style="font-family: sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 40px; margin: 24px;">
        <h1 style="font-size: 24px; font-weight: bold; text-align: center; margin: 0 0 24px;">香典帳への招待</h1>
        
        <p style="font-size: 16px; line-height: 24px; color: #333; margin: 0 0 16px;">
          ${inviterName}さんから香典帳「${koudenTitle}」に招待されました。
        </p>
        
        <p style="font-size: 16px; line-height: 24px; color: #333; margin: 0 0 16px;">
          あなたには${roleText}権限が付与されます。
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationLink}" 
             style="background-color: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;">
            香典帳にアクセスする
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin: 24px 0 0; text-align: center;">
          ※この招待リンクは${expiresAtText}まで有効です。
        </p>
      </div>
    </div>
  </body>
</html>
`;

	return { text, html };
}
