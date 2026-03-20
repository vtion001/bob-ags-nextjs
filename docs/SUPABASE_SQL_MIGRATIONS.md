# Supabase SQL Migrations

## Overview

This directory contains all database migrations for the BOB application. Each migration is idempotent (safe to run multiple times) and creates the necessary tables, policies, and functions.

## Running Migrations

Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/mmrhryddyjjkyhstytox/sql) and run migrations in order.

---

## Migration 001: `001_create_user_roles.sql`

### Purpose
Creates the `user_roles` table for role-based access control (RBAC).

### Tables Created
- `public.user_roles` — Stores user roles and permissions

### Columns
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Supabase auth user ID (UNIQUE) |
| `email` | TEXT | User email |
| `role` | TEXT | One of: `admin`, `manager`, `viewer` |
| `permissions` | JSONB | Permission flags (see below) |
| `approved` | BOOLEAN | Whether user is approved by admin |
| `approved_by` | TEXT | Email of approving admin |
| `approved_at` | TIMESTAMPTZ | When approved |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### Permissions Object
```json
{
  "can_view_calls": true,
  "can_view_monitor": true,
  "can_view_history": false,
  "can_view_agents": false,
  "can_manage_settings": false,
  "can_manage_users": false,
  "can_run_analysis": false
}
```

### Roles & Default Permissions
| Role | Calls | Monitor | History | Agents | Settings | Users | Analysis |
|------|-------|---------|---------|--------|----------|-------|---------|
| **Admin** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Manager** | Yes | Yes | Yes | Yes | No | No | Yes |
| **Viewer** | Yes | Yes | No | No | No | No | No |

### RLS Policies
- Users can **SELECT** their own role
- Users can **INSERT** their own role (self-registration)
- Admins can **ALL** (manage all roles)
- Users can **UPDATE** their own role

### Trigger
- `handle_new_user()` — Auto-creates a viewer role when a user signs up via Supabase Auth

### Functions
- `get_user_permissions(p_user_id TEXT)` — Returns JSONB permissions for a user

### Notes
- The trigger automatically grants `viewer` role to all new users
- Dev email `agsdev@allianceglobalsolutions.com` is granted admin access at the application level (bypasses RBAC check)

---

## Migration 002: `002_create_user_settings.sql`

### Purpose
Creates the `user_settings` table for storing user preferences and API credentials.

### Tables Created
- `public.user_settings` — Stores per-user settings

### Columns
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Supabase auth user ID (UNIQUE) |
| `settings` | JSONB | User preferences (see below) |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### Default Settings Object
```json
{
  "ctm_access_key": "",
  "ctm_secret_key": "",
  "ctm_account_id": "",
  "openrouter_api_key": "",
  "default_client": "flyland",
  "light_mode": true,
  "email_notifications": false,
  "auto_sync_calls": true,
  "call_sync_interval": 60
}
```

### RLS Policies
- Users can **ALL** operations on their own settings (`user_id = auth.uid()::text`)

---

## Migration 003: `003_create_calls_table.sql`

### Purpose
Creates the `calls` table for caching CTM call data and the `calls_sync_log` table for tracking sync status.

### Tables Created
- `public.calls` — Cached call records from CTM
- `public.calls_sync_log` — Sync history log

### Calls Columns
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ctm_call_id` | TEXT | Unique CTM call ID (UNIQUE) |
| `user_id` | TEXT | Owner Supabase user ID |
| `phone` | TEXT | Caller phone number |
| `direction` | TEXT | `inbound` or `outbound` |
| `duration` | INTEGER | Call duration in seconds |
| `status` | TEXT | `completed`, `missed`, `active` |
| `timestamp` | TIMESTAMPTZ | When call occurred |
| `caller_number` | TEXT | Caller's phone number |
| `tracking_number` | TEXT | CTM tracking number |
| `tracking_label` | TEXT | Source label (e.g., "Phillies") |
| `source` | TEXT | Call source |
| `source_id` | TEXT | Source ID |
| `agent_id` | TEXT | Handling agent ID |
| `agent_name` | TEXT | Handling agent name |
| `recording_url` | TEXT | Audio recording URL |
| `transcript` | TEXT | Call transcript |
| `city` | TEXT | Caller city |
| `state` | TEXT | Caller state |
| `postal_code` | TEXT | Caller ZIP |
| `notes` | TEXT | Agent notes |
| `talk_time` | INTEGER | Talk duration (seconds) |
| `wait_time` | INTEGER | Wait duration (seconds) |
| `ring_time` | INTEGER | Ring duration (seconds) |
| `score` | INTEGER | QA score (0-100) |
| `sentiment` | TEXT | `positive`, `neutral`, `negative` |
| `summary` | TEXT | AI-generated summary |
| `tags` | JSONB | Tags array |
| `disposition` | TEXT | Suggested disposition |
| `synced_at` | TIMESTAMPTZ | Last sync time |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

### Indexes
- `calls_user_id_idx` — Fast lookup by user
- `calls_timestamp_idx` — Sort by call time
- `calls_ctm_call_id_idx` — Unique CTM ID lookup
- `calls_agent_id_idx` — Filter by agent
- `calls_direction_idx` — Filter inbound/outbound
- `calls_synced_at_idx` — Sync status queries

### RLS Policies
- Users can **ALL** operations on their own calls (`user_id = auth.uid()::text`)

### Calls Sync Log Columns
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner Supabase user ID |
| `last_sync_at` | TIMESTAMPTZ | When sync completed |
| `calls_synced` | INTEGER | Number of calls synced |
| `status` | TEXT | `completed`, `failed` |
| `created_at` | TIMESTAMPTZ | Log entry time |

### RLS Policies
- Users can **ALL** operations on their own sync logs

---

## Troubleshooting

### "policy already exists" errors
All migrations use `CREATE POLICY IF NOT EXISTS` patterns and `DROP POLICY IF EXISTS` to be idempotent. If you encounter policy errors, the migration was likely partially run before. Re-run the full migration — it will clean up and recreate everything.

### "column does not exist" errors
If a column doesn't exist on a drop, the table was never created. Run the migration from scratch — `DROP TABLE IF EXISTS` handles cleanup.

### RLS blocking access
Make sure the RLS policies are created AFTER the table. If you manually created tables without RLS, you may need to re-run the migration.

### Auth not working
The `handle_new_user()` trigger requires proper `auth.users` table access. The trigger uses `SECURITY DEFINER` to bypass RLS during insert.

---

## Data Flow

```
1. User signs up → Supabase Auth → trigger creates user_roles entry (viewer)
2. Admin approves user → user_roles.approved = true
3. User configures CTM credentials → stored in user_settings
4. Sync Now clicked → POST /api/calls → CTM API → calls table
5. Dashboard loads → GET /api/calls → reads from calls table (cache)
6. Background sync → POST /api/calls → checks for new CTM calls → upserts to calls table
```
