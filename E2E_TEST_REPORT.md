# M-CHICKS — End-to-End Test Report (Phase 9)

## Test Batch: BATCH-001

| Field | Value |
|-------|-------|
| Batch ID | BATCH-001 |
| Start Date | 13-Aug-2026 |
| Initial Chicks | 4,100 |
| Initial Weight | 35 g |
| Target Days | 36 |
| Feed Allocation | 160 bags (75 kg each = 12,000 kg) |
| Shed | 48 × 28 ft = 1,344 sq.ft |

---

## Authentication Tests

| Test | Expected | Result |
|------|----------|--------|
| Valid login (madhan333 / Mchick333) | 200 + JWT token | ✅ PASS |
| Invalid credentials | 401 Unauthorized | ✅ PASS |
| Empty credentials | 400 Bad Request | ✅ PASS |
| Access `/api/batches` without token | 401 Unauthorized | ✅ PASS |
| Access `/api/batches` with valid token | 200 + batch list | ✅ PASS |
| Health endpoint `/api/health` | 200 + DB status | ✅ PASS |

---

## Calculation Verification (Scenario 1)

| Metric | Formula | Expected | Status |
|--------|---------|----------|--------|
| Live Birds | 4100 - 80 | 4,020 | ✅ PASS |
| Mortality % | (80/4100) × 100 | 1.95% | ✅ PASS |
| Feed Consumed | 150 × 75 kg | 11,250 kg | ✅ PASS |
| Feed Remaining | 160 - 150 bags | 10 bags (750 kg) | ✅ PASS |
| Live Biomass | 4020 × 620g / 1000 | 2,492.4 kg | ✅ PASS |
| Initial Biomass | 4100 × 35g / 1000 | 143.5 kg | ✅ PASS |
| Weight Gain | 2492.4 - 143.5 | 2,348.9 kg | ✅ PASS |
| Farm FCR | 11250 / 2492.4 | 4.51 | ✅ PASS |
| Growth FCR | 11250 / 2348.9 | 4.79 | ✅ PASS |
| Shed Area | 48 × 28 | 1,344 sq.ft | ✅ PASS |

---

## Backend API Tests

| Endpoint | Method | Auth | Result |
|----------|--------|------|--------|
| /api/auth/login | POST | None | ✅ |
| /api/auth/verify | GET | JWT | ✅ |
| /api/health | GET | None | ✅ |
| /api/batches | GET | JWT | ✅ |
| /api/batches | POST | JWT | ✅ |
| /api/batches/:id | GET | JWT | ✅ |
| /api/batches/:id/logs | GET | JWT | ✅ |
| /api/batches/:id/logs | POST | JWT | ✅ |
| /api/batches/:id/weights | GET | JWT | ✅ |
| /api/batches/:id/weights | POST | JWT | ✅ |
| /api/batches/:id/supplements | GET | JWT | ✅ |
| /api/batches/:id/expenses | GET | JWT | ✅ |
| /api/batches/:id/supervisor | GET | JWT | ✅ |
| /api/settings | GET | JWT | ✅ |
| /api/weather | GET | JWT | ✅ |

---

## PHASE 9 STATUS: ✅ PASS
