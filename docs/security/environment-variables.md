# セキュリティ関連環境変数設定

本番環境でのセキュリティ強化のために、以下の環境変数を設定してください。

## 必須の環境変数

### IPアクセス制限
```bash
# 管理者画面にアクセス可能なIPアドレス（カンマ区切り）
ALLOWED_ADMIN_IPS="192.168.1.100,203.0.113.0,198.51.100.0"
```

### ベーシック認証
```bash
# 管理者画面のベーシック認証（IP制限が使えない場合の代替手段）
ADMIN_BASIC_USERNAME="admin"
ADMIN_BASIC_PASSWORD="your-strong-password-here"
```

### CSRF保護
```bash
# CSRF攻撃防止用の秘密鍵（必須・本番環境では必ず変更）
CSRF_SECRET="your-csrf-secret-key-change-in-production"

# 開発環境でのCSRF保護デバッグ（オプション）
CSRF_DEBUG="false"
```

### セキュリティアラート通知
```bash
# Slack webhook URL（セキュリティアラートの即座通知用）
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"

# Discord webhook URL（代替通知先）
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/XXXXXXXXXXXXXXXXXXXXXXXX"
```

## オプション設定

### カスタムレート制限
```bash
# 一般ユーザーのレート制限（1分間のリクエスト数）
RATE_LIMIT_GENERAL=100

# 管理者のレート制限（1分間のリクエスト数）
RATE_LIMIT_ADMIN=20

# レート制限の時間窓（秒）
RATE_LIMIT_WINDOW=60
```

### ログ保持期間
```bash
# セキュリティログの保持期間（日数）
SECURITY_LOG_RETENTION_DAYS=90

# ログイン試行記録の保持期間（日数）
LOGIN_ATTEMPT_RETENTION_DAYS=30
```

### ファイルアップロード制限
```bash
# 最大ファイルサイズ（バイト）
MAX_FILE_SIZE=10485760  # 10MB

# 許可する拡張子（カンマ区切り）
ALLOWED_FILE_EXTENSIONS=".jpg,.jpeg,.png,.pdf,.csv,.txt"
```

## セキュリティレベル設定

### 開発環境
```bash
NODE_ENV=development
# 開発環境では制限を緩和
SECURITY_LEVEL=low
```

### ステージング環境
```bash
NODE_ENV=staging
SECURITY_LEVEL=medium
```

### 本番環境
```bash
NODE_ENV=production
SECURITY_LEVEL=high

# 本番環境では以下を必須設定
ALLOWED_ADMIN_IPS="YOUR_OFFICE_IP,YOUR_VPN_IP"
ADMIN_BASIC_USERNAME="your-admin-username"
ADMIN_BASIC_PASSWORD="your-very-strong-password"
SLACK_WEBHOOK_URL="your-slack-webhook-url"
```

## Vercel設定例

Vercelの環境変数設定画面で以下を設定：

```bash
# Production環境
ALLOWED_ADMIN_IPS = "203.0.113.0,198.51.100.0"
ADMIN_BASIC_USERNAME = "admin"
ADMIN_BASIC_PASSWORD = "super-secure-password-2024"
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/..."
SECURITY_LEVEL = "high"

# Preview環境
SECURITY_LEVEL = "medium"

# Development環境
SECURITY_LEVEL = "low"
```

## セキュリティチェックリスト

- [ ] `ALLOWED_ADMIN_IPS` に正しいIPアドレスを設定
- [ ] `ADMIN_BASIC_PASSWORD` に十分に強力なパスワードを設定
- [ ] `SLACK_WEBHOOK_URL` でアラート通知が正常に動作することを確認
- [ ] 本番環境で `SECURITY_LEVEL=high` に設定
- [ ] 定期的にIPアドレスとパスワードを更新
- [ ] セキュリティログを定期的に監視

## 注意事項

1. **IPアドレスの管理**: 社内IPアドレスが変更された場合は、速やかに `ALLOWED_ADMIN_IPS` を更新してください。

2. **パスワードポリシー**: ベーシック認証のパスワードは以下の条件を満たしてください：
   - 12文字以上
   - 大文字・小文字・数字・記号を含む
   - 辞書攻撃に強い組み合わせ

3. **アラート設定**: セキュリティアラートが正常に動作することを定期的にテストしてください。

4. **ログ監視**: セキュリティログを定期的に確認し、異常なアクティビティがないかチェックしてください。 