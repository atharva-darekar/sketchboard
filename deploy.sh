#!/bin/bash

# Exit immediately if any command fails
set -e

echo "🚀 Starting SketchBoard Deployment Script..."

# 1. Check if Docker is installed. If not, install it.
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker not found. Installing Docker..."
    sudo apt update
    sudo apt install ca-certificates curl -y
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 2. Check if the backend .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file is missing!"
    echo "Please create it using 'nano backend/.env' before running this script."
    exit 1
fi

# 3. Pull latest changes from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 4. Build and start the containers
echo "🏗️ Building and starting Docker containers..."
sudo docker compose up -d --build

# 5. Clean up old, unused Docker images to save space
echo "🧹 Cleaning up old unused images..."
sudo docker image prune -f

echo "🎉 Deployment complete! Your app is running securely via Caddy."
