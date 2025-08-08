# 🤖 Mouin Almojtahidin Educational Bot

A production-ready Telegram bot built with Node.js and Telegraf for educational course management, attendance tracking, and assignment handling. Optimized for **Railway deployment** with PostgreSQL support and local SQLite development.

## ✨ Features

- 📚 **Course Management** - Create, update, and manage educational courses
- 👥 **User Authentication** - Secure user verification system  
- 📊 **Attendance Tracking** - Digital attendance for lessons
- 📝 **Assignment System** - Create, submit, and grade assignments
- 🔔 **Smart Reminders** - Automated lesson and deadline notifications
- 👨‍💼 **Admin Dashboard** - Comprehensive admin controls and statistics
- 🌐 **Multi-Environment** - Development (polling) and production (webhook) modes
- 🗄️ **Database Flexibility** - SQLite for development, PostgreSQL for production
- 📈 **Production Ready** - Logging, monitoring, and health checks

## 🏗️ Architecture

```
src/
├── app.js                    # Main application entry point
├── config/
│   └── environment.js        # Environment configuration with validation
├── database/
│   ├── connection.js         # Database abstraction layer
│   ├── adapters/
│   │   ├── sqlite.js         # SQLite adapter (development)
│   │   └── postgres.js       # PostgreSQL adapter (production)
│   └── migrations/
│       └── create-tables.js  # Database schema migrations
├── middlewares/
│   └── index.js              # Rate limiting, auth, error handling
├── commands/
│   └── index.js              # Bot command handlers
├── services/
│   └── scheduler.js          # Reminder and scheduling service
├── utils/
│   └── logger.js             # Winston-based logging system
└── tests/
    └── database.test.js      # Unit tests (Node.js test runner)
```

## 🚀 Quick Start

### 1. Development Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd mouin-almojtahidin-bot

# Install dependencies
npm install

# Setup development environment
npm run setup:dev

# Update .env.local with your bot token
# Get your bot token from @BotFather on Telegram
```

### 2. Configuration

Create `.env.local` for development:

```env
NODE_ENV=development
BOT_TOKEN=your_bot_token_from_botfather
ACTIVATION_CODE=free_palestine1447
ADMIN_USER_IDS=your_telegram_user_id
```

### 3. Run Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test

# Health check
npm run health
```

## 🌐 Railway Deployment

### Prerequisites

