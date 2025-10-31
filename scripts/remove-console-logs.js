const fs = require('fs')
const path = require('path')

const files = [
  'app/api/analytics/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/me/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/chat/public/route.ts',
  'app/api/chat/route.ts',
  'app/api/chats/[id]/route.ts',
  'app/api/chats/route.ts',
  'app/api/coaches/[id]/route.ts',
  'app/api/coaches/[id]/share/route.ts',
  'app/api/coaches/[id]/training/route.ts',
  'app/api/coaches/public/[shareableId]/route.ts',
  'app/api/leads/[id]/route.ts',
  'app/api/leads/route.ts',
  'app/api/test-transcript/route.ts',
  'app/api/test-training/route.ts',
  'app/api/test-tactiq/route.ts',
  'app/api/test-enhanced-youtube/route.ts',
  'app/(app)/dashboard/chat/[id]/page.tsx',
  'app/(app)/dashboard/coaches/[id]/page.tsx',
  'app/(app)/dashboard/leads/page.tsx',
  'app/login/page.tsx',
]

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8')
    // Remove console.log, console.error, console.warn lines
    content = content.replace(/\s*console\.(log|error|warn)\([^)]*\);\s*/g, '\n')
    // Remove multi-line console statements
    content = content.replace(/\s*console\.(log|error|warn)\([^)]*\);\s*/g, '\n')
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Cleaned ${file}`)
  }
})

console.log('Done removing console statements')

