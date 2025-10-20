#!/bin/bash
# Test script to verify schema validation between frontend, backend, and JSON

set -e

echo "=== Testing Schema Validation ==="
echo ""

# Test 1: Valid album with all fields
echo "Test 1: Creating album with valid visibility 'public'"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/admin/albums \
  -H "Content-Type: application/json" \
  -b "photoadmin_session=test" \
  -d '{
    "title": "Test Album",
    "visibility": "public",
    "allow_downloads": true,
    "is_portfolio_album": false,
    "order": 0
  }')
echo "Response: $response (expected: 401 for unauthorized or 201 for success)"
echo ""

# Test 2: Invalid visibility
echo "Test 2: Creating album with invalid visibility 'invalid'"
response=$(curl -s -X POST http://localhost:8080/api/admin/albums \
  -H "Content-Type: application/json" \
  -b "photoadmin_session=test" \
  -d '{
    "title": "Test Album",
    "visibility": "invalid",
    "allow_downloads": true,
    "is_portfolio_album": false,
    "order": 0
  }')
echo "Response: $response"
echo ""

# Test 3: Empty visibility
echo "Test 3: Creating album with empty visibility"
response=$(curl -s -X POST http://localhost:8080/api/admin/albums \
  -H "Content-Type: application/json" \
  -b "photoadmin_session=test" \
  -d '{
    "title": "Test Album",
    "visibility": "",
    "allow_downloads": true,
    "is_portfolio_album": false,
    "order": 0
  }')
echo "Response: $response"
echo ""

# Test 4: Missing visibility (should get empty string from JSON unmarshal)
echo "Test 4: Creating album with missing visibility field"
response=$(curl -s -X POST http://localhost:8080/api/admin/albums \
  -H "Content-Type: application/json" \
  -b "photoadmin_session=test" \
  -d '{
    "title": "Test Album",
    "allow_downloads": true,
    "is_portfolio_album": false,
    "order": 0
  }')
echo "Response: $response"
echo ""

echo "=== Tests Complete ==="
