# Plan 02 — Tenant Lifecycle Management

## Problem

The Super Admin can currently create a tenant and a school admin, but there is **no structured lifecycle** for what happens to a tenant after creation. Specifically there is no:

- Ability to **suspend** or **reactivate** a tenant (the `isActive` field exists but nothing sets it to `false`).
- Ability to **update** tenant details (name, address, email, slug).
- Audit trail of lifecycle events (who suspended, when, why).

Deletion is explicitly deferred — not in scope for this plan.

---

## Decisions

- **Deletion**: Skipped for now — only suspend/reactivate will be implemented.
- **Audit trail**: YES — store a suspension reason AND a full audit log of all lifecycle changes.

---

## Proposed Lifecycle States

```
ACTIVE  ──suspend──>  SUSPENDED  ──reactivate──>  ACTIVE
```

The `isActive` boolean on `Tenant` will be **replaced** with a `TenantStatus` enum for clarity.

---

## Schema Changes Required

### 1. Add `TenantStatus` enum and update `Tenant`

```prisma
enum TenantStatus {
  ACTIVE
  SUSPENDED
}

model Tenant {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  ...
  slug        String        @unique         // added in Plan 01
  isActive    Boolean       @default(true)  // keep for backward compat, derived from status
  status      TenantStatus  @default(ACTIVE)
  suspendedAt DateTime?
  suspendedBy String?       // userId of the Super Admin who suspended
  suspendReason String?
  ...
  auditLogs   TenantAuditLog[]
}
```

### 2. New `TenantAuditLog` model

```prisma
model TenantAuditLog {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId   String   @db.ObjectId
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  actorId    String   @db.ObjectId    // Super Admin user ID
  action     String                   // "SUSPENDED", "REACTIVATED", "UPDATED"
  reason     String?
  metadata   Json?                    // diff of changed fields for UPDATE events
  createdAt  DateTime @default(now())

  @@index([tenantId, createdAt])
}
```

---

## Proposed Endpoints (Super Admin only)

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/v1/super-admin/tenants/:id`              | Get single tenant + recent audit log |
| `PATCH`  | `/api/v1/super-admin/tenants/:id`              | Update tenant details (name, address, email, slug) |
| `PATCH`  | `/api/v1/super-admin/tenants/:id/suspend`      | Suspend a tenant (requires `reason`) |
| `PATCH`  | `/api/v1/super-admin/tenants/:id/reactivate`   | Reactivate a suspended tenant |
| `GET`    | `/api/v1/super-admin/tenants/:id/audit-logs`   | Paginated audit log for a tenant |

> `POST /api/v1/super-admin/tenants` (create) and `GET /api/v1/super-admin/tenants` (list) already exist.

---

## Service Function Signatures

```typescript
// superAdminService.ts additions
suspendTenant(tenantId: string, actorId: string, reason: string): Promise<Tenant>
reactivateTenant(tenantId: string, actorId: string): Promise<Tenant>
updateTenant(tenantId: string, actorId: string, payload: UpdateTenantPayload): Promise<Tenant>
getTenant(tenantId: string): Promise<Tenant & { auditLogs: TenantAuditLog[] }>
getTenantAuditLogs(tenantId: string, page: number, limit: number): Promise<TenantAuditLog[]>
```

---

## Business Rules

- A **SUSPENDED** tenant's requests are blocked by the Tenant Resolution Middleware (Plan 01) — no need to touch auth.
- Suspending an already-suspended tenant → 409 Conflict.
- Reactivating an already-active tenant → 409 Conflict.
- Every lifecycle action writes a row to `TenantAuditLog` transactionally with the main update.
- `actorId` is taken from `res.locals.user.id` (the Super Admin performing the action).

---

## Proposed File Changes

```
prisma/schema.prisma
  ← add TenantStatus enum
  ← add status, suspendedAt, suspendedBy, suspendReason fields to Tenant
  ← add TenantAuditLog model

src/modules/superAdmin/superAdminService.ts
  ← add: suspendTenant, reactivateTenant, updateTenant, getTenant, getTenantAuditLogs

src/modules/superAdmin/superAdminController.ts
  ← add controllers for new endpoints

src/modules/superAdmin/superAdminRoute.ts
  ← register new routes
```

---

## Status

- [x] Clarifying questions answered
- [x] Deletion: deferred
- [x] Audit trail: required
- [ ] Schema changes implemented
- [ ] Service functions implemented
- [ ] Controllers + routes implemented
