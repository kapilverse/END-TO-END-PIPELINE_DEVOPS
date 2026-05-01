# UrbanPulse - System Design

## 1. Architecture Overview
UrbanPulse uses a **distributed micro-architecture** designed for high concurrency and low latency.

### Components:
- **Client (Mobile)**: React Native (Expo) for cross-platform availability.
- **API Gateway**: FastAPI (Async) for high-performance I/O.
- **Primary DB**: PostgreSQL for ACID compliance on bookings and transactions.
- **Cache/Concurrency Layer**: Redis for distributed locking and session management.
- **Real-time Layer**: WebSockets for provider tracking and in-app chat.

## 2. Core Workflows

### A. The "Double Booking" Problem
To prevent two users from booking the same provider at the same time:
1. When a user selects a slot, the system attempts to acquire a **Redis NX Lock** (`lock:booking:{provider_id}:{slot}`).
2. If successful, the slot is held for 5 minutes (payment timeout).
3. If payment succeeds, the lock is released and the DB record is marked `confirmed`.
4. If payment fails or timeout occurs, the lock expires automatically, freeing the slot.

### B. Matching Algorithm
Providers are ranked using a weighted multi-factor scoring system:
- **Distance (50%)**: Proximity to user (using Geopy/PostGIS).
- **Rating (30%)**: Historical user feedback.
- **Availability (20%)**: Immediate vs. scheduled availability.

## 3. Scalability
- **Horizontal Scaling**: Backend is stateless and Dockerized, allowing it to scale across multiple K8s pods.
- **Read Replicas**: For searching providers without locking the main transaction DB.
- **Async Tasks**: Using Celery/Redis for background jobs like sending notifications or processing payouts.

## 4. Security
- **JWT Auth**: Role-based access control (RBAC).
- **Escrow Payments**: Funds are authorized but only captured/released upon service completion.
- **Rate Limiting**: Throttling API requests per user/IP to prevent DDoS.
