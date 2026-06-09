# Hostel API Integration Guide

This guide details the endpoints available for the **Hostel Allocation and Application Flow** within the Uniplug system.

## Base URL

All API paths described below are relative to `{{BASE_URL}}/api/v1`

## Authentication

All endpoints require a valid `Bearer Token` passed in the `Authorization` header:
`Authorization: Bearer <your-jwt-token>`

---

## 1. Hostel Management (Hostel Admin)

_These endpoints strictly require the `HOSTEL_ADMIN` role._

### 1.1 Create Hostel

- **Endpoint:** `POST /hostels`
- **Role Required:** `HOSTEL_ADMIN`
- **Description:** Creates a new hostel entity in the school mapping.

**Payload:**

```json
{
  "name": "Queen Amina Hall",
  "type": "FEMALE", // MALE | FEMALE | MIXED
  "capacity": 500,
  "price": 120000,
  "totalRooms": 100,
  "totalBlocks": 2,
  "totalWings": 4,
  "spacePerRoom": 5
}
```

**Returns (201):** The newly created hostel object.

### 1.2 Get All Hostels

- **Endpoint:** `GET /hostels`
- **Role Required:** `HOSTEL_ADMIN`
- **Description:** Retrieves all hostels mapped to the admin's school/tenant, including available capacity counts derived dynamically.

**Returns (200):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "abc-123",
      "name": "Queen Amina Hall",
      "capacity": 500,
      "availableSpaces": 498 // Server calculated dynamically!
      // ...other properties
    }
  ]
}
```

### 1.3 Update Hostel

- **Endpoint:** `PUT /hostels/:id`
- **Role Required:** `HOSTEL_ADMIN`
- **Description:** Updates properties of a hostel. Note: The server automatically prevents reducing the `capacity` below the amount of currently approved applications.

**Payload (Partial):**

```json
{
  "capacity": 600,
  "price": 150000
}
```

**Returns (200):** The updated hostel object.

### 1.4 Delete Hostel

- **Endpoint:** `DELETE /hostels/:id`
- **Role Required:** `HOSTEL_ADMIN`
- **Description:** Deletes a hostel and implicitly cascades its unassociated queues if not tied via schema rules.

**Returns (204):** Empty body.

---

## 2. Student Hostel Application Flow

_These endpoints strictly require the `STUDENT` role, alongside a verified Admission record determining the student's gender._

### 2.1 Apply for a Space

- **Endpoint:** `POST /hostels/:id/apply`
- **Role Required:** `STUDENT`
- **Description:** Pushes the student into the application queue for the specified hostel `id`.

**Rules Validated Server-Side:**

- The student cannot already have an active/pending hostel application.
- The student's recorded gender must match the hostel's `HostelType`.
- The hostel must have `availableSpaces > 0`.

**Payload:** No body required.

**Returns (201):**

```json
{
  "status": "success",
  "message": "Application submitted successfully",
  "data": { ...applicationData }
}
```

---

## 3. Application Review Workflow (Hostel Admin)

_These endpoints strictly require the `HOSTEL_ADMIN` role._

### 3.1 Get Hostel Applications

- **Endpoint:** `GET /hostels/:id/applications`
- **Role Required:** `HOSTEL_ADMIN`
- **Description:** Retrieves all applications relating to a specific hostel.

**Returns (200):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "app-123",
      "status": "PENDING",
      "student": {
        "id": "...",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com"
      },
      "createdAt": "..."
    }
  ]
}
```

### 3.2 Review Application

- **Endpoint:** `PATCH /hostels/applications/:id/review`
- **Role Required:** `HOSTEL_ADMIN`
- **Description:** Admin approves or rejects the pending application. **Warning:** Setting a state to `APPROVED` locks in the capacity. The server utilizes transactions internally to gracefully handle multiple admins interacting closely matching the capacity limit.

**Payload:**

```json
{
  "status": "APPROVED" // or REJECTED
}
```

_If REJECTED, a `rejectionReason` is required:_

```json
{
  "status": "REJECTED",
  "rejectionReason": "You missed the window deadline."
}
```

**Returns (200):**

```json
{
  "status": "success",
  "message": "Application approved successfully",
  "data": { ...updatedApplication }
}
```
