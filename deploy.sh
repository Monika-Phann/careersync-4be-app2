#!/bin/bash

# 1. Cleanup old Docker junk to prevent "No space left on device"
echo "Cleaning up old images..."
sudo docker system prune -f

# 2. Deploy Admin Frontend (Port 8082)
echo "Building Admin..."
cd ~/careersync-4be-app2/server-careersync/
sudo docker build -t careersync-admin:latest \
  --build-arg VITE_API_URL=https://api-4be.ptascloud.online/api .
sudo docker stop careersync-admin-frontend || true
sudo docker rm careersync-admin-frontend || true
sudo docker run -d --name careersync-admin-frontend -p 8082:80 --restart always careersync-admin:latest

# 3. Deploy Mentor Frontend (Port 8081)
echo "Building Mentor..."
cd ~/careersync-4be-app2/mentor-careersync/client/
sudo docker build -t careersync-mentor:latest .
sudo docker stop careersync-mentor-frontend || true
sudo docker rm careersync-mentor-frontend || true
sudo docker run -d --name careersync-mentor-frontend -p 8081:80 --restart always careersync-mentor:latest

echo "✅ All systems are updated and running!"
sudo docker ps
