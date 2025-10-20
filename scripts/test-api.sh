#!/bin/bash
# Comprehensive API endpoint testing script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC2034  # PROJECT_ROOT may be used in future
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:8080}"
COOKIE_FILE="/tmp/photoadmin_test_cookies.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Cleanup function
cleanup() {
    # shellcheck disable=SC2317  # Invoked via trap
    rm -f "$COOKIE_FILE"
}
trap cleanup EXIT

# Helper functions
log_test() {
    echo -e "\n${YELLOW}TEST: $1${NC}"
}

log_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

# Check if server is running
check_server() {
    log_test "Checking if server is running"
    if curl -sf "$BASE_URL/healthz" > /dev/null 2>&1; then
        log_pass "Server is running at $BASE_URL"
    else
        log_fail "Server is not running at $BASE_URL"
        echo "Start the server with: ./scripts/start-backend.sh"
        exit 1
    fi
}

# Test 1: Health check
test_health() {
    log_test "Health check endpoint"
    RESPONSE=$(curl -sf "$BASE_URL/healthz" || echo "")

    if [ -z "$RESPONSE" ]; then
        log_fail "No response from health check"
        return 1
    fi

    if echo "$RESPONSE" | jq -e '.status == "ok"' > /dev/null 2>&1; then
        log_pass "Health check returned OK"
    else
        log_fail "Health check failed: $RESPONSE"
    fi
}

# Test 2: Public API - Get albums
test_get_public_albums() {
    log_test "GET /api/albums (public endpoint)"
    RESPONSE=$(curl -sf "$BASE_URL/api/albums" || echo "")

    if [ -z "$RESPONSE" ]; then
        log_fail "No response from /api/albums"
        return 1
    fi

    if echo "$RESPONSE" | jq -e '.albums' > /dev/null 2>&1; then
        ALBUM_COUNT=$(echo "$RESPONSE" | jq '.albums | length')
        log_pass "Retrieved albums list (count: $ALBUM_COUNT)"
    else
        log_fail "Failed to get albums: $RESPONSE"
    fi
}

# Test 3: Public API - Get site config
test_get_site_config() {
    log_test "GET /api/config (public endpoint)"
    RESPONSE=$(curl -sf "$BASE_URL/api/config" || echo "")

    if [ -z "$RESPONSE" ]; then
        log_fail "No response from /api/config"
        return 1
    fi

    if echo "$RESPONSE" | jq -e '.site.title' > /dev/null 2>&1; then
        SITE_TITLE=$(echo "$RESPONSE" | jq -r '.site.title')
        log_pass "Retrieved site config (title: $SITE_TITLE)"
    else
        log_fail "Failed to get site config: $RESPONSE"
    fi
}

# Test 4: Admin API - Unauthorized access
test_unauthorized_access() {
    log_test "POST /api/admin/albums (should fail without auth)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/admin/albums" \
        -H "Content-Type: application/json" \
        -d '{"title":"Test"}')

    if [ "$HTTP_CODE" = "401" ]; then
        log_pass "Correctly returned 401 Unauthorized"
    else
        log_fail "Expected 401 but got: $HTTP_CODE"
    fi
}

# Test 5: Admin login
test_login() {
    log_test "POST /api/admin/login"

    # Clean cookie file
    rm -f "$COOKIE_FILE"

    BODY_FILE=$(mktemp)
    HTTP_CODE=$(curl -s -o "$BODY_FILE" -w "%{http_code}" \
        -X POST "$BASE_URL/api/admin/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin"}' `# pragma: allowlist secret` \
        -c "$COOKIE_FILE")

    BODY=$(cat "$BODY_FILE")
    rm -f "$BODY_FILE"

    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | jq -e '.message' > /dev/null 2>&1; then
        log_pass "Successfully logged in"
        return 0
    else
        log_fail "Login failed: HTTP $HTTP_CODE - $BODY"
        return 1
    fi
}

# Test 6: Get albums (using public endpoint, which works for authenticated users too)
test_admin_get_albums() {
    log_test "GET /api/albums (verify album creation)"

    BODY=$(curl -s "$BASE_URL/api/albums" -b "$COOKIE_FILE" || echo "")

    if [ -z "$BODY" ]; then
        log_fail "No response from /api/albums"
        return 1
    fi

    if echo "$BODY" | jq -e '.albums' > /dev/null 2>&1; then
        log_pass "Retrieved albums list"
    else
        log_fail "Failed to get albums: $BODY"
    fi
}

