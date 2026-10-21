# 香典帳アプリ 通知機能 要件定義書

## 1. 概要
本機能は、ユーザーに対してアプリケーションに関する重要な情報を適時に提供し、利便性とエンゲージメントを向上させることを目的とする。通知はアプリケーションヘッダーのアイコンからドロップダウン形式で表示され、ユーザーは通知内容を一覧で確認できる。

## 2. 機能要件

### 2.1. 通知インターフェース (UI)
*   **2.1.1. 通知トリガー**
    *   アプリケーションヘッダーの右上に、ベル型の「通知アイコン」を常時表示する。
    *   未読の通知が存在する場合、通知アイコンの右上に未読件数を示すバッジ（例：赤い丸に白抜き数字）を表示する。未読が0件の場合はバッジを非表示にする。

*   **2.1.2. 通知リスト表示**
    *   ユーザーが通知アイコンをクリック（タップ）すると、その直下にドロップダウン形式の通知リストが表示される。
    *   通知リストが表示された時点で、ヘッダーの未読件数バッジは消えるものとする（ユーザーが一覧を「見た」と判断するため）。

*   **2.1.3. 通知リストの構成**
    *   **ヘッダー**: ドロップダウンの最上部に「通知」というタイトルを表示する。
    *   **コンテンツ**: 通知アイテムを時系列の降順（新しいものが上）で表示する。
    *   **空の状態**: 表示すべき通知が一件もない場合、「新しい通知はありません」というメッセージと、それを表すアイコン（例：斜線の入ったベル）を表示する。

### 2.2. 通知アイテム
各通知アイテムは、以下の要素で構成される。
*   **2.2.1. 未読インジケータ**
    *   未読の通知には、タイトルの左側などに視覚的な印（例：青いドット）を表示し、既読の通知と区別する。
*   **2.2.2. アイコン**
    *   通知の種類を直感的に伝えるアイコンを表示する（例：決済、更新、リマインダーなど）。
*   **2.2.3. タイトル**
    *   通知の主旨を簡潔に記述したテキスト（最大25文字程度）。
*   **2.2.4. 本文 (任意)**
    *   タイトルを補足する短い説明文（最大50文字程度）。
*   **2.2.5. タイムスタンプ**
    *   通知が生成された時刻からの経過時間（例：「5分前」「3時間前」「昨日」）、または日付（例：「10/26」）を表示する。
*   **2.2.6. リンク (任意)**
    *   通知に関連する詳細ページが存在する場合、通知アイテム全体または一部をクリッカブルにし、該当ページへ遷移させる。リンク付きの通知には、矢印アイコンなどを表示して遷移可能であることを示唆する。

### 2.3. 状態管理
*   **2.3.1. ステータス**
    *   各通知は「未読」「既読」の2つのステータスのみを持つ。
*   **2.3.2. 既読処理**
    *   ユーザーが通知アイコンをクリックし、**通知リスト（ドロップダウン）を開いた時点**で、リスト内に表示されている**全ての未読通知が自動的に「既読」ステータスに更新**される。個別のクリックで既読にする操作は不要とする。
*   **2.3.3. データ永続化**
    *   通知の状態（内容、既読/未読ステータス）はサーバーサイドで管理し、ユーザーが異なるデバイスやセッションでログインした場合でも状態が維持されるようにする。
    *   表示する通知の件数には上限（例：最新50件）を設け、古い通知は自動的に削除される、もしくはアーカイブされる仕様とする。

## 3. 通知シナリオと表示内容
以下のシナリオで通知を生成する。

