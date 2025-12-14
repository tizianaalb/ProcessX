#!/bin/bash

echo "🌱 Seeding templates on Railway..."
echo ""

# Login
echo "📧 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST https://processxbackend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tiziana@ballester.de","password":"TestPassword123!"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Got token"
echo ""

# Call seed-templates endpoint
echo "🌱 Calling seed-templates endpoint..."
SEED_RESPONSE=$(curl -s -X POST https://processxbackend-production.up.railway.app/api/admin/seed-templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Seed Response:"
echo "$SEED_RESPONSE" | jq '.' 2>/dev/null || echo "$SEED_RESPONSE"
echo ""
