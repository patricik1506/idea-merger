# REST and WebSocket API

Base URL: http://127.0.0.1:8000. All bodies and responses are JSON. Browser clients use the HttpOnly `aim_session` cookie with credentials included; API clients send `Authorization: Bearer <access_token>`. The login/register response includes a bearer token but the frontend never stores it in localStorage. JWTs expire after eight hours. Logout, password reset/change and suspension revoke earlier sessions.

Swagger: `/docs`; ReDoc: `/redoc`; machine contract: `/openapi.json` (also shipped beside this guide). Public endpoints are explicitly marked below; all other routes require a current unsuspended member, with additional ownership/consent/admin checks.

Examples below were generated against an isolated database with fictional members and a deterministic test encoder. Scores illustrate structure, not semantic benchmark results. Actual IDs, timestamps, and scores vary. JWT tokens are redacted; reset tokens come only from the email.

## Endpoint index

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | JWT + resource authorization |
| POST | `/api/auth/logout` | JWT + resource authorization |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |
| POST | `/api/auth/change-password` | JWT + resource authorization |
| GET | `/api/profile` | JWT + resource authorization |
| PUT | `/api/profile` | JWT + resource authorization |
| GET | `/api/ideas` | JWT + resource authorization |
| POST | `/api/ideas` | JWT + resource authorization |
| GET | `/api/ideas/{id}` | JWT + resource authorization |
| PUT | `/api/ideas/{id}` | JWT + resource authorization |
| PATCH | `/api/ideas/{id}` | JWT + resource authorization |
| DELETE | `/api/ideas/{id}` | JWT + resource authorization |
| GET | `/api/matches` | JWT + resource authorization |
| GET | `/api/matches/{id}` | JWT + resource authorization |
| GET | `/api/requests` | JWT + resource authorization |
| POST | `/api/requests` | JWT + resource authorization |
| PATCH | `/api/requests/{id}` | JWT + resource authorization |
| GET | `/api/projects` | JWT + resource authorization |
| GET | `/api/projects/{id}` | JWT + resource authorization |
| POST | `/api/projects/{id}/milestones` | JWT + resource authorization |
| PATCH | `/api/milestones/{id}` | JWT + resource authorization |
| GET | `/api/projects/{id}/messages` | JWT + resource authorization |
| POST | `/api/projects/{id}/messages` | JWT + resource authorization |
| GET | `/api/notifications` | JWT + resource authorization |
| POST | `/api/notifications/read` | JWT + resource authorization |
| POST | `/api/reports` | JWT + resource authorization |
| GET | `/api/admin/stats` | Administrator |
| GET | `/api/admin/users` | Administrator |
| PATCH | `/api/admin/users/{id}` | Administrator |
| GET | `/api/admin/reports` | Administrator |
| PATCH | `/api/admin/reports/{id}` | Administrator |
| POST | `/api/assistant` | JWT + resource authorization |
| POST | `/api/merge/preview` | JWT + resource authorization |

## GET /api/health

Public.

Example request: `GET /api/health`

No request body.

Success: HTTP 200

```json
{
  "status": "ok",
  "embedding_backend": "hash"
}
```

## POST /api/auth/register

Public.