| カテゴリ | シナリオ | アイコン(例) | タイトル例 | 本文例 | リンク先 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. 事務連絡** | **A-1. 決済完了** | 💳 | 有料プランのお支払いが完了 | 月額プランのお支払いが完了しました。 | 決済履歴ページ |
| | **A-2. 領収書送付** | ✉️ | 領収書を送付しました | ご登録のメールアドレスに領収書を送付しました。 | なし |
| | **A-3. プラン更新案内** | 🗓️ | プラン更新のお知らせ | まもなく有料プランの更新日です。 | 契約プランページ |
| | **A-4. アプリ更新** | 🎉 | アプリが更新されました | 新機能が追加されました。詳細はこちら。 | お知らせ詳細ページ |
| | **A-5. 規約改定** | ⚖️ | 【重要】利用規約改定のお知らせ | サービス利用規約が改定されました。 | お知らせ詳細ページ |
| | **A-6. メンテナンス** | 🔧 | メンテナンスのお知らせ | 〇月〇日 2:00-4:00にメンテナンスを実施します。| お知らせ詳細ページ |
| **B. 操作完了** | **B-1. データ出力完了**| ✔️ | データ出力が完了しました | 香典帳リストのPDF出力が完了しました。 | なし |
| | **B-2. データバックアップ** | 💾 | バックアップが完了しました | データのバックアップが正常に完了しました。 | なし |
| | **B-3. データインポート** | 📥 | インポートが完了しました | CSVから〇件のデータをインポートしました。 | なし |
| **C. リマインダー** | **C-1. 香典返し準備** | 🎁 | 香典返しの準備時期です | 四十九日から1ヶ月が経過しました。 | 香典返し管理ページ |
| | **C-2. 香典返し未発送** | ❗ | 未発送の香典返しがあります | 未発送の香典返しが〇件あります。 | 香典返し管理ページ |
| | **C-3. 情報入力漏れ** | ✍️ | 住所が未入力の方がいます | 〇〇様など3名の方の住所が未入力です。 | 香典帳リストページ |
| | **C-4. マイルストーン** | 🏆 | 登録数が50件に到達 | 香典情報の登録が50件を超えました。 | なし |
| **D. 共有機能** | **D-1. ユーザー招待** | 👥 | 新しいメンバーが参加 | 〇〇さんが香典帳に招待されました。 | 共有設定ページ |
| | **D-2. データ追加** | ➕ | 新しい香典が追加されました | 〇〇さんが香典情報を1件追加しました。 | 香典帳リストページ |

## 4. テーブル: `notification_types`

このテーブルは、通知の「種類」そのものを管理するマスタテーブルです。通知のテンプレート情報（デフォルトのタイトルやアイコンなど）を保持します。

**テーブル定義 (SQL):**
```sql
CREATE TABLE public.notification_types (
    id            serial PRIMARY KEY, -- 自動採番されるID
    type_key      text NOT NULL UNIQUE, -- プログラムで識別するためのキー (例: 'payment_success')
    default_title text NOT NULL, -- デフォルトのタイトル (例: 'お支払いが完了しました')
    default_icon  text, -- デフォルトのアイコン (例: '💳')
    description   text, -- 管理用の説明文
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- type_keyは頻繁に参照されるためインデックスを作成
CREATE INDEX idx_notification_types_type_key ON public.notification_types (type_key);
```

**各カラムの詳細:**

*   `id` (serial): 一意なID。管理画面などでの操作が容易になります。
*   `type_key` (text): `payment_success` や `app_update` のような、プログラム側で通知の種類を識別するための不変のキーです。**`UNIQUE` 制約**を付けます。
*   `default_title` (text): その通知タイプの標準的なタイトル。
*   `default_icon` (text): その通知タイプに関連付けられた絵文字やアイコン名。
*   `description` (text): この通知がどのような場面で使われるかの説明。管理者が把握しやすくするためのものです。

**初期データの挿入例:**
```sql
INSERT INTO public.notification_types (type_key, default_title, default_icon, description) VALUES
  ('payment_success', 'お支払いが完了しました', '💳', '有料プランの決済が正常に完了した際に送信'),
  ('receipt_sent', '領収書を送付しました', '✉️', 'ご登録のメールアドレスに領収書を送付した際に送信'),
  ('plan_renewal_reminder', 'プラン更新のお知らせ', '🗓️', '有料プランの更新期限が近づいた際に送信'),
  ('app_update', 'アプリが更新されました', '🎉', 'アプリバージョンアップ時に送信'),
  ('terms_updated', '【重要】利用規約改定のお知らせ', '⚖️', '利用規約が改定された際に送信'),
  ('maintenance_notification', 'メンテナンスのお知らせ', '🔧', 'メンテナンス実施予定の通知'),
  ('data_export_complete', 'データ出力が完了しました', '✔️', '香典帳リストなどのPDF/CSV出力完了時に送信'),
  ('backup_complete', 'バックアップが完了しました', '💾', 'データバックアップ完了時に送信'),
  ('data_import_complete', 'インポートが完了しました', '📥', 'CSVインポート完了時に送信'),
  ('condolence_return_preparation', '香典返しの準備時期です', '🎁', '四十九日から1ヶ月経過後に送信'),
  ('condolence_return_unshipped', '未発送の香典返しがあります', '❗', '未発送の香典返しが存在する場合に送信'),
  ('missing_address_reminder', '住所が未入力の方がいます', '✍️', '住所未入力の香典情報がある場合に送信'),
  ('milestone_reached', '登録数が50件に到達しました', '🏆', '香典情報登録数が50件を超えた際に送信'),
  ('user_invitation', '新しいメンバーが参加しました', '👥', 'ユーザー招待時に送信'),
  ('data_added', '新しい香典が追加されました', '➕', '香典情報追加時に送信');
```

