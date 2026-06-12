# Architecture & diagrams

## ERD (high level)

```mermaid
erDiagram
  Organization ||--o{ User : has
  Organization ||--o{ Farm : has
  Organization ||--o{ RolePermission : has
  Farm ||--o{ Zone : contains
  Zone ||--o{ Plant : has
  Plant ||--o{ PlantHistory : logs
  Plant ||--o{ DiseaseRecord : has
  Plant ||--o{ Treatment : receives
  Plant ||--o{ FertilizerApplication : receives
  Plant ||--o{ WateringLog : receives
  Plant ||--o{ Harvest : yields
  Farm ||--o{ Season : plans
  Season ||--o{ Harvest : groups
  Plant ||--o{ EmployeeTask : links
  User ||--o{ EmployeeTask : assigned
  User ||--o{ Notification : receives
  Plant ||--o{ QrCode : exposes
  User ||--o{ AttendanceLog : checks_in
  User ||--o{ ActivityLog : acts
  Plant ||--o{ MediaFile : shows
  Plant ||--o{ Certification : proves
```

## QR workflow (sequence)

```mermaid
sequenceDiagram
  participant M as Manager (web)
  participant API as Nest API
  participant DB as PostgreSQL
  participant G as Guest phone

  M->>API: POST /plants (JWT)
  API->>DB: insert Plant + nanoid qrToken
  API->>API: render QR URL /p/{id}?t={token}
  API-->>M: plant + qrSvg
  G->>API: GET /plants/public/{id}?t=...
  API->>DB: verify token matches plant
  API-->>G: public payload (timeline, media, certs)
```

## Realtime notifications

```mermaid
flowchart LR
  subgraph API[NestJS]
    NS[NotificationsService]
    GW[Socket.IO /realtime]
  end
  subgraph Clients
    W[Web dashboard]
    M[Mobile PWA]
  end
  NS -->|broadcast emit| GW
  GW --> W
  GW --> M
```

Production hardening: authenticate socket handshake (JWT), join rooms `org:{id}` / `user:{id}`, optionally scale with Redis adapter.

## CI/CD (suggested)

- Lint + test + `prisma validate` on PR.
- Build Docker images; run `prisma migrate deploy` in release job.
- Secrets: JWT secrets, `DATABASE_URL`, S3 keys via vault / GitHub OIDC.
