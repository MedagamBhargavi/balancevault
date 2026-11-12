# BalanceVault – Secure Banking Platform

BalanceVault is a secure banking web application developed using React, Node.js, Express.js and PostgreSQL.

## Features

- User registration and login
- Secure authentication using JWT
- Automatic bank account creation
- Account balance overview
- Deposit and withdrawal operations
- Money transfers between users
- Transaction history
- Audit logs and activity tracking
- Role-based access control
- Admin dashboard

## Technology Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS
- React Router
- Lucide React

**Backend**
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Project Structure

```text
balancevault/
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── prisma/
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    ├── package.json
    └── vite.config.js
```

## Run Frontend Locally

```bash
npm install
npm run dev
```

## Run Backend Locally

```bash
npm install
node server.js
```

## Production Build

```bash
npm run build
```

## Security

- JWT-based authentication
- Protected API routes
- Role-based authorization
- Input validation
- Transactional money operations
- Audit logging

## Disclaimer

BalanceVault is a hackathon demonstration project. It is not a real banking application and does not process actual financial transactions.