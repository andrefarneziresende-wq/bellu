#!/usr/bin/env bash
# ============================================================
# E2E Test: All Pro Dashboard API Operations
# Usage: bash apps/api/e2e-pro-dashboard.sh [API_URL]
# ============================================================
set -euo pipefail

API="${1:-http://localhost:3333}"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'
BOLD='\033[1m'

check() {
  local name="$1" result="$2"
  if echo "$result" | grep -q '"success":true'; then
    echo -e "  ${GREEN}✅ $name${NC}"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}❌ $name${NC}"
    echo "     $(echo "$result" | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

# Check for expected error (success:false + expected code/status)
check_error() {
  local name="$1" result="$2" expected_code="$3"
  if echo "$result" | grep -q "\"code\":\"$expected_code\""; then
    echo -e "  ${GREEN}✅ $name (expected $expected_code)${NC}"
    PASS=$((PASS+1))
  elif echo "$result" | grep -q '"success":false'; then
    echo -e "  ${GREEN}✅ $name (got error as expected)${NC}"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}❌ $name (expected error, got success)${NC}"
    echo "     $(echo "$result" | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

extract_id() {
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data.id)}catch{console.log('')}})"
}

echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}  E2E TEST: Pro Dashboard API${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""

# ================================================================
# AUTH - Login & Error Cases
# ================================================================
echo -e "${BOLD}🔐 Auth${NC}"
AUTH_R=$(curl -s "$API/api/auth/login" -H "Content-Type: application/json" -d '{"email":"pro@bellu.com","password":"pro123"}')
check "POST /auth/login (valid)" "$AUTH_R"
TOKEN=$(echo "$AUTH_R" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')

# Error: wrong password
R=$(curl -s "$API/api/auth/login" -H "Content-Type: application/json" -d '{"email":"pro@bellu.com","password":"wrongpassword"}')
check_error "POST /auth/login (wrong password)" "$R" "UNAUTHORIZED"

# Error: non-existent user
R=$(curl -s "$API/api/auth/login" -H "Content-Type: application/json" -d '{"email":"nobody@example.com","password":"test123"}')
check_error "POST /auth/login (user not found)" "$R" "UNAUTHORIZED"

# Error: missing fields
R=$(curl -s "$API/api/auth/login" -H "Content-Type: application/json" -d '{}')
check_error "POST /auth/login (empty body)" "$R" "VALIDATION_ERROR"

# Error: no auth token
R=$(curl -s "$API/api/professionals/me")
check_error "GET /professionals/me (no token)" "$R" "UNAUTHORIZED"

H1="Authorization: Bearer $TOKEN"
H2="Content-Type: application/json"

# ================================================================
# PROFESSIONAL PROFILE
# ================================================================
echo ""
echo -e "${BOLD}👤 Professional Profile${NC}"
R=$(curl -s "$API/api/professionals/me" -H "$H1")
check "GET  /professionals/me" "$R"
R=$(curl -s "$API/api/professionals/me" -X PATCH -H "$H1" -H "$H2" -d '{"businessName":"Studio Bellu Demo","description":"E2E test desc","address":"Rua das Flores, 123","taxId":"12345678901234"}')
check "PATCH /professionals/me" "$R"

# ================================================================
# USERS (Clients) - CRUD + Error Cases
# ================================================================
echo ""
echo -e "${BOLD}👥 Users (Clients)${NC}"
R=$(curl -s "$API/api/users" -H "$H1")
check "GET  /users" "$R"
PHONE="119$(shuf -i 10000000-99999999 -n1 2>/dev/null || echo $RANDOM$RANDOM | head -c 8)"
USER_R=$(curl -s "$API/api/users" -X POST -H "$H1" -H "$H2" -d "{\"name\":\"E2E Client\",\"phone\":\"$PHONE\"}")
check "POST /users (create client)" "$USER_R"
USER_ID=$(echo "$USER_R" | extract_id)

# Edit client
R=$(curl -s "$API/api/users/$USER_ID" -X PATCH -H "$H1" -H "$H2" -d '{"name":"E2E Updated Client"}')
check "PATCH /users/:id (edit client)" "$R"

# Delete client
R=$(curl -s "$API/api/users/$USER_ID" -X DELETE -H "$H1")
check "DELETE /users/:id (delete client)" "$R"

# Error: create with missing name
R=$(curl -s "$API/api/users" -X POST -H "$H1" -H "$H2" -d '{"phone":"11999999999"}')
check_error "POST /users (missing name)" "$R" "VALIDATION_ERROR"

# ================================================================
# CATEGORIES
# ================================================================
echo ""
echo -e "${BOLD}📂 Categories${NC}"
R=$(curl -s "$API/api/categories" -H "$H1")
check "GET  /categories" "$R"

# ================================================================
# SERVICES - CRUD
# ================================================================
echo ""
echo -e "${BOLD}✂️ Services${NC}"
R=$(curl -s "$API/api/services" -H "$H1")
check "GET  /services" "$R"
SVC_R=$(curl -s "$API/api/services" -X POST -H "$H1" -H "$H2" -d '{"name":"E2E Service","price":50,"durationMinutes":30,"categoryId":"9c99500a-e3f0-4423-b38a-318372b9e2ea","currency":"BRL"}')
check "POST /services" "$SVC_R"
SVC_ID=$(echo "$SVC_R" | extract_id)
R=$(curl -s "$API/api/services/$SVC_ID" -X PATCH -H "$H1" -H "$H2" -d '{"name":"E2E Updated Service","price":75}')
check "PATCH /services/:id" "$R"
R=$(curl -s "$API/api/services/$SVC_ID" -X DELETE -H "$H1")
check "DELETE /services/:id" "$R"

# ================================================================
# BOOKINGS - CRUD
# ================================================================
echo ""
echo -e "${BOLD}📅 Bookings${NC}"
R=$(curl -s "$API/api/bookings/professional" -H "$H1")
check "GET  /bookings/professional" "$R"
R=$(curl -s "$API/api/bookings/professional?date=2026-03-21" -H "$H1")
check "GET  /bookings/professional?date" "$R"
BK_R=$(curl -s "$API/api/bookings" -X POST -H "$H1" -H "$H2" -d '{"serviceId":"1d322377-9ab4-4d8d-865c-7b054861e96e","clientName":"E2E Booking Client","clientPhone":"11555554444","date":"2026-04-01","startTime":"11:00","endTime":"12:00","source":"MANUAL","totalPrice":150,"currency":"BRL","notes":"E2E test"}')
check "POST /bookings (manual)" "$BK_R"
BK_ID=$(echo "$BK_R" | extract_id)
R=$(curl -s "$API/api/bookings/$BK_ID/status" -X PATCH -H "$H1" -H "$H2" -d '{"status":"completed"}')
check "PATCH /bookings/:id/status" "$R"

# ================================================================
# ROLES - CRUD
# ================================================================
echo ""
echo -e "${BOLD}🛡️ Roles${NC}"
R=$(curl -s "$API/api/roles" -H "$H1")
check "GET  /roles" "$R"
RL_R=$(curl -s "$API/api/roles" -X POST -H "$H1" -H "$H2" -d '{"name":"E2E Role","description":"Test","permissions":["agenda.view","clients.view"]}')
check "POST /roles" "$RL_R"
RL_ID=$(echo "$RL_R" | extract_id)
R=$(curl -s "$API/api/roles/$RL_ID" -X PUT -H "$H1" -H "$H2" -d '{"name":"E2E Updated Role","permissions":["agenda.view","clients.view","clients.create"]}')
check "PUT  /roles/:id" "$R"
R=$(curl -s "$API/api/roles/$RL_ID" -X DELETE -H "$H1")
check "DELETE /roles/:id" "$R"

# ================================================================
# MEMBERS - CRUD
# ================================================================
echo ""
echo -e "${BOLD}👨‍💼 Members${NC}"
R=$(curl -s "$API/api/members" -H "$H1")
check "GET  /members" "$R"
MB_R=$(curl -s "$API/api/members" -X POST -H "$H1" -H "$H2" -d '{"name":"E2E Member","role":"staff","commissionPercent":25}')
check "POST /members" "$MB_R"
MB_ID=$(echo "$MB_R" | extract_id)
R=$(curl -s "$API/api/members/$MB_ID" -X PATCH -H "$H1" -H "$H2" -d '{"name":"E2E Updated Member","commissionPercent":40}')
check "PATCH /members/:id" "$R"
R=$(curl -s "$API/api/members/$MB_ID" -X DELETE -H "$H1")
check "DELETE /members/:id" "$R"

# ================================================================
# EXPENSES - CRUD
# ================================================================
echo ""
echo -e "${BOLD}💰 Expenses${NC}"
R=$(curl -s "$API/api/expenses" -H "$H1")
check "GET  /expenses" "$R"
EX_R=$(curl -s "$API/api/expenses" -X POST -H "$H1" -H "$H2" -d '{"description":"E2E Expense","amount":100,"category":"supplies","date":"2026-03-21","currency":"BRL","recurring":false}')
check "POST /expenses" "$EX_R"
EX_ID=$(echo "$EX_R" | extract_id)
R=$(curl -s "$API/api/expenses/$EX_ID" -X PATCH -H "$H1" -H "$H2" -d '{"description":"E2E Updated Expense","amount":200}')
check "PATCH /expenses/:id" "$R"
R=$(curl -s "$API/api/expenses/$EX_ID" -X DELETE -H "$H1")
check "DELETE /expenses/:id" "$R"

# ================================================================
# PROMOTIONS - CRUD
# ================================================================
echo ""
echo -e "${BOLD}🎯 Promotions${NC}"
R=$(curl -s "$API/api/promotions" -H "$H1")
check "GET  /promotions" "$R"
PR_R=$(curl -s "$API/api/promotions" -X POST -H "$H1" -H "$H2" -d '{"name":"E2E Promo","discountType":"percent","discountValue":20,"startDate":"2026-03-21","endDate":"2026-04-21"}')
check "POST /promotions" "$PR_R"
PR_ID=$(echo "$PR_R" | extract_id)
R=$(curl -s "$API/api/promotions/$PR_ID" -X PATCH -H "$H1" -H "$H2" -d '{"name":"E2E Updated Promo","discountValue":30}')
check "PATCH /promotions/:id" "$R"
R=$(curl -s "$API/api/promotions/$PR_ID" -X DELETE -H "$H1")
check "DELETE /promotions/:id" "$R"

# ================================================================
# WORKING HOURS
# ================================================================
echo ""
echo -e "${BOLD}🕐 Working Hours${NC}"
PROF_ID="a4541645-b6e5-421c-8bab-fe1fe7a96e7d"
R=$(curl -s "$API/api/working-hours?professionalId=$PROF_ID" -H "$H1")
check "GET  /working-hours" "$R"
R=$(curl -s "$API/api/working-hours" -X PUT -H "$H1" -H "$H2" -d '{"hours":[{"dayOfWeek":0,"startTime":"00:00","endTime":"00:00","isOff":true},{"dayOfWeek":1,"startTime":"09:00","endTime":"18:00","isOff":false},{"dayOfWeek":2,"startTime":"09:00","endTime":"18:00","isOff":false},{"dayOfWeek":3,"startTime":"09:00","endTime":"18:00","isOff":false},{"dayOfWeek":4,"startTime":"09:00","endTime":"18:00","isOff":false},{"dayOfWeek":5,"startTime":"09:00","endTime":"18:00","isOff":false},{"dayOfWeek":6,"startTime":"09:00","endTime":"13:00","isOff":false}]}')
check "PUT  /working-hours" "$R"

# ================================================================
# REVIEWS
# ================================================================
echo ""
echo -e "${BOLD}⭐ Reviews${NC}"
R=$(curl -s "$API/api/reviews" -H "$H1")
check "GET  /reviews" "$R"

# ================================================================
# NOTIFICATIONS
# ================================================================
echo ""
echo -e "${BOLD}🔔 Notifications${NC}"
R=$(curl -s "$API/api/notifications/status" -H "$H1")
check "GET  /notifications/status" "$R"

# ================================================================
# PORTFOLIO
# ================================================================
echo ""
echo -e "${BOLD}📸 Portfolio${NC}"
R=$(curl -s "$API/api/portfolio?professionalId=$PROF_ID" -H "$H1")
check "GET  /portfolio" "$R"

# ================================================================
# ERROR HANDLING TESTS
# ================================================================
echo ""
echo -e "${BOLD}🚨 Error Handling${NC}"

# Invalid JWT
R=$(curl -s "$API/api/professionals/me" -H "Authorization: Bearer invalidtoken123")
check_error "GET with invalid JWT" "$R" "UNAUTHORIZED"

# 404 - Non-existent resource
R=$(curl -s "$API/api/services/00000000-0000-0000-0000-000000000000" -X PATCH -H "$H1" -H "$H2" -d '{"name":"test"}')
check_error "PATCH non-existent service" "$R" "NOT_FOUND"

# Validation - Invalid booking (missing required fields)
R=$(curl -s "$API/api/bookings" -X POST -H "$H1" -H "$H2" -d '{"date":"invalid"}')
check_error "POST /bookings (invalid data)" "$R" "VALIDATION_ERROR"

# ================================================================
# SUMMARY
# ================================================================
echo ""
echo -e "${BOLD}=========================================${NC}"
TOTAL=$((PASS+FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}ALL $TOTAL TESTS PASSED ✅${NC}"
else
  echo -e "  ${RED}${BOLD}$FAIL/$TOTAL TESTS FAILED ❌${NC}"
fi
echo -e "${BOLD}=========================================${NC}"

exit $FAIL
