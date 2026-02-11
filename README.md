# CareerSync-4BE: Automated Cloud Infrastructure

This repository contains the backend orchestration and CI/CD pipeline for the CareerSync platform. The project has been migrated from legacy PM2 process management to a modern, containerized, self-healing architecture on AWS EC2.

## 🚀 Key Features
* **Containerized Orchestration:** Multi-service deployment (Admin, Mentor, API) using Docker Compose.
* **CI/CD Pipeline:** Fully automated deployments via GitHub Actions.
* **High Availability:** Nginx Reverse Proxy for domain routing and SSL termination.
* **Proactive Monitoring:** Implementation of ITIL-compliant health checks and auto-restart policies.

## 🏗️ System Architecture
The infrastructure bypasses edge-proxy (Cloudflare) bottlenecks by utilizing direct Origin IP targeting for administrative SSH traffic, ensuring 100% deployment reliability.



## 🛠️ Technical Implementation Details

### 1. CI/CD Workflow
The deployment is triggered on every push to the `main` branch. 
* **Tooling:** GitHub Actions, `appleboy/ssh-action`.
* **Security:** RSA Key-pair authentication with POSIX 600/700 permission hardening.

### 2. Docker & Orchestration
The services are managed via `docker-compose.yml` with the following configuration:
* **Restart Policy:** `always`
* **Health Check Probes:** 30s intervals with a 3-retry threshold.

### 3. Networking & Security
* **Reverse Proxy:** Nginx routing internal traffic via an isolated Docker bridge network.
* **Access Control:** User-level Docker daemon permissions (non-root execution).

## 📋 Useful Commands for Maintenance

| Task | Command |
| :--- | :--- |
| **Check Service Health** | `docker ps` |
| **View Real-time Logs** | `docker compose logs -f` |
| **Manual Deployment** | `bash deploy.sh` |
| **Identify Origin IP** | `curl http://checkip.amazonaws.com` |

---


