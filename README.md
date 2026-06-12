# RapidFix — On-Demand Home Services Platform (POC)

RapidFix is an on-demand technician dispatch platform (similar to UrbanClap / Urban Company), built as a microservices POC. Users raise service requests for home repairs, nearby technicians send quotes, users approve and track the technician live, and the job is completed end-to-end with billing and ratings.

---

## Architecture

| Service              | Port | Database               | Swagger UI                              |
|----------------------|------|-------------------------|------------------------------------------|
| api-gateway          | 8080 | —                       | —                                          |
| user-service         | 8081 | rapidfix_users          | http://localhost:8081/swagger-ui.html     |
| technician-service   | 8082 | rapidfix_technicians    | http://localhost:8082/swagger-ui.html     |
| dispatch-service     | 8083 | rapidfix_dispatch       | http://localhost:8083/swagger-ui.html     |
| frontend (React)     | 3000 | —                       | —                                          |

All requests from the frontend go through the **API Gateway** on port 8080, which handles JWT validation and routes to the downstream services.

### Observability stack
- **Micrometer + Prometheus** — metrics for all services
- **Zipkin** — distributed tracing across service calls
- **Splunk** (via Python HEC sidecar) — centralized log forwarding
- **Redis** — used by the API Gateway

---

## Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+ (for frontend)
- Docker & Docker Compose

---

## Quick Start

### 1. Start all infrastructure & services
```bash
docker-compose up -d
```
This brings up MySQL, Redis, Zipkin, Prometheus, and all four backend services.

### 2. Start the frontend
```bash
cd rapidfix-frontend
npm install
npm start
```
Frontend runs on **http://localhost:3000**.

### 3. (Optional) Run services individually for development
```bash
cd user-service && ./mvnw spring-boot:run
cd technician-service && ./mvnw spring-boot:run
cd dispatch-service && ./mvnw spring-boot:run
cd gateway && ./mvnw spring-boot:run
```

---

## End-to-End User Journey

1. **User registers / logs in** → JWT issued by `user-service`, validated by all downstream services via the gateway.
2. **Technician registers** → completes profile setup (services offered, phone, location).
3. **User creates a service request** — picks a service type, describes the issue, sets location via GPS or address autocomplete.
4. Request is **broadcast to nearby technicians** (within configurable radius) using Haversine distance.
5. **Technician submits a quote** (hourly rate, estimated hours, parts/appliance charge, travel charge auto-calculated based on distance). Technician is marked **BUSY** the moment they quote.
6. **User reviews the quote** — sees full cost breakdown — and **approves or rejects**.
   - Reject → request returns to `PENDING`, technician becomes `AVAILABLE` again.
   - Approve → request becomes `APPROVED`, ETA calculated from distance.
7. **Technician can withdraw their quote** if the user hasn't responded within 5 minutes — frees them up to browse other jobs.
8. **Live GPS tracking** — once approved, the technician's location is broadcast every 30s and shown on a live map with ETA to the user.
9. **Technician marks job IN_PROGRESS** on arrival, then **COMPLETED** with actual hours and final parts cost.
10. **User rates the technician** (1–5 stars) — feeds into a weighted average rating.
11. **Auto-assignment scheduler** — runs periodically; any request still `PENDING` past the broadcast timeout is automatically assigned to the best available technician (60% rating + 40% proximity).

---

## Key Features by Service

### user-service
- JWT authentication (register + login), role-based (USER / TECHNICIAN)
- Full CRUD with `@Transactional`
- Pagination on all list endpoints
- Global exception handler
- Swagger/OpenAPI documentation
- Structured logging to file

### technician-service
- Technician profile management (CRUD)
- Availability status (AVAILABLE / BUSY / OFFLINE), kept in sync automatically as jobs progress
- Real-time GPS location updates (polled every 30s during active jobs)
- Nearby technician search using Haversine distance formula
- Filter by service type + radius
- Weighted-average rating system
- Pagination + Swagger + JWT security

### dispatch-service
- Full service request lifecycle:
  `PENDING → QUOTED → APPROVED → IN_PROGRESS → COMPLETED`
  (with `CANCELLED` and back-to-`PENDING` via reject/withdraw)
- Quote submission with auto-calculated travel charge (free under 3km, ₹12/km beyond)
- **Quote withdrawal** — technician can withdraw an unanswered quote after 5 minutes, freeing them to browse other jobs
- Technician availability automatically synced on every state transition (quote, approve, reject, withdraw, complete, cancel)
- ETA calculation based on distance at approval time
- Broadcast to nearby available technicians on request creation
- **Auto-assignment scheduler**:
  - Finds `PENDING` requests past the broadcast timeout
  - Scores technicians: 60% rating + 40% proximity
  - Assigns best match and marks them `BUSY`
- Dispatch audit log (`OFFERED` / `QUOTED` / `QUOTE_APPROVED` / `QUOTE_REJECTED` / `QUOTE_WITHDRAWN` / `AUTO_ASSIGNED` / `COMPLETED` / `CANCELLED`)
- Inter-service calls to technician-service via WebClient
- Pagination on all list endpoints + Swagger documentation

### api-gateway
- Single entry point on port 8080 for the frontend
- JWT validation shared across services
- Distributed tracing via Zipkin, metrics via Prometheus

### rapidfix-frontend (React)
- Separate dashboards for **User** and **Technician** roles
- User: dashboard with stats, paginated request history with status filters, new request form with service-type picker and address autocomplete, live quote review and approval
- Technician: dashboard with availability toggle, stats (active jobs, completed, rating), paginated job history, browse-jobs view filtered by service type and 20km radius, quote submission with live cost preview, job completion flow with final billing
- Live GPS tracking map (React-Leaflet) showing user and technician positions with ETA
- Status pills, animated indicators, and responsive card-based UI throughout

---

## JWT Secret
All services share the same `jwt.secret`. Tokens issued by `user-service` are validated by `technician-service`, `dispatch-service`, and the `api-gateway`.

## Logs
Each service writes logs to its own `logs/` directory and forwards them to Splunk via a Python HEC sidecar:
- `user-service/logs/user-service.log`
- `technician-service/logs/technician-service.log`
- `dispatch-service/logs/dispatch-service.log`
- `logs/gateway/api-gateway.log`

---

## Known Limitations / Future Work

- **Inter-service calls use a try-catch fallback, not a circuit breaker** — if `technician-service` is down, calls from `dispatch-service` will hang until timeout before failing gracefully. Resilience4j circuit breakers would make this fail-fast in production.
- **No document verification for technicians** — a production version would allow technicians to upload ID/certification documents (e.g. to Cloudinary/S3) for admin review and a "Verified" badge.
- **Payment Integration** — currently the final amount is calculated and displayed but no actual payment is processed. A production version would integrate a payment gateway (e.g. Razorpay/Stripe) to collect payment after job completion (or pre-authorize a hold on approval), support UPI/cards/wallets, generate digital invoices, and handle technician payouts with platform commission.
- **Notification Service** — a dedicated `notification-service` to keep users and technicians informed in real time (new quote received, quote approved/rejected/withdrawn, technician on the way, job completed, payment confirmation). Likely built as a separate service consuming events via a message queue (RabbitMQ/Kafka), with push notifications (FCM) plus SMS/email for critical updates. This would also solve the current gap where users aren't notified when a technician withdraws a quote.
- **Mobile App** — converting the React web frontend into a mobile app (e.g. React Native or a wrapped PWA) for both users and technicians, enabling background GPS tracking, push notifications, and a more native on-the-go experience — especially important for technicians who are mobile by nature of the job.
