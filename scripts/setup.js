const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')


// Check if .env exists, if not create from example
const envPath = path.join(process.cwd(), '.env')
const envExamplePath = path.join(process.cwd(), 'env.example')

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath)
}

// Install dependencies
try {
  execSync('pnpm install', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message)
  process.exit(1)
}

// Generate Prisma client
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message)
  process.exit(1)
}

// Push database schema
try {
  execSync('npx prisma db push', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Failed to setup database:', error.message)
  process.exit(1)
}

