-- ブログ分析用テーブルの作成
-- post_views テーブル（閲覧記録）
CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet NOT NULL,
  user_agent text,
  session_id text,
  viewed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- post_bookmarks テーブル（ブックマーク）
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- post_stats テーブル（統計情報）
CREATE TABLE IF NOT EXISTS public.post_stats (
  post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  view_count integer DEFAULT 0 NOT NULL,
  bookmark_count integer DEFAULT 0 NOT NULL,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_post_views_ip_date ON public.post_views(ip_address, viewed_at);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON public.post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON public.post_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_post_stats_view_count ON public.post_stats(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_stats_bookmark_count ON public.post_stats(bookmark_count DESC);

-- RLS の有効化
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_stats ENABLE ROW LEVEL SECURITY;

-- post_views のRLSポリシー
-- 誰でも閲覧記録を挿入可能（匿名ユーザーも含む）
CREATE POLICY "Allow insert post views for all users" ON public.post_views
  FOR INSERT WITH CHECK (true);

-- 自分の記録のみ閲覧可能
CREATE POLICY "Users can view own post views" ON public.post_views
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
  );

-- post_bookmarks のRLSポリシー
-- ログインユーザーのみブックマーク可能
CREATE POLICY "Authenticated users can manage bookmarks" ON public.post_bookmarks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 公開記事のブックマークは誰でも閲覧可能
CREATE POLICY "Anyone can view bookmarks for published posts" ON public.post_bookmarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_bookmarks.post_id 
      AND posts.status = 'published'
    )
  );

-- post_stats のRLSポリシー
-- 誰でも統計情報を挿入・更新可能（システムが自動更新するため）
CREATE POLICY "Allow insert and update post stats for all" ON public.post_stats
  FOR ALL WITH CHECK (true);

-- 公開記事の統計情報は誰でも閲覧可能
CREATE POLICY "Anyone can view stats for published posts" ON public.post_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_stats.post_id 
      AND posts.status = 'published'
    )
  );

-- post_stats を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- post_bookmarks の変更時
  IF TG_TABLE_NAME = 'post_bookmarks' THEN
    IF TG_OP = 'INSERT' THEN
      -- ブックマーク追加
      INSERT INTO public.post_stats (post_id, bookmark_count)
      VALUES (NEW.post_id, 1)
      ON CONFLICT (post_id)
      DO UPDATE SET
        bookmark_count = post_stats.bookmark_count + 1,
        updated_at = now();
    ELSIF TG_OP = 'DELETE' THEN
      -- ブックマーク削除
      UPDATE public.post_stats
      SET bookmark_count = GREATEST(bookmark_count - 1, 0),
          updated_at = now()
      WHERE post_id = OLD.post_id;
    END IF;
  END IF;

  -- post_views の変更時
  IF TG_TABLE_NAME = 'post_views' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.post_stats (post_id, view_count, last_viewed_at)
    VALUES (NEW.post_id, 1, NEW.viewed_at)
    ON CONFLICT (post_id)
    DO UPDATE SET
      view_count = post_stats.view_count + 1,
      last_viewed_at = NEW.viewed_at,
      updated_at = now();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
DROP TRIGGER IF EXISTS trigger_update_post_stats_bookmarks ON public.post_bookmarks;
CREATE TRIGGER trigger_update_post_stats_bookmarks
  AFTER INSERT OR DELETE ON public.post_bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_post_stats();

DROP TRIGGER IF EXISTS trigger_update_post_stats_views ON public.post_views;
CREATE TRIGGER trigger_update_post_stats_views
  AFTER INSERT ON public.post_views
  FOR EACH ROW EXECUTE FUNCTION update_post_stats();

-- 既存の posts に対して初期統計データを作成
INSERT INTO public.post_stats (post_id, view_count, bookmark_count)
SELECT id, 0, 0 FROM public.posts
WHERE status = 'published'
ON CONFLICT (post_id) DO NOTHING; 