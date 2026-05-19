# RapidFix — On-Demand Technician Dispatch Platform (POC)

## Architecture

| Service              | Port | Database               | Swagger UI                              |
|----------------------|------|------------------------|-----------------------------------------|
| user-service         | 8081 | rapidfix_users         | http://localhost:8081/swagger-ui.html   |
| technician-service   | 8082 | rapidfix_technicians   | http://localhost:8082/swagger-ui.html   |
| dispatch-service     | 8083 | rapidfix_dispatch      | http://localhost:8083/swagger-ui.html   |

## Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose

## Quick Start

### 1. Start MySQL
```bash
docker-compose up -d
```

### 2. Start Each Service
```bash
# Terminal 1 — User Service
cd user-service && ./mvnw spring-boot:run

# Terminal 2 — Technician Service
cd technician-service && ./mvnw spring-boot:run

# Terminal 3 — Dispatch Service
cd dispatch-service && ./mvnw spring-boot:run
```

---

## API Flow (End-to-End)

### Step 1: Register a User
```
POST http://localhost:8081/api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "USER"
}
→ Returns: { "id": 1, "token": "<JWT>" }
```

### Step 2: Register a Technician
```
POST http://localhost:8081/api/auth/register
{ "name": "Bob", "email": "bob@example.com", "password": "secret123", "role": "TECHNICIAN" }
→ Returns { "id": 2, "token": "<JWT>" }

POST http://localhost:8082/api/technicians   (Bearer <JWT>)
{
  "userId": 2,
  "name": "Bob",
  "email": "bob@example.com",
  "phone": "9876543210",
  "serviceTypes": ["ELECTRICIAN", "APPLIANCE_REPAIR"],
  "latitude": 17.3850,
  "longitude": 78.4867
}
```

### Step 3: Set Technician Available
```
PATCH http://localhost:8082/api/technicians/{id}/availability?status=AVAILABLE
```

### Step 4: Create a Service Request (triggers broadcast)
```
POST http://localhost:8083/api/requests   (Bearer <user JWT>)
{
  "userId": 1,
  "userName": "Alice",
  "serviceType": "ELECTRICIAN",
  "description": "Power outage in kitchen, need immediate help",
  "userLatitude": 17.3870,
  "userLongitude": 78.4890,
  "address": "42 MG Road, Hyderabad"
}
→ Status: PENDING — system broadcasts to nearby technicians
```

### Step 5a: Technician Accepts
```
POST http://localhost:8083/api/requests/{id}/accept
{ "technicianId": 1, "technicianName": "Bob" }
→ Status: ACCEPTED
```

### Step 5b: OR — Auto-Assignment (automatic after 60s if no one accepts)
The scheduler runs every 30 seconds and auto-assigns the best technician
(closest + highest rating) if the broadcast window expires.

### Step 6: Mark In Progress → Complete
```
PATCH http://localhost:8083/api/requests/{id}/in-progress  → IN_PROGRESS
PATCH http://localhost:8083/api/requests/{id}/complete      → COMPLETED
```

### Step 7: Rate the Technician
```
PATCH http://localhost:8082/api/technicians/{id}/rating
{ "rating": 5 }
```

---

## Key Features Implemented

### user-service
- JWT authentication (register + login)
- Full CRUD with `@Transactional`
- Pagination on all list endpoints
- Role-based security (USER / TECHNICIAN / ADMIN)
- Global exception handler
- Swagger/OpenAPI documentation
- Structured logging to file

### technician-service
- Technician profile management (CRUD)
- Availability status toggle (AVAILABLE / BUSY / OFFLINE)
- Real-time GPS location update
- Nearby technician search using Haversine distance formula
- Filter by service type + radius
- Rating system with weighted average
- Pagination on list endpoints
- Swagger documentation + JWT security

### dispatch-service
- Service request full lifecycle: PENDING → ACCEPTED/AUTO_ASSIGNED → IN_PROGRESS → COMPLETED
- Broadcast to nearby available technicians on creation
- **Auto-assignment scheduler** (runs every 30s):
  - Finds PENDING requests past broadcast timeout (default 60s)
  - Scores technicians: 60% rating + 40% proximity
  - Assigns best match and marks them BUSY
- Dispatch audit log (OFFERED / ACCEPTED / REJECTED / AUTO_ASSIGNED)
- Pagination on all list endpoints
- WebClient inter-service calls (technician availability sync)
- Global exception handler with proper HTTP status codes
- Swagger documentation

---

## JWT Secret
All three services share the same `jwt.secret` in application.yaml.
Tokens issued by user-service are validated by technician-service and dispatch-service.

## Logs
Each service writes logs to:
- `user-service/logs/user-service.log`
- `technician-service/logs/technician-service.log`
- `dispatch-service/logs/dispatch-service.log`