## 5. テーブル: `notifications` (修正版)

メインの通知テーブルです。`notification_types` テーブルを参照するように変更します。

**テーブル定義 (SQL):**
```sql
CREATE TABLE public.notifications (
    -- 基本情報
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),

    -- 通知の状態と種類
    is_read         boolean NOT NULL DEFAULT false,
    notification_type_id integer NOT NULL REFERENCES public.notification_types(id) ON DELETE RESTRICT, -- 外部キー

    -- 通知の具体的な内容
    data            jsonb, -- 個別の動的な情報（本文やマイルストーンの件数など）
    link_path       text
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications (user_id, is_read);
```

**主な変更点:**

*   **`type` カラムの削除**: ENUM型を使っていた `type` カラムは不要になります。
*   **`notification_type_id` カラムの追加**:
    *   `notification_types` テーブルの `id` を参照する**外部キー**です。
    *   これにより、どの種類の通知なのかを関連付けます。
    *   `ON DELETE RESTRICT` を設定することで、使用中の通知タイプが誤って削除されるのを防ぎます。
*   **`data` カラムの変更**:
    *   `NOT NULL` を外して `NULL` を許容するように変更。
    *   なぜなら、通知のタイトルやアイコンは `notification_types` テーブルから取得できるため、`data` には「本文」や「〇〇様」といった**差分情報**だけを格納すれば良くなるからです。情報が何もない場合は `NULL` でも構いません。
    *   **格納例**:
        *   領収書送付通知: `{"body": "ご登録のメールアドレスに領収書を送付しました。"}`
        *   住所未入力リマインダー: `{"body": "〇〇様など3名の方の住所が未入力です。"}`
        *   アプリ更新通知: `{"body": "新機能が追加されました。詳細はこちら。"}` (タイトルやアイコンは `notification_types` から取得)

## 6. セキュリティ: Row Level Security (RLS)

RLSの設定は前回の提案と同じです。`notifications` テーブルに対して設定します。`notification_types` テーブルは全ユーザーが読み取れても問題ない公開情報なので、RLSは必須ではありません（もしくは、ログインユーザーなら誰でも読めるポリシーを設定します）。

**`notifications` テーブルのRLS (再掲):**
```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**`notification_types` テーブルのRLS (任意):**
```sql
-- (任意) ログインユーザーであれば誰でも読み取れるようにするポリシー
ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view notification types"
ON public.notification_types FOR SELECT
USING (auth.role() = 'authenticated');
```

## 7. 運用フロー

1.  **通知の作成 (INSERT)**
    *   Edge Function内で、送信したい通知の `type_key` (例: `'payment_success'`) を元に `notification_types` テーブルから `id` を取得します。
    *   `notifications` テーブルに、`user_id`, `notification_type_id`, `data` (差分情報), `link_path` をセットして挿入します。

2.  **通知の表示 (SELECT)**
    *   クライアントサイドから `notifications` テーブルをクエリする際に、**`notification_types` テーブルをJOIN**します。
    *   **Supabase Client (JavaScript)でのクエリ例:**
        ```javascript
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            created_at,
            is_read,
            link_path,
            data,
            notification_types (
              type_key,
              default_title,
              default_icon
            )
          `)
          .eq('user_id', '対象のユーザーID') // RLSがあれば不要
          .order('created_at', { ascending: false });
        ```
    *   このクエリにより、各通知に紐づくタイトルやアイコンの情報も一度に取得できます。フロントエンド側では、`data.default_title` や `data.data.body` などを組み合わせて通知をレンダリングします。