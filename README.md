# Oracle AI Coach Platform

Transform any YouTube channel into an interactive AI assistant trained on the creator's voice, knowledge, and style. This platform automatically extracts video transcripts, processes content, and creates personalized AI coaches that can answer questions and provide guidance in the creator's unique voice.

## 🚀 Features

- **YouTube Channel Integration**: Simply paste a YouTube channel URL to start training
- **Automatic Transcript Extraction**: Uses YouTube's transcript API to extract video content
- **AI Training Pipeline**: Processes transcripts with OpenAI to create personalized system prompts
- **Real-time Chat Interface**: Interactive chat with your trained AI coach
- **Training Progress Tracking**: Monitor training status and progress in real-time
- **Video Management**: View all processed videos and their transcripts
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4 for content processing and chat
- **Web Scraping**: Apify for YouTube data extraction
- **State Management**: SWR for data fetching

## 📋 Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ and pnpm installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Apify API token ([Get one here](https://console.apify.com/account/integrations))

## 🚀 Quick Start

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd oracle-ai
   pnpm setup
   ```

2. **Set up PostgreSQL database**:
   - Install PostgreSQL locally or use a cloud service (Railway, Supabase, etc.)
   - Create a database for the project
   
3. **Configure environment variables**:
   Edit the `.env` file and add your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/oracle_ai_db"
   OPENAI_API_KEY=your_openai_api_key_here
   APIFY_API_TOKEN=your_apify_api_token_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How It Works

### 1. Create a Coach
- Go to the Coaches page and click "New Coach"
- Enter a name and paste a YouTube channel URL
- Optionally add tone/style instructions

### 2. Training Process
The system automatically:
- Fetches channel information and recent videos
- Extracts transcripts from each video
- Generates summaries using OpenAI
- Creates a comprehensive system prompt
- Trains the AI to respond in the creator's voice

### 3. Chat with Your Coach
- Once training is complete, start chatting
- The AI responds using the creator's knowledge and style
- All conversations are saved for future reference

## 🗂️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── (app)/             # Protected app routes
│   │   ├── coaches/       # Coach management
│   │   ├── chat/          # Chat interface
│   │   └── dashboard/     # Analytics dashboard
│   └── api/               # API routes
│       ├── coaches/       # Coach CRUD operations
│       └── chat/          # Chat functionality
├── components/            # Reusable UI components
│   ├── oracle/           # Custom Oracle components
│   └── ui/               # Base UI components
├── lib/                  # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── youtube.ts        # YouTube integration
│   └── openai.ts         # OpenAI integration
├── prisma/               # Database schema
└── scripts/              # Setup and utility scripts
```

## 🔧 API Endpoints

### Coaches
- `GET /api/coaches` - List all coaches
- `POST /api/coaches` - Create a new coach
- `GET /api/coaches/[id]` - Get coach details
- `DELETE /api/coaches/[id]` - Delete a coach
- `GET /api/coaches/[id]/training` - Get training status

### Chat
- `POST /api/chat` - Send a message to a coach
- `GET /api/chats` - List all chats
- `GET /api/chats/[id]` - Get chat history

## 🎯 Usage Examples

### Creating a Tech Coach
```javascript
// Example: Create a coach from a programming channel
const coach = await fetch('/api/coaches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Web Dev Mentor',
    channelUrl: 'https://youtube.com/@webdevmentor',
    tone: 'Encouraging, technical but accessible, uses practical examples'
  })
})
```

### Chatting with a Coach
```javascript
// Example: Chat with your trained coach
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How do I implement authentication in Next.js?',
    coachId: 'coach-id-here'
  })
})
```

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI processing | Yes |
| `APIFY_API_TOKEN` | Apify token for YouTube scraping | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for authentication | No |
| `NEXTAUTH_URL` | Base URL for the application | No |

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- AI powered by [OpenAI](https://openai.com/)
- Data extraction with [Apify](https://apify.com/)

---

**Happy Coaching! 🎯**