#!/bin/bash

# LoanOps Web Deployment Script
# This script helps you deploy to Vercel

set -e

echo "🚀 LoanOps Web Deployment Script"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "📝 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo ""
echo "✅ Vercel CLI ready!"
echo ""

# Ask for deployment type
echo "Select deployment type:"
echo "1) Preview deployment (test)"
echo "2) Production deployment (live)"
read -p "Enter choice (1 or 2): " choice

echo ""

case $choice in
    1)
        echo "🔨 Deploying to preview..."
        vercel
        ;;
    2)
        echo "🚀 Deploying to production..."
        echo ""
        echo "⚠️  IMPORTANT: Make sure you have:"
        echo "   - Set up Supabase database"
        echo "   - Configured environment variables in Vercel"
        echo "   - Run database migrations"
        echo ""
        read -p "Continue with production deployment? (y/n): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            vercel --prod
        else
            echo "❌ Deployment cancelled"
            exit 0
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Check deployment status: vercel ls"
echo "   2. View logs: vercel logs"
echo "   3. Open dashboard: vercel open"
echo ""
