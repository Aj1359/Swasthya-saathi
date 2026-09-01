
-- Encrypt journal_entries.reflection and peer_posts/peer_replies.content end-to-end
-- Mirrors the chat_messages encryption pattern

-- ============ JOURNAL ENTRIES ============
INSERT INTO private.encryption_keys(name, key)
VALUES ('journal_entries', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.journal_entries SET SCHEMA private;
ALTER TABLE private.journal_entries RENAME TO journal_entries_enc;
ALTER TABLE private.journal_entries_enc ADD COLUMN IF NOT EXISTS reflection_enc bytea;

UPDATE private.journal_entries_enc
SET reflection_enc = extensions.pgp_sym_encrypt(
  reflection,
  (SELECT key FROM private.encryption_keys WHERE name='journal_entries')
)
WHERE reflection_enc IS NULL AND reflection IS NOT NULL;

ALTER TABLE private.journal_entries_enc DROP COLUMN reflection;

REVOKE ALL ON private.journal_entries_enc FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.journal_entries_enc TO service_role;

CREATE OR REPLACE FUNCTION private.journal_encrypt(txt text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT CASE WHEN txt IS NULL THEN NULL ELSE
    extensions.pgp_sym_encrypt(txt, (SELECT key FROM private.encryption_keys WHERE name='journal_entries'))
  END;
$$;

CREATE OR REPLACE FUNCTION private.journal_decrypt(b bytea)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT CASE WHEN b IS NULL THEN NULL ELSE
    extensions.pgp_sym_decrypt(b, (SELECT key FROM private.encryption_keys WHERE name='journal_entries'))
  END;
$$;

REVOKE ALL ON FUNCTION private.journal_encrypt(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.journal_decrypt(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.journal_encrypt(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.journal_decrypt(bytea) TO authenticated, service_role;

CREATE OR REPLACE VIEW public.journal_entries
WITH (security_invoker = true) AS
SELECT id, user_id, mood, private.journal_decrypt(reflection_enc) AS reflection, created_at
FROM private.journal_entries_enc;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;

ALTER TABLE private.journal_entries_enc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own journal" ON private.journal_entries_enc;
CREATE POLICY "read own journal" ON private.journal_entries_enc
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert own journal" ON private.journal_entries_enc;
CREATE POLICY "insert own journal" ON private.journal_entries_enc
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update own journal" ON private.journal_entries_enc;
CREATE POLICY "update own journal" ON private.journal_entries_enc
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete own journal" ON private.journal_entries_enc;
CREATE POLICY "delete own journal" ON private.journal_entries_enc
FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.journal_entries_view_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  INSERT INTO private.journal_entries_enc (id, user_id, mood, reflection_enc, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.mood,
    private.journal_encrypt(NEW.reflection),
    COALESCE(NEW.created_at, now())
  )
  RETURNING id, user_id, mood, NEW.reflection, created_at
  INTO NEW.id, NEW.user_id, NEW.mood, NEW.reflection, NEW.created_at;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.journal_entries_view_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  UPDATE private.journal_entries_enc
  SET user_id = NEW.user_id, mood = NEW.mood,
      reflection_enc = private.journal_encrypt(NEW.reflection)
  WHERE id = OLD.id;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.journal_entries_view_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN DELETE FROM private.journal_entries_enc WHERE id = OLD.id; RETURN OLD; END;$$;

CREATE TRIGGER journal_entries_view_insert INSTEAD OF INSERT ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.journal_entries_view_insert();
CREATE TRIGGER journal_entries_view_update INSTEAD OF UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.journal_entries_view_update();
CREATE TRIGGER journal_entries_view_delete INSTEAD OF DELETE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.journal_entries_view_delete();


-- ============ PEER POSTS ============
INSERT INTO private.encryption_keys(name, key)
VALUES ('peer_posts', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

-- Drop FK from peer_replies to allow moving peer_posts
ALTER TABLE public.peer_replies DROP CONSTRAINT IF EXISTS peer_replies_post_id_fkey;

ALTER TABLE public.peer_posts SET SCHEMA private;
ALTER TABLE private.peer_posts RENAME TO peer_posts_enc;
ALTER TABLE private.peer_posts_enc ADD COLUMN IF NOT EXISTS content_enc bytea;

UPDATE private.peer_posts_enc
SET content_enc = extensions.pgp_sym_encrypt(
  content, (SELECT key FROM private.encryption_keys WHERE name='peer_posts')
) WHERE content_enc IS NULL AND content IS NOT NULL;

ALTER TABLE private.peer_posts_enc DROP COLUMN content;
ALTER TABLE private.peer_posts_enc ALTER COLUMN content_enc SET NOT NULL;

REVOKE ALL ON private.peer_posts_enc FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.peer_posts_enc TO service_role;

CREATE OR REPLACE FUNCTION private.peer_posts_encrypt(txt text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT extensions.pgp_sym_encrypt(txt, (SELECT key FROM private.encryption_keys WHERE name='peer_posts'));
$$;
CREATE OR REPLACE FUNCTION private.peer_posts_decrypt(b bytea)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT extensions.pgp_sym_decrypt(b, (SELECT key FROM private.encryption_keys WHERE name='peer_posts'));
$$;
REVOKE ALL ON FUNCTION private.peer_posts_encrypt(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.peer_posts_decrypt(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.peer_posts_encrypt(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.peer_posts_decrypt(bytea) TO authenticated, anon, service_role;

CREATE OR REPLACE VIEW public.peer_posts
WITH (security_invoker = true) AS
SELECT id, alias, emoji, category, hearts, private.peer_posts_decrypt(content_enc) AS content, created_at
FROM private.peer_posts_enc;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.peer_posts TO authenticated, anon;
GRANT ALL ON public.peer_posts TO service_role;

ALTER TABLE private.peer_posts_enc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read peer posts" ON private.peer_posts_enc;
CREATE POLICY "Anyone can read peer posts" ON private.peer_posts_enc FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create peer posts" ON private.peer_posts_enc;
CREATE POLICY "Anyone can create peer posts" ON private.peer_posts_enc FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update hearts" ON private.peer_posts_enc;
CREATE POLICY "Anyone can update hearts" ON private.peer_posts_enc FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.peer_posts_view_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  INSERT INTO private.peer_posts_enc (id, alias, emoji, category, hearts, content_enc, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    COALESCE(NEW.alias, 'anon'),
    COALESCE(NEW.emoji, '🌱'),
    COALESCE(NEW.category, 'general'),
    COALESCE(NEW.hearts, 0),
    private.peer_posts_encrypt(NEW.content),
    COALESCE(NEW.created_at, now())
  )
  RETURNING id, alias, emoji, category, hearts, NEW.content, created_at
  INTO NEW.id, NEW.alias, NEW.emoji, NEW.category, NEW.hearts, NEW.content, NEW.created_at;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.peer_posts_view_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  UPDATE private.peer_posts_enc
  SET alias = NEW.alias, emoji = NEW.emoji, category = NEW.category,
      hearts = NEW.hearts, content_enc = private.peer_posts_encrypt(NEW.content)
  WHERE id = OLD.id;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.peer_posts_view_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN DELETE FROM private.peer_posts_enc WHERE id = OLD.id; RETURN OLD; END;$$;

CREATE TRIGGER peer_posts_view_insert INSTEAD OF INSERT ON public.peer_posts
FOR EACH ROW EXECUTE FUNCTION public.peer_posts_view_insert();
CREATE TRIGGER peer_posts_view_update INSTEAD OF UPDATE ON public.peer_posts
FOR EACH ROW EXECUTE FUNCTION public.peer_posts_view_update();
CREATE TRIGGER peer_posts_view_delete INSTEAD OF DELETE ON public.peer_posts
FOR EACH ROW EXECUTE FUNCTION public.peer_posts_view_delete();


-- ============ PEER REPLIES ============
INSERT INTO private.encryption_keys(name, key)
VALUES ('peer_replies', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.peer_replies SET SCHEMA private;
ALTER TABLE private.peer_replies RENAME TO peer_replies_enc;
ALTER TABLE private.peer_replies_enc ADD COLUMN IF NOT EXISTS content_enc bytea;

UPDATE private.peer_replies_enc
SET content_enc = extensions.pgp_sym_encrypt(
  content, (SELECT key FROM private.encryption_keys WHERE name='peer_replies')
) WHERE content_enc IS NULL AND content IS NOT NULL;

ALTER TABLE private.peer_replies_enc DROP COLUMN content;
ALTER TABLE private.peer_replies_enc ALTER COLUMN content_enc SET NOT NULL;

REVOKE ALL ON private.peer_replies_enc FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.peer_replies_enc TO service_role;

CREATE OR REPLACE FUNCTION private.peer_replies_encrypt(txt text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT extensions.pgp_sym_encrypt(txt, (SELECT key FROM private.encryption_keys WHERE name='peer_replies'));
$$;
CREATE OR REPLACE FUNCTION private.peer_replies_decrypt(b bytea)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT extensions.pgp_sym_decrypt(b, (SELECT key FROM private.encryption_keys WHERE name='peer_replies'));
$$;
REVOKE ALL ON FUNCTION private.peer_replies_encrypt(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.peer_replies_decrypt(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.peer_replies_encrypt(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.peer_replies_decrypt(bytea) TO authenticated, anon, service_role;

CREATE OR REPLACE VIEW public.peer_replies
WITH (security_invoker = true) AS
SELECT id, post_id, alias, emoji, hearts, private.peer_replies_decrypt(content_enc) AS content, created_at
FROM private.peer_replies_enc;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.peer_replies TO authenticated, anon;
GRANT ALL ON public.peer_replies TO service_role;

ALTER TABLE private.peer_replies_enc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read replies" ON private.peer_replies_enc;
CREATE POLICY "Anyone can read replies" ON private.peer_replies_enc FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create replies" ON private.peer_replies_enc;
CREATE POLICY "Anyone can create replies" ON private.peer_replies_enc FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update reply hearts" ON private.peer_replies_enc;
CREATE POLICY "Anyone can update reply hearts" ON private.peer_replies_enc FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.peer_replies_view_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  INSERT INTO private.peer_replies_enc (id, post_id, alias, emoji, hearts, content_enc, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.post_id,
    COALESCE(NEW.alias, 'anon'),
    COALESCE(NEW.emoji, '💬'),
    COALESCE(NEW.hearts, 0),
    private.peer_replies_encrypt(NEW.content),
    COALESCE(NEW.created_at, now())
  )
  RETURNING id, post_id, alias, emoji, hearts, NEW.content, created_at
  INTO NEW.id, NEW.post_id, NEW.alias, NEW.emoji, NEW.hearts, NEW.content, NEW.created_at;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.peer_replies_view_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  UPDATE private.peer_replies_enc
  SET post_id = NEW.post_id, alias = NEW.alias, emoji = NEW.emoji,
      hearts = NEW.hearts, content_enc = private.peer_replies_encrypt(NEW.content)
  WHERE id = OLD.id;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.peer_replies_view_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN DELETE FROM private.peer_replies_enc WHERE id = OLD.id; RETURN OLD; END;$$;

CREATE TRIGGER peer_replies_view_insert INSTEAD OF INSERT ON public.peer_replies
FOR EACH ROW EXECUTE FUNCTION public.peer_replies_view_insert();
CREATE TRIGGER peer_replies_view_update INSTEAD OF UPDATE ON public.peer_replies
FOR EACH ROW EXECUTE FUNCTION public.peer_replies_view_update();
CREATE TRIGGER peer_replies_view_delete INSTEAD OF DELETE ON public.peer_replies
FOR EACH ROW EXECUTE FUNCTION public.peer_replies_view_delete();
