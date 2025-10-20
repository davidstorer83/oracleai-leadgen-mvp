const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Oracle AI Coach Platform...')

// Check if .env exists, if not create from example
const envPath = path.join(process.cwd(), '.env')
const envExamplePath = path.join(process.cwd(), 'env.example')

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env file from example...')
  fs.copyFileSync(envExamplePath, envPath)
  console.log('✅ .env file created. Please update with your API keys and database URL.')
}

// Install dependencies
console.log('📦 Installing dependencies...')
try {
  execSync('pnpm install', { stdio: 'inherit' })
  console.log('✅ Dependencies installed')
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message)
  process.exit(1)
}

// Generate Prisma client
console.log('🗄️ Generating Prisma client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated')
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message)
  process.exit(1)
}

// Push database schema
console.log('🗄️ Setting up database...')
try {
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('✅ Database schema created')
} catch (error) {
  console.error('❌ Failed to setup database:', error.message)
  process.exit(1)
}

console.log('🎉 Setup complete!')
console.log('')
console.log('Next steps:')
console.log('1. Set up a PostgreSQL database (local or cloud)')
console.log('2. Update your .env file with:')
console.log('   - DATABASE_URL: PostgreSQL connection string')
console.log('   - OPENAI_API_KEY: Get from https://platform.openai.com/api-keys')
console.log('   - APIFY_API_TOKEN: Get from https://console.apify.com/account/integrations')
console.log('3. Run the development server:')
console.log('   npm run dev')
console.log('4. Open http://localhost:3000 in your browser')
console.log('')
console.log('Happy coaching! 🎯')