1. Create a [Railway](https://railway.app) account
2. Install Railway CLI: `npm install -g @railway/cli`
3. Get your bot token from [@BotFather](https://t.me/botfather)

### Deploy to Railway

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set BOT_TOKEN=your_bot_token_here
   railway variables set WEBHOOK_SECRET=your_secure_random_string
   railway variables set ACTIVATION_CODE=free_palestine1447
   railway variables set ADMIN_USER_IDS=123456789,987654321
   railway variables set NODE_ENV=production
   railway variables set DB_TYPE=postgresql
   ```

4. **Deploy**
   ```bash
   railway deploy
   ```

5. **Set Webhook URL**
   After deployment, get your Railway app URL and update:
   ```bash
   railway variables set WEBHOOK_URL=https://your-app.railway.app
   ```

### Environment Variables for Railway

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BOT_TOKEN` | ✅ | Telegram bot token | `123456:ABC-DEF...` |
| `WEBHOOK_URL` | ✅ | Railway app URL | `https://your-app.railway.app` |
| `WEBHOOK_SECRET` | ✅ | Webhook security token | `your-random-secret` |
| `ACTIVATION_CODE` | ✅ | User activation code | `free_palestine1447` |
| `ADMIN_USER_IDS` | ✅ | Comma-separated admin IDs | `123,456,789` |
| `SUPPORT_CHANNEL` | ⚪ | Support channel | `@YourChannel` |
| `DATABASE_URL` | 🔄 | Auto-set by Railway | PostgreSQL connection |
| `NODE_ENV` | 🔄 | Auto-set to production | `production` |

## 🛠️ Development

### VS Code Setup

The project includes optimized VS Code configuration:

- **Debug Configurations**: Press F5 to start debugging
- **Extensions Support**: ESLint, Prettier ready
- **Task Runner**: Integrated npm scripts
- **File Nesting**: Organized file explorer

### Available Scripts

```bash
npm run dev              # Development with auto-reload
npm start                # Production mode
npm test                 # Run unit tests
npm run test:watch       # Watch mode testing
npm run setup:dev        # Initialize development environment
npm run setup:test-data  # Populate database with test data
npm run health           # Application health check
npm run db:migrate       # Run database migrations
```

### Testing

Built-in Node.js test runner (no external dependencies):

```bash
# Run all tests
npm test

# Run specific test file
node --test src/tests/database.test.js

# Watch mode
npm run test:watch
```

### Adding New Commands

1. Create command handler in `src/commands/`
2. Add to `src/commands/index.js`
3. Add middleware if needed (auth, rate limiting)
4. Write tests in `src/tests/`

Example:
```javascript
// src/commands/my-command.js
export async function handleMyCommand(ctx) {
  await ctx.reply('Hello from my command!');
}

// Add to src/commands/index.js
bot.command('mycommand', handleMyCommand);
```

## 📊 Database Schema

The bot supports both SQLite (development) and PostgreSQL (production):

### Core Tables

- `users` - User accounts and verification status
- `courses` - Educational courses catalog  
- `lessons` - Individual lesson scheduling
- `assignments` - Homework and tasks
- `attendance` - Lesson attendance tracking
- `submissions` - Assignment submissions
- `announcements` - System announcements
- `feedback` - User feedback system

### Migration System

Automatic database migrations ensure schema consistency:

```bash
# Run migrations manually
npm run db:migrate

# Migrations run automatically on startup
```

## 🔐 Security Features

- **Environment Validation** - Joi schema validation for all config
- **Rate Limiting** - Per-user request limits (30/min, 100/hour)
- **Admin Authorization** - Role-based command access
- **Webhook Secrets** - Secure webhook verification
- **Input Sanitization** - SQL injection prevention
- **Error Handling** - No sensitive data in error messages

## 📈 Monitoring & Logging

### Health Check Endpoint

```bash
# Check application health
curl https://your-app.railway.app/health

# Local health check
npm run health
```

### Logging System

- **Structured Logging** - JSON format with Winston
- **Log Rotation** - Automatic file rotation (10MB, 5 files)
- **Environment Aware** - Console (dev) + Files (production)
- **Error Tracking** - Separate error log files

Log files location:
- `logs/app.log` - Application logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions

## 🚦 Commands

### Public Commands
- `/start` - Register and welcome new users
- `/help` - Show available commands
- `/verify <code>` - Activate account with code

### User Commands  
- `/profile` - Show user profile and stats
- `/courses` - List available courses
- `/assignments` - Show assignments and deadlines
- `/attendance <lesson_id>` - Record lesson attendance
- `/reminders` - Manage notification preferences

### Admin Commands
- `/stats` - Bot usage statistics
- `/broadcast <message>` - Send message to all users
- `/addcourse <name> <description>` - Create new course
- `/stats` - View detailed analytics

## 🔧 Troubleshooting

### Common Issues

**Bot not responding:**
```bash
# Check bot token
npm run health

# Verify webhook (production)
curl -X POST https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Database connection failed:**
```bash
# Check database health
npm run health

# Verify environment variables
railway variables
```

**Deployment issues:**
```bash
# Check Railway logs
railway logs

# Verify build
railway status
```

### Debug Mode

Enable detailed logging:
```bash
# Development
LOG_LEVEL=debug npm run dev

# Railway
railway variables set LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Development Guidelines

- Use Node.js 20+ features
- Follow ESM imports (no CommonJS)
- Write tests for new features
- Use structured logging
- Validate environment variables
- Handle errors gracefully

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bugs and feature requests
- **Telegram**: Contact support channel configured in bot
- **Health Monitoring**: `/health` endpoint for status checks

---

**Built with ❤️ for educational institutions**

Compatible with Node.js 20+, optimized for Railway deployment, production-ready with comprehensive logging and monitoring.