Example request: `POST /api/auth/register`

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "BuildTogether!2026",
  "accept_terms": true
}
```

Success: HTTP 201

```json
{
  "user": {
    "id": 1,
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "role": "user",
    "suspended": false,
    "created_at": "2026-10-31T06:54:36.494459+00:00"
  },
  "access_token": "JWT_ACCESS_TOKEN",
  "token_type": "bearer"
}
```

## POST /api/auth/login

Public.

Example request: `POST /api/auth/login`

```json
{
  "email": "alex@example.com",
  "password": "BuildTogether!2026"
}
```

Success: HTTP 200

```json
{
  "user": {
    "id": 1,
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "role": "user",
    "suspended": false,
    "created_at": "2026-10-31T06:54:36.494459+00:00"
  },
  "access_token": "JWT_ACCESS_TOKEN",
  "token_type": "bearer"
}
```

## GET /api/auth/me

Authenticated member; server checks resource access.

Example request: `GET /api/auth/me`

No request body.

Success: HTTP 200

```json
{
  "id": 1,
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "role": "user",
  "suspended": false,
  "created_at": "2026-10-31T06:54:36.494459+00:00"
}
```

## POST /api/auth/logout

Authenticated member; server checks resource access.

Example request: `POST /api/auth/logout`

No request body.

Success: HTTP 200

```json
{
  "ok": true
}
```

## POST /api/auth/forgot-password

Public.

Example request: `POST /api/auth/forgot-password`

```json
{
  "email": "unregistered@example.com"
}
```

Success: HTTP 200

```json
{
  "message": "If this account exists, a reset email has been sent."
}
```

## POST /api/auth/reset-password

Public.

Example request: `POST /api/auth/reset-password`

```json
{
  "token": "TOKEN_FROM_RESET_EMAIL",
  "password": "NewPassword!2026"
}
```

Success: HTTP 200

```json
{
  "ok": true
}
```

## POST /api/auth/change-password

Authenticated member; server checks resource access.

Example request: `POST /api/auth/change-password`

```json
{
  "current_password": "BuildTogether!2026",
  "password": "NewPassword!2026"
}
```

Success: HTTP 200

```json
{
  "ok": true
}
```

## GET /api/profile

Authenticated member; server checks resource access.

Example request: `GET /api/profile`

No request body.

Success: HTTP 200

```json
{
  "skills": [],
  "interests": [],
  "technologies": [],
  "experience": "Student",
  "goals": "",
  "visible": true,
  "notifications_enabled": true,
  "consent_required": true
}
```

## PUT /api/profile

Authenticated member; server checks resource access.

Example request: `PUT /api/profile`

```json
{
  "skills": [
    "Python",
    "React"
  ],
  "interests": [
    "Agriculture"
  ],
  "technologies": [
    "Python",
    "React"
  ],
  "experience": "Student",
  "goals": "Build a useful crop-health prototype.",
  "visible": true,
  "notifications_enabled": true,
  "consent_required": true
}
```

Success: HTTP 200

```json
{
  "skills": [
    "Python",
    "React"
  ],
  "interests": [
    "Agriculture"
  ],
  "technologies": [
    "Python",
    "React"
  ],
  "experience": "Student",
  "goals": "Build a useful crop-health prototype.",
  "visible": true,
  "notifications_enabled": true,
  "consent_required": true
}
```

## GET /api/ideas

Authenticated member; server checks resource access.

Example request: `GET /api/ideas`

No request body.

Success: HTTP 200

```json
[
  {
    "id": 1,
    "user_id": 1,
    "author": "Alex Morgan",
    "category": "Agriculture",
    "privacy": "summary_technologies",
    "created_at": "2026-10-31T06:54:37.227862+00:00",
    "archived": false,
    "unlocked": true,
    "title": "GrowSense",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ],
    "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
  }
]
```

## POST /api/ideas

Authenticated member; server checks resource access.

Example request: `POST /api/ideas`

```json
{
  "title": "GrowSense",
  "category": "Agriculture",
  "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
  "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset.",
  "privacy": "summary_technologies",
  "required_skills": [
    "Python",
    "React"
  ],
  "technologies": [
    "Python",
    "React"
  ]
}
```

Success: HTTP 201

```json
{
  "id": 1,
  "user_id": 1,
  "author": "Alex Morgan",
  "category": "Agriculture",
  "privacy": "summary_technologies",
  "created_at": "2026-10-31T06:54:37.227862+00:00",
  "archived": false,
  "unlocked": true,
  "title": "GrowSense",
  "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
  "required_skills": [
    "Python",
    "React"
  ],
  "technologies": [
    "Python",
    "React"
  ],
  "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
}
```

## GET /api/ideas/{id}

Authenticated member; server checks resource access.

Example request: `GET /api/ideas/2`

Parameters: `id` (path).

No request body.

Success: HTTP 200

```json
{
  "id": 2,
  "user_id": 2,
  "author": "Priya Sharma",
  "category": "Agriculture",
  "privacy": "summary_technologies",
  "created_at": "2026-10-31T06:54:37.242351+00:00",
  "archived": false,
  "unlocked": false,
  "title": "LeafLens",
  "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
  "required_skills": [
    "Python",
    "React"
  ],
  "technologies": [
    "Python",
    "React"
  ]
}
```

## PUT /api/ideas/{id}

Authenticated member; server checks resource access.

Example request: `PUT /api/ideas/1`

Parameters: `id` (path).

```json
{
  "title": "GrowSense",
  "category": "Agriculture",
  "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
  "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset.",
  "privacy": "summary_technologies",
  "required_skills": [
    "Python",
    "React"
  ],
  "technologies": [
    "Python",
    "React"
  ]
}
```

Success: HTTP 200

```json
{
  "id": 1,
  "user_id": 1,
  "author": "Alex Morgan",
  "category": "Agriculture",
  "privacy": "summary_technologies",
  "created_at": "2026-10-31T06:54:37.227862+00:00",
  "archived": false,
  "unlocked": true,
  "title": "GrowSense",
  "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
  "required_skills": [
    "Python",
    "React"
  ],
  "technologies": [
    "Python",
    "React"
  ],
  "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
}
```

## PATCH /api/ideas/{id}

Authenticated member; server checks resource access.

Example request: `PATCH /api/ideas/1`

Parameters: `id` (path).

```json
{
  "archived": false
}
```

Success: HTTP 200

```json
{
  "id": 1,
  "user_id": 1,
  "author": "Alex Morgan",
  "category": "Agriculture",
  "privacy": "summary_technologies",
  "created_at": "2026-10-31T06:54:37.227862+00:00",
  "archived": false,
  "unlocked": true,
  "title": "GrowSense",
  "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
  "required_skills": [
    "Python",
    "React"
  ],
  "technologies": [
    "Python",
    "React"
  ],
  "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
}
```

## DELETE /api/ideas/{id}

Authenticated member; server checks resource access.

Example request: `DELETE /api/ideas/3`

Parameters: `id` (path).

No request body.

Success: HTTP 200

```json
{
  "ok": true
}
```

## GET /api/matches

Authenticated member; server checks resource access.

Example request: `GET /api/matches?limit=20`

Parameters: `idea_id` (query), `limit` (query).

No request body.

Success: HTTP 200

```json
[
  {
    "idea": {
      "id": 2,
      "user_id": 2,
      "author": "Priya Sharma",
      "category": "Agriculture",
      "privacy": "summary_technologies",
      "created_at": "2026-10-31T06:54:37.242351+00:00",
      "archived": false,
      "unlocked": false,
      "title": "LeafLens",
      "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
      "required_skills": [
        "Python",
        "React"
      ],
      "technologies": [
        "Python",
        "React"
      ]
    },
    "source_idea_id": 1,
    "source_title": "GrowSense",
    "collaborator": {
      "id": 2,
      "name": "Priya Sharma",
      "skills": [
        "Python",
        "React"
      ],
      "experience": "Student"
    },
    "score": 96.9,
    "idea_similarity": 93.8,
    "skill_fit": 100.0,
    "technology_overlap": 100.0
  }
]
```

## GET /api/matches/{id}

Authenticated member; server checks resource access.

Example request: `GET /api/matches/2`

Parameters: `id` (path).

No request body.

Success: HTTP 200

```json
{
  "idea": {
    "id": 2,
    "user_id": 2,
    "author": "Priya Sharma",
    "category": "Agriculture",
    "privacy": "summary_technologies",
    "created_at": "2026-10-31T06:54:37.242351+00:00",
    "archived": false,
    "unlocked": false,
    "title": "LeafLens",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ]
  },
  "source_idea_id": 1,
  "source_title": "GrowSense",
  "collaborator": {
    "id": 2,
    "name": "Priya Sharma",
    "skills": [
      "Python",
      "React"
    ],
    "experience": "Student"
  },
  "score": 96.9,
  "idea_similarity": 93.8,
  "skill_fit": 100.0,
  "technology_overlap": 100.0
}
```

## GET /api/requests

Authenticated member; server checks resource access.

Example request: `GET /api/requests`

No request body.

Success: HTTP 200

```json
[
  {
    "id": 1,
    "sender_id": 1,
    "receiver_id": 2,
    "sender_name": "Alex Morgan",
    "receiver_name": "Priya Sharma",
    "source_idea": {
      "id": 1,
      "user_id": 1,
      "author": "Alex Morgan",
      "category": "Agriculture",
      "privacy": "summary_technologies",
      "created_at": "2026-10-31T06:54:37.227862+00:00",
      "archived": false,
      "unlocked": true,
      "title": "GrowSense",
      "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
      "required_skills": [
        "Python",
        "React"
      ],
      "technologies": [
        "Python",
        "React"
      ],
      "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
    },
    "target_idea": {
      "id": 2,
      "user_id": 2,
      "author": "Priya Sharma",
      "category": "Agriculture",
      "privacy": "summary_technologies",
      "created_at": "2026-10-31T06:54:37.242351+00:00",
      "archived": false,
      "unlocked": false,
      "title": "LeafLens",
      "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
      "required_skills": [
        "Python",
        "React"
      ],
      "technologies": [
        "Python",
        "React"
      ]
    },
    "status": "pending",
    "message": "Our ideas connect. Shall we explore a prototype?",
    "created_at": "2026-10-31T06:54:37.345528+00:00",
    "project_id": null
  }
]
```

## POST /api/requests

Authenticated member; server checks resource access.

Example request: `POST /api/requests`

```json
{
  "source_idea_id": 1,
  "target_idea_id": 2,
  "message": "Our ideas connect. Shall we explore a prototype?",
  "consent": true
}
```

Success: HTTP 201

```json
{
  "id": 1,
  "sender_id": 1,
  "receiver_id": 2,
  "sender_name": "Alex Morgan",
  "receiver_name": "Priya Sharma",
  "source_idea": {
    "id": 1,
    "user_id": 1,
    "author": "Alex Morgan",
    "category": "Agriculture",
    "privacy": "summary_technologies",
    "created_at": "2026-10-31T06:54:37.227862+00:00",
    "archived": false,
    "unlocked": true,
    "title": "GrowSense",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ],
    "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
  },
  "target_idea": {
    "id": 2,
    "user_id": 2,
    "author": "Priya Sharma",
    "category": "Agriculture",
    "privacy": "summary_technologies",
    "created_at": "2026-10-31T06:54:37.242351+00:00",
    "archived": false,
    "unlocked": false,
    "title": "LeafLens",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ]
  },
  "status": "pending",
  "message": "Our ideas connect. Shall we explore a prototype?",
  "created_at": "2026-10-31T06:54:37.345528+00:00",
  "project_id": null
}
```

## PATCH /api/requests/{id}

Authenticated member; server checks resource access.

Example request: `PATCH /api/requests/1`

Parameters: `id` (path).

```json
{
  "action": "accept",
  "consent": true
}
```

Success: HTTP 200

```json
{
  "id": 1,
  "sender_id": 1,
  "receiver_id": 2,
  "sender_name": "Alex Morgan",
  "receiver_name": "Priya Sharma",
  "source_idea": {
    "id": 1,
    "user_id": 1,
    "author": "Alex Morgan",
    "category": "Agriculture",
    "privacy": "summary_technologies",
    "created_at": "2026-10-31T06:54:37.227862+00:00",
    "archived": false,
    "unlocked": true,
    "title": "GrowSense",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ],
    "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
  },
  "target_idea": {
    "id": 2,
    "user_id": 2,
    "author": "Priya Sharma",
    "category": "Agriculture",
    "privacy": "summary_technologies",
    "created_at": "2026-10-31T06:54:37.242351+00:00",
    "archived": false,
    "unlocked": true,
    "title": "LeafLens",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ],
    "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
  },
  "status": "accepted",
  "message": "Our ideas connect. Shall we explore a prototype?",
  "created_at": "2026-10-31T06:54:37.345528+00:00",
  "project_id": 1
}
```

## GET /api/projects

Authenticated member; server checks resource access.

Example request: `GET /api/projects`

No request body.

Success: HTTP 200

```json
[
  {
    "id": 1,
    "title": "LeafLens",
    "created_at": "2026-10-31T06:54:37.378744+00:00",
    "milestones": [
      {
        "id": 1,
        "title": "Align on the problem and project scope",
        "done": false
      },
      {
        "id": 2,
        "title": "Design the first prototype",
        "done": false
      },
      {
        "id": 3,
        "title": "Build and validate the MVP",
        "done": false
      }
    ]
  }
]
```

## GET /api/projects/{id}

Authenticated member; server checks resource access.

Example request: `GET /api/projects/1`

Parameters: `id` (path).

No request body.

Success: HTTP 200

```json
{
  "id": 1,
  "title": "LeafLens",
  "members": [
    {
      "id": 1,
      "name": "Alex Morgan"
    },
    {
      "id": 2,
      "name": "Priya Sharma"
    }
  ],
  "ideas": [
    {
      "id": 1,
      "user_id": 1,
      "author": "Alex Morgan",
      "category": "Agriculture",
      "privacy": "summary_technologies",
      "created_at": "2026-10-31T06:54:37.227862+00:00",
      "archived": false,
      "unlocked": true,
      "title": "GrowSense",
      "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
      "required_skills": [
        "Python",
        "React"
      ],
      "technologies": [
        "Python",
        "React"
      ],
      "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
    },
    {
      "id": 2,
      "user_id": 2,
      "author": "Priya Sharma",
      "category": "Agriculture",
      "privacy": "summary_technologies",
      "created_at": "2026-10-31T06:54:37.242351+00:00",
      "archived": false,
      "unlocked": true,
      "title": "LeafLens",
      "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
      "required_skills": [
        "Python",
        "React"
      ],
      "technologies": [
        "Python",
        "React"
      ],
      "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset."
    }
  ],
  "milestones": [
    {
      "id": 1,
      "title": "Align on the problem and project scope",
      "done": false
    },
    {
      "id": 2,
      "title": "Design the first prototype",
      "done": false
    },
    {
      "id": 3,
      "title": "Build and validate the MVP",
      "done": false
    }
  ]
}
```

## POST /api/projects/{id}/milestones

Authenticated member; server checks resource access.

Example request: `POST /api/projects/1/milestones`

Parameters: `id` (path).

```json
{
  "title": "Interview pilot users"
}
```

Success: HTTP 201

```json
{
  "id": 4,
  "title": "Interview pilot users",
  "done": false
}
```

## PATCH /api/milestones/{id}

Authenticated member; server checks resource access.

Example request: `PATCH /api/milestones/4`

Parameters: `id` (path).

```json
{
  "done": true
}
```

Success: HTTP 200

```json
{
  "id": 4,
  "title": "Interview pilot users",
  "done": true
}
```

## GET /api/projects/{id}/messages

Authenticated member; server checks resource access.

Example request: `GET /api/projects/1/messages?after=0`

Parameters: `id` (path), `after` (query).

No request body.

Success: HTTP 200

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Alex Morgan",
    "text": "Let\u2019s align on the pilot scope.",
    "created_at": "2026-10-31T06:54:37.444967+00:00"
  }
]
```

