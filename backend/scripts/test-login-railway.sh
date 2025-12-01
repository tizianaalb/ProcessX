#!/bin/bash

echo "🧪 Testing login on Railway..."
echo ""

# Login
echo "📧 Logging in as tiziana@ballester.de..."
LOGIN_RESPONSE=$(curl -s -X POST https://processx-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tiziana@ballester.de","password":"TestPassword123!"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Got token"
echo ""

# Get current user info
echo "👤 Getting current user info..."
USER_RESPONSE=$(curl -s -X GET https://processx-production.up.railway.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo "$USER_RESPONSE" | jq '.'
echo ""

# Get users list
echo "📋 Getting users list..."
USERS_RESPONSE=$(curl -s -X GET https://processx-production.up.railway.app/api/admin/users \
  -H "Authorization: Bearer $TOKEN")

echo "$USERS_RESPONSE" | jq '.'
