# Readme

**Setup the ENV:**

```bash

PORT=3000
DB_URI=postgresql://postgres:admin@localhost:5433/kudiswap
JWT_SECRET=your_jwt_secret
NODE_ENV=development

```

**Setup the database:**

```bash
# Create and apply migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database with demo data
npm run prisma:seed
```