## POST /api/projects/{id}/messages

Authenticated member; server checks resource access.

Example request: `POST /api/projects/1/messages`

Parameters: `id` (path).

```json
{
  "text": "Let\u2019s align on the pilot scope."
}
```

Success: HTTP 201

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Alex Morgan",
  "text": "Let\u2019s align on the pilot scope.",
  "created_at": "2026-10-31T06:54:37.444967+00:00"
}
```

## GET /api/notifications

Authenticated member; server checks resource access.

Example request: `GET /api/notifications`

No request body.

Success: HTTP 200

```json
[
  {
    "id": 2,
    "text": "Priya Sharma accepted your collaboration request",
    "read": false,
    "created_at": "2026-10-31T06:54:37.393040+00:00"
  }
]
```

## POST /api/notifications/read

Authenticated member; server checks resource access.

Example request: `POST /api/notifications/read`

No request body.

Success: HTTP 200

```json
{
  "ok": true
}
```

## POST /api/reports

Authenticated member; server checks resource access.

Example request: `POST /api/reports`

```json
{
  "idea_id": 2,
  "reason": "Please review this submission for possible copied content."
}
```

Success: HTTP 201

```json
{
  "id": 1,
  "status": "open"
}
```

## GET /api/admin/stats

Administrator.

Example request: `GET /api/admin/stats`

No request body.

Success: HTTP 200

```json
{
  "users": 3,
  "ideas": 2,
  "projects": 1,
  "reports": 1
}
```

## GET /api/admin/users

Administrator.

Example request: `GET /api/admin/users`

No request body.

Success: HTTP 200

```json
[
  {
    "id": 1,
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "role": "user",
    "suspended": false,
    "created_at": "2026-10-31T06:54:36.494459+00:00"
  },
  {
    "id": 2,
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "user",
    "suspended": false,
    "created_at": "2026-10-31T06:54:36.705581+00:00"
  },
  {
    "id": 3,
    "name": "Moderator",
    "email": "moderator@example.com",
    "role": "admin",
    "suspended": false,
    "created_at": "2026-10-31T06:54:36.971963+00:00"
  }
]
```

## PATCH /api/admin/users/{id}

Administrator.

Example request: `PATCH /api/admin/users/2`

Parameters: `id` (path).

```json
{
  "suspended": false
}
```

Success: HTTP 200

```json
{
  "id": 2,
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "role": "user",
  "suspended": false,
  "created_at": "2026-10-31T06:54:36.705581+00:00"
}
```

## GET /api/admin/reports

Administrator.

Example request: `GET /api/admin/reports`

No request body.

Success: HTTP 200

```json
[
  {
    "id": 1,
    "idea_id": 2,
    "reported_user_id": null,
    "reason": "Please review this submission for possible copied content.",
    "status": "open",
    "created_at": "2026-10-31T06:54:37.508703+00:00"
  }
]
```

## PATCH /api/admin/reports/{id}

Administrator.

Example request: `PATCH /api/admin/reports/1`

Parameters: `id` (path).

```json
{
  "action": "dismiss"
}
```

Success: HTTP 200

```json
{
  "ok": true
}
```

## POST /api/assistant

Authenticated member; server checks resource access.

Example request: `POST /api/assistant`

```json
{
  "idea_id": 1
}
```

Success: HTTP 200

```json
{
  "provider": "rule-based",
  "result": {
    "titles": [
      "GrowSense Studio",
      "GrowSense Connect",
      "GrowSense Lab"
    ],
    "features": [
      "Member onboarding and secure access",
      "Core agriculture workflow",
      "Progress tracking and feedback",
      "Privacy and consent controls"
    ],
    "tech_stack": [
      "Python",
      "React"
    ],
    "roadmap": [
      "Week 1: interview users, define scope and success metrics",
      "Week 2: wireframes, database design and API contracts",
      "Weeks 3\u20134: build the core workflow and authentication",
      "Week 5: test privacy, usability and matching quality",
      "Week 6: deploy, collect feedback and present results"
    ]
  }
}
```

## POST /api/merge/preview

Authenticated member; server checks resource access.

Example request: `POST /api/merge/preview`

```json
{
  "idea_ids": [
    1,
    3
  ],
  "guidance": "Combine the crop-health workflows."
}
```

Success: HTTP 200

```json
{
  "provider": "local structured merge",
  "rationale": "Combines the public problem statements, preserves every source in the private record, and brings the skills and technologies into one editable idea.",
  "warnings": [
    "Your direction is included in the private draft. When Claude is available, it also guides synthesis.",
    "No AI API key is configured. This draft uses the local structured merger; no external service receives your content."
  ],
  "source_ids": [
    1,
    3
  ],
  "sources": [
    {
      "id": 1,
      "title": "GrowSense",
      "category": "Agriculture"
    },
    {
      "id": 3,
      "title": "An unaccepted draft",
      "category": "Agriculture"
    }
  ],
  "draft": {
    "title": "GrowSense + An unaccepted draft",
    "category": "Agriculture",
    "private_description": "Merged source record. Original ideas are retained.\n\n\nMerge direction: Combine the crop-health workflows.\n\nSOURCE #1: GrowSense\nSubmitted: 2026-10-31T06:54:37.227862+00:00\nCategory: Agriculture\nPublic abstract: An accessible crop health platform using leaf images to detect plant disease.\nPrivate description:\nOur confidential implementation includes a consented field trial and a private evaluation dataset.\n\nSOURCE #3: An unaccepted draft\nSubmitted: 2026-10-31T06:54:37.602548+00:00\nCategory: Agriculture\nPublic abstract: An accessible crop health platform using leaf images to detect plant disease.\nPrivate description:\nOur confidential implementation includes a consented field trial and a private evaluation dataset.",
    "public_summary": "One connected project combining GrowSense: An accessible crop health platform using leaf images to detect plant disease; An unaccepted draft: An accessible crop health platform using leaf images to detect plant disease.",
    "privacy": "summary_technologies",
    "required_skills": [
      "Python",
      "React"
    ],
    "technologies": [
      "Python",
      "React"
    ]
  }
}
```

## Errors and authorization

- 400: invalid operation, reset token, or current password.
- 401: missing/expired/revoked JWT or invalid sign-in.
- 403: wrong owner/member/admin, absent mutual consent, suspension, or disallowed Origin.
- 404: unavailable/missing idea, match, project, milestone, or report.
- 409: duplicate email/request, answered request, archived idea during acceptance, or hard deletion of an accepted project idea.
- 422: field validation, missing terms or explicit consent.
- 429: login/register/reset/invite/chat/report/assistant throttle.
- 503: production reset mail is not configured or the semantic embedding model is unavailable.

Error example: `{"detail":"Mutual consent is required"}`. Validation errors use FastAPI’s detail array. The server never returns another person’s private description before both consent flags and accepted status are present. Visibility/archival removes ideas from discovery; accepted project participants retain their shared history.

## WebSocket /ws/projects/{id}

Requires an allowed Origin plus a valid current session and project membership. A browser on the same origin sends the HttpOnly cookie automatically. A client without the cookie must send `{"token":"JWT_ACCESS_TOKEN"}` as its first frame within ten seconds. Do not put bearer tokens in query strings.

Server ready: `{"type":"ready"}`. Send `{"text":"Hello teammate"}` to create an encrypted stored message; receive `{"type":"message","message":{"id":1,"user_id":2,"name":"Alex Morgan","text":"Hello teammate","created_at":"2026-10-26T10:00:00+00:00"}}`.

Send `{"type":"poll","after":0}` to retrieve subsequent messages as `{"type":"messages","messages":[...]}`. Membership, suspension, and token validity are rechecked on every frame. Unauthorized sockets close with code 1008. The React app uses REST polling every 2.5 seconds for a simple cross-host fallback; the socket endpoint is also tested independently. Use `wss://` in production.

