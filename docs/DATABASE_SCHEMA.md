# Supabase Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o| user_roles : "has"
    users ||--o| user_settings : "has"
    users ||--o{ agent_profiles : "maps to"
    users {
        uuid id PK
        string email
        timestamp created_at
    }

    user_roles ||--o{ users : "assigned to"
    user_roles {
        uuid id PK
        uuid user_id FK
        string role
        jsonb permissions
        timestamp created_at
    }

    user_settings ||--|| users : "belongs to"
    user_settings {
        uuid id PK
        uuid user_id FK "unique"
        string ctm_access_key
        string ctm_secret_key
        string ctm_account_id
        jsonb preferences
        timestamp updated_at
    }

    agent_profiles ||--|| users : "belongs to"
    agent_profiles {
        uuid id PK
        uuid user_id FK
        string agent_id "CTM agent ID"
        string name
        string email
        string group_id
        string group_name
        timestamp created_at
    }

    calls {
        uuid id PK
        string ctm_call_id UK
        uuid user_id FK
        string phone
        string caller_number
        string direction
        integer duration
        string status
        timestamp created_at
        integer score
        string sentiment
        string disposition
        string source
        string city
        string state
        jsonb rubric_results
        jsonb rubric_breakdown
        string transcript
        string summary
        jsonb tags
    }

    calls_sync_log {
        uuid id PK
        timestamp sync_start
        timestamp sync_end
        integer calls_synced
        string status
    }

    live_analysis_logs {
        uuid id PK
        uuid user_id FK
        string ctm_call_id
        jsonb transcript
        jsonb insights
        integer interim_score
        timestamp created_at
    }

    qa_overrides {
        uuid id PK
        string ctm_call_id
        uuid user_id FK
        integer original_score
        integer override_score
        string reason
        timestamp created_at
    }

    call_notes {
        uuid id PK
        string ctm_call_id FK
        uuid user_id FK
        string note
        timestamp created_at
    }

    notes_log {
        uuid id PK
        string table_name
        uuid record_id
        string action
        jsonb old_data
        jsonb new_data
        uuid user_id FK
        timestamp created_at
    }

    ctm_assignments {
        uuid id PK
        uuid user_id FK
        string ctm_agent_id
        string ctm_group_id
        timestamp created_at
    }

    knowledge_base {
        uuid id PK
        string content
        string category
        vector embedding
        timestamp created_at
    }

    calls ||--o{ live_analysis_logs : "has"
    calls ||--o{ qa_overrides : "has"
    calls ||--o{ call_notes : "has"
    users ||--o{ notes_log : "created"
```

## Tables Overview

| Table | Description | Key Columns |
|-------|-------------|------------|
| `users` | Supabase auth users | id, email |
| `user_roles` | User roles & permissions | user_id, role, permissions |
| `user_settings` | Per-user preferences & CTM credentials | user_id, ctm_access_key, ctm_secret_key |
| `agent_profiles` | CTM agent mappings | user_id, agent_id, name, group_id |
| `calls` | Synced CTM call records | ctm_call_id, phone, caller_number, score, disposition |
| `calls_sync_log` | Bulk sync audit trail | sync_start, sync_end, calls_synced |
| `live_analysis_logs` | Real-time analysis data | ctm_call_id, transcript, insights, interim_score |
| `qa_overrides` | Manual QA score overrides | ctm_call_id, original_score, override_score |
| `call_notes` | Call notes | ctm_call_id, note |
| `notes_log` | Audit log for notes | table_name, record_id, action, old_data, new_data |
| `ctm_assignments` | Agent-CTM assignments | user_id, ctm_agent_id, ctm_group_id |
| `knowledge_base` | RAG embeddings for AI suggestions | content, category, embedding |

## RPC Functions

| Function | Purpose | Returns |
|---------|---------|---------|
| `handle_new_user()` | Trigger: creates user_settings on signup | - |
| `get_user_permissions(uid)` | Get user role & permissions | role, permissions JSON |
| `get_analyzed_calls_paginated(limit, offset)` | Paginated QA log entries | calls + total_count |
| `get_analyzed_calls_count()` | Count analyzed calls | integer |
| `search_calls_by_phone(phone)` | Search historical calls by phone | matching calls |

## API Routes → Database Mapping

```mermaid
flowchart LR
    subgraph Frontend
        A["/dashboard/calls"]
        B["/dashboard/history"]
        C["/dashboard/qa-logs"]
        D["/dashboard/settings"]
        E["/dashboard/monitor"]
    end

    subgraph "API Routes"
        F["/api/calls"]
        G["/api/ctm/calls/search"]
        H["/api/qa-overrides"]
        I["/api/users/settings"]
        J["/api/live-analysis-logs"]
    end

    subgraph Supabase
        K["calls"]
        L["user_settings"]
        M["qa_overrides"]
        N["live_analysis_logs"]
        O["agent_profiles"]
    end

    A --> F --> K
    B --> G --> K
    C --> H --> M
    D --> I --> L
    E --> J --> N
```

## Key Relationships

1. **users → user_roles**: One-to-many (user has one role)
2. **users → user_settings**: One-to-one (user has one settings record)
3. **users → agent_profiles**: One-to-many (user can map to multiple CTM agents)
4. **calls → live_analysis_logs**: One-to-many (call can have multiple analysis logs)
5. **calls → qa_overrides**: One-to-one (call has at most one QA override)
6. **calls → call_notes**: One-to-many (call can have multiple notes)
