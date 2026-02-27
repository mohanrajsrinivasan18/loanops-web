#!/bin/bash

echo "Testing Customer Creation API..."
echo ""

curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Customer",
    "phone": "9999999999",
    "email": "apitest@example.com",
    "address": "Test Address 123",
    "area": "Test Area"
  }' | jq '.'

echo ""
echo "Done!"
