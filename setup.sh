#!/bin/bash

# E-Library Setup Script
echo "🚀 Setting up E-Library Full-Stack Application..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files if they don't exist
echo "📝 Creating environment files..."

if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "ℹ️  backend/.env already exists"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/env.example frontend/.env.local
    echo "✅ Created frontend/.env.local from template"
else
    echo "ℹ️  frontend/.env.local already exists"
fi

# Build and start services
echo "🐳 Building and starting Docker containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB is not responding"
fi

# Check Backend
if curl -f http://localhost:8000/api/ &> /dev/null; then
    echo "✅ Backend API is running"
else
    echo "❌ Backend API is not responding"
fi

# Check Frontend
if curl -f http://localhost &> /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
fi

# Seed the database
echo "🌱 Seeding the database with sample data..."
docker-compose exec backend python seed.py

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Access your E-Library:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:8000/api"
echo "   API Documentation: http://localhost:8000/api/docs"
echo ""
echo "👤 Default admin account:"
echo "   Email: admin@elibrary.com"
echo "   Password: password123"
echo ""
echo "👥 Sample user accounts:"
echo "   Email: john.doe@example.com"
echo "   Password: password123"
echo ""
echo "   Email: jane.smith@example.com"
echo "   Password: password123"
echo ""
echo "🛠️  Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Rebuild: docker-compose up -d --build"
echo ""
echo "📖 For more information, see README.md"
