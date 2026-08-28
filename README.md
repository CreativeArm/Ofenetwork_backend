# OFENETWORKS Platform

OFENETWORKS is a multi-service transaction processing platform for manual financial operations such as Deriv funding, PayPal, Skrill, Venmo, crypto services, and Buy4Me orders.

This repository is scaffolded as a monorepo with:

- `frontend/`: Next.js 15 + TypeScript application
- `backend/`: NestJS-style TypeScript API structure

## Implemented Scope

- Authentication domain scaffolding
- Wallet model with expiring credits
- Deposit and withdrawal workflows
- Buy4Me request workflow
- Admin dashboard/service layer
- Notification model
- Multi-currency transaction records
- PostgreSQL-ready Prisma schema

## Project Structure

```text
OFENETWORK_APP/
├── backend/
│   ├── prisma/
│   └── src/
├── frontend/
│   └── src/
└── README.md
```

## Quick Start

Install dependencies separately inside `frontend` and `backend`, then run each app.

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run start:dev
```

## Core Modules

- Auth
- Users
- Wallets
- Transactions
- Buy4Me
- Notifications
- Admin Metrics
- Audit Logs

## Notes

This initial implementation focuses on clean architecture, core workflow coverage, and extensibility. External integrations like Google/Facebook OAuth, Redis queues, Socket.IO gateways, and production persistence can be added on top of the current structure.
