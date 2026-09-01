
-- 1. Extensions & private schema
CREATE SCHEMA IF NOT EXISTS private;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- 2. Encryption key holder (only service_role / definer functions can read)
CREATE TABLE IF NOT EXISTS private.encryption_keys (
  name text PRIMARY KEY,
  key  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.encryption_keys FROM PUBLIC, anon, authenticated;

INSERT INTO private.encryption_keys(name, key)
VALUES ('chat_messages', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

-- 3. Move base table into private schema and add encrypted column
ALTER TABLE public.chat_messages SET SCHEMA private;
ALTER TABLE private.chat_messages RENAME TO chat_messages_enc;
ALTER TABLE private.chat_messages_enc ADD COLUMN IF NOT EXISTS content_enc bytea;

-- Encrypt any existing rows, then drop plaintext column
UPDATE private.chat_messages_enc
SET content_enc = extensions.pgp_sym_encrypt(
  content,
  (SELECT key FROM private.encryption_keys WHERE name='chat_messages')
)
WHERE content_enc IS NULL AND content IS NOT NULL;

ALTER TABLE private.chat_messages_enc DROP COLUMN content;
ALTER TABLE private.chat_messages_enc ALTER COLUMN content_enc SET NOT NULL;

-- Lock down base table; only service_role touches it directly
REVOKE ALL ON private.chat_messages_enc FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.chat_messages_enc TO service_role;

-- 4. Security-definer helpers
CREATE OR REPLACE FUNCTION private.chat_encrypt(txt text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT extensions.pgp_sym_encrypt(txt, (SELECT key FROM private.encryption_keys WHERE name='chat_messages'));
$$;

CREATE OR REPLACE FUNCTION private.chat_decrypt(b bytea)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = private, extensions AS $$
  SELECT extensions.pgp_sym_decrypt(b, (SELECT key FROM private.encryption_keys WHERE name='chat_messages'));
$$;

REVOKE ALL ON FUNCTION private.chat_encrypt(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.chat_decrypt(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.chat_encrypt(text) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION private.chat_decrypt(bytea) TO authenticated, service_role, anon;

-- 5. Transparent view named chat_messages that the app already uses
CREATE OR REPLACE VIEW public.chat_messages
WITH (security_invoker = true) AS
SELECT
  id,
  session_id,
  user_id,
  role,
  private.chat_decrypt(content_enc) AS content,
  created_at
FROM private.chat_messages_enc;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO anon;
GRANT ALL ON public.chat_messages TO service_role;

-- 6. Re-apply RLS on the base table (same rules as before)
ALTER TABLE private.chat_messages_enc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own messages" ON private.chat_messages_enc;
CREATE POLICY "Users can read own messages"
ON private.chat_messages_enc
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

DROP POLICY IF EXISTS "Users can create chat messages" ON private.chat_messages_enc;
CREATE POLICY "Users can create chat messages"
ON private.chat_messages_enc
FOR INSERT
WITH CHECK (true);

-- 7. INSTEAD OF triggers so the view accepts writes to `content`
CREATE OR REPLACE FUNCTION public.chat_messages_view_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  INSERT INTO private.chat_messages_enc (id, session_id, user_id, role, content_enc, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.session_id,
    NEW.user_id,
    NEW.role,
    private.chat_encrypt(NEW.content),
    COALESCE(NEW.created_at, now())
  )
  RETURNING id, session_id, user_id, role, NEW.content, created_at
  INTO NEW.id, NEW.session_id, NEW.user_id, NEW.role, NEW.content, NEW.created_at;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.chat_messages_view_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  UPDATE private.chat_messages_enc
  SET session_id = NEW.session_id,
      user_id    = NEW.user_id,
      role       = NEW.role,
      content_enc = private.chat_encrypt(NEW.content)
  WHERE id = OLD.id;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.chat_messages_view_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, private AS $$
BEGIN
  DELETE FROM private.chat_messages_enc WHERE id = OLD.id;
  RETURN OLD;
END;$$;

DROP TRIGGER IF EXISTS chat_messages_view_insert ON public.chat_messages;
CREATE TRIGGER chat_messages_view_insert
INSTEAD OF INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_view_insert();

DROP TRIGGER IF EXISTS chat_messages_view_update ON public.chat_messages;
CREATE TRIGGER chat_messages_view_update
INSTEAD OF UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_view_update();

DROP TRIGGER IF EXISTS chat_messages_view_delete ON public.chat_messages;
CREATE TRIGGER chat_messages_view_delete
INSTEAD OF DELETE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_view_delete();
