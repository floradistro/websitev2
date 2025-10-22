# Apply Users/Employees Migration Manually

The users and employees RBAC system migration needs to be applied manually.

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of: `supabase/migrations/20251021_users_employees_rbac.sql`
5. Paste into the SQL Editor
6. Click **Run**

The migration will create:
- `users` table (employees with roles)
- `user_locations` table (location assignments)
- `role_permissions` table (RBAC permissions)
- `user_sessions` table (session tracking)
- `audit_log` table (compliance logging)
- Views, functions, and RLS policies

## Or via Terminal (if you have psql):

```bash
psql "YOUR_SUPABASE_CONNECTION_STRING" < supabase/migrations/20251021_users_employees_rbac.sql
```

Once applied, the system will be ready for user/employee management!

