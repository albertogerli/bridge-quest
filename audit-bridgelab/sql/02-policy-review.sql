-- Read-only policy definitions for security review; returns no table rows.
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'login_history', 'completed_modules', 'review_items',
    'friendships', 'challenges', 'classes', 'class_members',
    'assignments', 'instructor_requests', 'tournament_results',
    'partner_profiles', 'bbo_username_cleanup_2026_08'
  )
ORDER BY tablename, cmd, policyname;