# Test 7: Create album
test_create_album() {
    log_test "POST /api/admin/albums (create album)"

    BODY_FILE=$(mktemp)
    HTTP_CODE=$(curl -s -o "$BODY_FILE" -w "%{http_code}" \
        -X POST "$BASE_URL/api/admin/albums" \
        -H "Content-Type: application/json" \
        -b "$COOKIE_FILE" \
        -d '{
            "title": "Test Album",
            "subtitle": "Created by test script",
            "description": "This is a test album",
            "visibility": "public",
            "allow_downloads": true
        }')

    BODY=$(cat "$BODY_FILE")
    rm -f "$BODY_FILE"

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        ALBUM_ID=$(echo "$BODY" | jq -r '.id // .album.id // empty')
        if [ -n "$ALBUM_ID" ]; then
            echo "$ALBUM_ID" > /tmp/test_album_id.txt
            log_pass "Created album with ID: $ALBUM_ID"
            return 0
        fi
    fi

    log_fail "Failed to create album: HTTP $HTTP_CODE - $BODY"
    return 1
}

# Test 8: Get album by ID (using public endpoint)
test_get_album() {
    log_test "GET /api/albums/:id"

    if [ ! -f /tmp/test_album_id.txt ]; then
        log_fail "No album ID found (skipping test)"
        return 1
    fi

    ALBUM_ID=$(cat /tmp/test_album_id.txt)
    BODY=$(curl -s "$BASE_URL/api/albums/$ALBUM_ID" -b "$COOKIE_FILE" || echo "")

    if [ -z "$BODY" ]; then
        log_fail "No response from /api/albums/$ALBUM_ID"
        return 1
    fi

    if echo "$BODY" | jq -e '.id' > /dev/null 2>&1; then
        log_pass "Retrieved album by ID"
    else
        log_fail "Failed to get album: $BODY"
    fi
}

# Test 9: Update album
test_update_album() {
    log_test "PUT /api/admin/albums/:id"

    if [ ! -f /tmp/test_album_id.txt ]; then
        log_fail "No album ID found (skipping test)"
        return 1
    fi

    ALBUM_ID=$(cat /tmp/test_album_id.txt)

    # First get the current album data
    ALBUM_DATA=$(curl -s "$BASE_URL/api/albums/$ALBUM_ID")

    # Update the title and subtitle in the JSON
    UPDATED_DATA=$(echo "$ALBUM_DATA" | jq '.title = "Updated Test Album" | .subtitle = "Modified by test script"')

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X PUT "$BASE_URL/api/admin/albums/$ALBUM_ID" \
        -H "Content-Type: application/json" \
        -b "$COOKIE_FILE" \
        -d "$UPDATED_DATA")

    if [ "$HTTP_CODE" = "200" ]; then
        log_pass "Updated album successfully"
    else
        log_fail "Failed to update album: HTTP $HTTP_CODE"
    fi
}

# Test 10: Delete album
test_delete_album() {
    log_test "DELETE /api/admin/albums/:id"

    if [ ! -f /tmp/test_album_id.txt ]; then
        log_fail "No album ID found (skipping test)"
        return 1
    fi

    ALBUM_ID=$(cat /tmp/test_album_id.txt)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X DELETE "$BASE_URL/api/admin/albums/$ALBUM_ID" \
        -b "$COOKIE_FILE")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
        log_pass "Deleted album successfully"
        rm -f /tmp/test_album_id.txt
    else
        log_fail "Failed to delete album: HTTP $HTTP_CODE"
    fi
}

# Test 11: Logout
test_logout() {
    log_test "POST /api/admin/logout"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/api/admin/logout" \
        -b "$COOKIE_FILE")

    if [ "$HTTP_CODE" = "200" ]; then
        log_pass "Logged out successfully"
    else
        log_fail "Failed to logout: HTTP $HTTP_CODE"
    fi
}

# Test 12: Verify session is invalidated
test_session_invalidated() {
    log_test "POST /api/admin/albums (should fail after logout)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/admin/albums" \
        -H "Content-Type: application/json" \
        -d '{"title":"Test"}' \
        -b "$COOKIE_FILE")

    if [ "$HTTP_CODE" = "401" ]; then
        log_pass "Session correctly invalidated after logout"
    else
        log_fail "Expected 401 but got: $HTTP_CODE"
    fi
}

# Main test execution
main() {
    echo "========================================="
    echo "  Photography Portfolio API Test Suite  "
    echo "========================================="
    echo "Base URL: $BASE_URL"
    echo ""

    check_server

    # Public API tests
    test_health
    test_get_public_albums
    test_get_site_config

    # Authentication tests
    test_unauthorized_access
    if test_login; then
        # Authenticated API tests
        test_admin_get_albums

        # CRUD operations
        if test_create_album; then
            test_get_album
            test_update_album
            test_delete_album
        fi

        # Logout tests
        test_logout
        test_session_invalidated
    fi

    # Summary
    echo ""
    echo "========================================="
    echo "  Test Summary"
    echo "========================================="
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo "Total:  $((TESTS_PASSED + TESTS_FAILED))"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Run tests
main "$@"
