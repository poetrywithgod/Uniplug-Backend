# Plan 01 — Tenant Resolution Middleware

## Problem

Currently, tenant context is only available **after** JWT authentication — read from `res.locals.user.tenantId`. This means:

- Public routes (e.g. application forms, browsing a school's courses) have **no tenant context** at all.
- There is no way for the system to know *which school* is being interacted with before a user logs in.
- The `SUPER_ADMIN` role has no `tenantId`, so shared middleware must handle that case cleanly.

---

## Architecture Overview

The frontend and backend are **fully separated**:

```
Browser
  │
  ├── unilag.uniplug.com   (Next.js — Vercel)   ← school-specific subdomain
  │
  └── api.uniplug.com      (Express — Render → OVH VPS)   ← single API URL
```

- Each school gets its own **frontend subdomain** on Vercel (`unilag.uniplug.com`).
- The backend has **one single URL** (`api.uniplug.com`) and never exposes subdomains itself.
- The frontend reads its own hostname, extracts the school slug (e.g. `"unilag"`), and passes it to every API request as an HTTP header.

---

## Decision

**Resolution strategy: `X-Tenant-Slug` header** — the frontend extracts the subdomain from its own URL and sends it to the backend on every request. The backend middleware reads that header and resolves the tenant.

**Public route support: YES** — anonymous users can reach school-specific public routes (e.g. start an application, browse courses). The header is sent by the Next.js app regardless of whether the user is logged in.

---

## Request Flow

```
1. User opens unilag.uniplug.com (Next.js on Vercel)
2. Next.js reads window.location.hostname → extracts slug "unilag"
3. Next.js attaches header to every outgoing API request:
      X-Tenant-Slug: unilag
4. Express resolveTenant middleware reads X-Tenant-Slug
5. Looks up: prisma.tenant.findFirst({ where: { slug: "unilag" } })
6. Sets res.locals.tenant = tenant
7. Downstream handlers have full tenant context ✅
```

---

## Infrastructure Requirements

### Backend (Render now → OVH VPS later)
- **No wildcard DNS needed.** Single domain `api.uniplug.com` with a standard TLS cert.
- The middleware change between Render and OVH is **zero** — the header-reading logic is identical.

### Frontend (Vercel)
- Add `*.uniplug.com` as a **wildcard custom domain** in the Vercel project settings.
- Vercel handles TLS for wildcard domains automatically.
- Next.js reads `window.location.hostname` (or `req.headers.host` on the server side) to extract the slug and attach the header.

### Domain Registrar
- Add one DNS record: `*.uniplug.com → Vercel` (Vercel will provide the target value when you add the custom domain).
- Add one DNS record: `api.uniplug.com → Render IP` (or OVH IP when migrating).

---

## Proposed Middleware Behaviour

```
resolveTenant(req, res, next)
  1. Read req.headers['x-tenant-slug']
  2. If missing → next() without setting tenant
     (SUPER_ADMIN platform routes don't send this header)
  3. Sanitise the slug: lowercase, alphanumeric + hyphens only
  4. Query prisma.tenant.findFirst({ where: { slug } })
  5. If not found → 404 "School not found"
  6. If tenant.status === 'SUSPENDED' → 403 "This school account is suspended"
  7. Set res.locals.tenant = tenant
  8. Call next()
```

---

## Proposed File Layout

```
src/middlewares/
  tenantResolver.ts     ← core middleware (reads X-Tenant-Slug header)
  requireTenant.ts      ← guard: throws 403 if res.locals.tenant is missing
```

---

## Integration in app.ts

```typescript
// Runs before all route handlers, after rate limiting
app.use(resolveTenant);

// Routes that require a school context:
router.get('/hostels', requireAuth, requireTenant, requireRole('SCHOOL_ADMIN'), ...)

// SUPER_ADMIN routes do NOT use requireTenant — they operate cross-tenant
router.get('/tenants', requireAuth, requireRole('SUPER_ADMIN'), ...)
```

---

## Auth Middleware Cross-check

After `requireAuth` resolves the user from JWT, it should validate:
- If `user.role !== 'SUPER_ADMIN'` and `res.locals.tenant` is set → assert `user.tenantId === res.locals.tenant.id`
- Mismatch = 403 (user's account belongs to a different school than the slug in the header)

---

## Local Development Strategy

Since the Next.js app won't be on a subdomain locally, developers must set the header manually:

- In the Next.js app: if `NODE_ENV === 'development'`, read slug from an env var (`NEXT_PUBLIC_TENANT_SLUG=unilag`) and attach it as the `X-Tenant-Slug` header.
- In tools like Postman / Insomnia: manually add `X-Tenant-Slug: <slug>` to requests.
- Document this in both the frontend and backend READMEs.

---

## Schema Change Required

Add a `slug` field to the `Tenant` model in `prisma/schema.prisma`.
This is the unique, URL-safe identifier for a school (e.g. `"unilag"`, `"uph"`):

```prisma
model Tenant {
  ...
  slug  String  @unique  // URL-safe school identifier, used as subdomain and in X-Tenant-Slug header
  ...
}
```

The `superAdminService.createTenant()` function must also be updated to accept and store this field.

---

## Status

- [x] Clarifying questions answered
- [x] Strategy decided: X-Tenant-Slug header (frontend reads its own subdomain)
- [x] Architecture clarified: separate frontend (Vercel) + backend (Render → OVH)
- [ ] Schema change: add `slug` to Tenant
- [ ] Update `createTenant` service to accept `slug`
- [ ] Implement `tenantResolver.ts`
- [ ] Implement `requireTenant.ts`
- [ ] Register middleware in `app.ts`
- [ ] Update `authMiddleware.ts` with tenant cross-check
- [ ] Document local dev override in README
