-- public.is_admin の SECURITY DEFINER 堅牢化
-- PR #146 (issue #117) レビュー (CodeRabbit) 指摘対応
--
-- 背景:
--   認可ゲートである public.is_admin は SECURITY DEFINER だが SET search_path が無く、
--   未修飾の admin_users を参照していた（20250128134809_remote_schema.sql で定義）。
--   SECURITY DEFINER 関数で search_path を固定しないと、呼び出し元の search_path に
--   依存して意図しないスキーマのオブジェクトを参照し得る（search_path 注入）。
--   is_admin は多数の RLS ポリシー・RPC が依存する共有認可関数のため、明示的に固定する。
--
-- 変更:
--   - SET search_path = public を追加
--   - 参照を FROM public.admin_users にスキーマ修飾
--   引数・戻り値・ロジックは従来どおりで、CREATE OR REPLACE のため既存の
--   GRANT / 依存（RLS ポリシー等）は維持される。

CREATE OR REPLACE FUNCTION public.is_admin(user_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = user_uid
    );
END;
$function$;