## Privacy levels

`summary`: title/category/public summary/required skills; technology list withheld. `summary_technologies`: includes technologies. `hidden`: category and generic private label only; no original title/summary/required skills/technologies and no component match scores. A collaborator’s profile skills remain public while discoverable. Owners and exact mutually accepted collaborators receive full descriptions.

## Consent sequence

1. Create two active ideas owned by different members.
2. Sender POSTs a request with `consent:true`. No private details unlock.
3. Only recipient may accept, using `action:accept` and `consent:true`.
4. The server records both flags, creates a project and initial milestones, and sends an acceptance notification.
5. Only the two members may read that project’s chat and full idea details.


## Merge behavior

POST /api/merge/preview accepts 2–5 unique, positive idea IDs and an optional direction of up to 600 characters. Only active, unmoderated ideas owned by the current user are eligible; collaboration access alone is insufficient. The preview inherits the strictest source visibility, unions skills/technologies case-insensitively, and preserves complete source records in the private draft. Oversized descriptions or more than 30 combined tags are rejected with 422 rather than silently discarded. Sources in different categories default to Other for review.

The response contains provider, rationale, warnings, source_ids, sources, and a complete editable IdeaBody in draft. It creates no database record. Save the reviewed draft with POST /api/ideas. Claude, when configured, synthesizes public abstracts and the supplied direction; the private source descriptions remain local. An unavailable or invalid external response returns a labeled local draft. Neither operation deletes or overwrites the originals.
