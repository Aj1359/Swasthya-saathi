-- Fix permission denied for security invoker views on encrypted private tables

-- 1. Journal entries encrypted table
GRANT SELECT, INSERT, UPDATE, DELETE ON private.journal_entries_enc TO authenticated;
GRANT ALL ON private.journal_entries_enc TO service_role;

-- 2. Peer posts encrypted table
GRANT SELECT, INSERT, UPDATE, DELETE ON private.peer_posts_enc TO authenticated, anon;
GRANT ALL ON private.peer_posts_enc TO service_role;

-- 3. Peer replies encrypted table
GRANT SELECT, INSERT, UPDATE, DELETE ON private.peer_replies_enc TO authenticated, anon;
GRANT ALL ON private.peer_replies_enc TO service_role;
