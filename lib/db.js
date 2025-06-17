import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

// Configure Prisma Client with connection pool settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add error handling and connection pool configuration
    errorFormat: 'pretty',
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add connection error handling
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error)
})

export default prisma