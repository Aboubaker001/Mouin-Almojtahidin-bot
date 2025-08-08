# 🚀 Railway Deployment Guide

Complete guide for deploying the Mouin Almojtahidin Educational Bot to Railway with PostgreSQL.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Telegram Bot**: Get token from [@BotFather](https://t.me/botfather)
3. **Admin User ID**: Get your Telegram user ID from [@userinfobot](https://t.me/userinfobot)
4. **Railway CLI**: `npm install -g @railway/cli`

## 🛠️ Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Ensure you're in the project directory
cd mouin-almojtahidin-bot

# Verify project structure
npm run health
```

### 2. Initialize Railway Project

```bash
# Login to Railway
railway login

# Initialize new project
railway init

# Link to existing project (if you have one)
# railway link [project-id]
```

### 3. Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql

# Verify database was added
railway variables
```

You should see `DATABASE_URL` automatically configured.

### 4. Configure Environment Variables

```bash
# Required: Bot token from @BotFather
railway variables set BOT_TOKEN=1234567890:ABCDEF...

# Required: Webhook secret (generate random string)
railway variables set WEBHOOK_SECRET=$(openssl rand -hex 32)

# Required: User activation code
railway variables set ACTIVATION_CODE=free_palestine1447

# Required: Admin user IDs (your Telegram user ID)
railway variables set ADMIN_USER_IDS=123456789

# Optional: Support channel
railway variables set SUPPORT_CHANNEL=@YourSupportChannel

# Set production environment
railway variables set NODE_ENV=production
railway variables set DB_TYPE=postgresql
```

### 5. Deploy the Application

```bash
# Deploy to Railway
railway up

# Or connect to GitHub and auto-deploy
railway connect
```

### 6. Configure Webhook

After deployment, get your Railway app URL:

```bash
# Get the app URL
railway status

# Set webhook URL (replace with your actual URL)
railway variables set WEBHOOK_URL=https://your-app.railway.app
```

### 7. Verify Deployment

```bash
# Check application logs
railway logs

# Test health endpoint
curl https://your-app.railway.app/health

# Test webhook
curl -X POST https://your-app.railway.app/webhook
```

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BOT_TOKEN` | ✅ | Telegram bot token | `123456:ABC-DEF...` |
| `WEBHOOK_URL` | ✅ | Railway app URL | `https://app.railway.app` |
| `WEBHOOK_SECRET` | ✅ | Webhook security token | `random-secret-string` |
| `ACTIVATION_CODE` | ✅ | User activation code | `free_palestine1447` |
| `ADMIN_USER_IDS` | ✅ | Admin Telegram IDs | `123,456,789` |
| `SUPPORT_CHANNEL` | ⚪ | Support channel | `@SupportChannel` |
| `NODE_ENV` | 🔄 | Environment | `production` |
| `DB_TYPE` | 🔄 | Database type | `postgresql` |
| `DATABASE_URL` | 🔄 | Auto-set by Railway | PostgreSQL URL |
| `PORT` | 🔄 | Auto-set by Railway | `3000` |

✅ = Required, ⚪ = Optional, 🔄 = Auto-configured

## 🔍 Troubleshooting

### Common Issues

#### Bot Not Responding
```bash
# Check bot token
railway run node scripts/health-check.js

# Verify webhook info
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

#### Database Connection Errors
```bash
# Check database status
railway logs --service postgresql

# Test database connection
railway run npm run db:migrate
```

#### Deployment Failures
```bash
# Check build logs
railway logs --deployment

# Verify environment variables
railway variables

# Check project status
railway status
```

#### Webhook Issues
```bash
# Verify webhook URL is set
railway variables | grep WEBHOOK_URL

# Test webhook endpoint
curl -X POST https://your-app.railway.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check application health
curl https://your-app.railway.app/health

# View application logs
railway logs --tail

# Monitor resource usage
railway status
```

### Database Management

```bash
# Run database migrations
railway run npm run db:migrate

# Setup test data (optional)
railway run npm run setup:test-data

# Database backup (PostgreSQL)
railway run pg_dump $DATABASE_URL > backup.sql
```

### Updating the Bot

```bash
# Deploy updates
git push origin main  # If connected to GitHub
# or
railway up  # Manual deployment

# Monitor deployment
railway logs --tail
```

## 🔐 Security Best Practices

### Environment Security
- ✅ Use strong, random webhook secrets
- ✅ Regularly rotate bot tokens
- ✅ Keep admin user IDs confidential
- ✅ Use environment variables for all secrets

### Database Security
- ✅ Railway PostgreSQL has SSL enabled by default
- ✅ Database connections are encrypted
- ✅ Regular automatic backups
- ✅ Access restricted to your Railway project

### Network Security
- ✅ HTTPS enforced for all webhook communication
- ✅ Webhook secret validation
- ✅ Rate limiting enabled
- ✅ Input validation and sanitization

## 📈 Scaling Considerations

### Performance Optimization
```bash
# Monitor memory usage
railway logs | grep "Memory"

# Check response times
curl -w "%{time_total}" https://your-app.railway.app/health

# Database query optimization
railway run npm run db:migrate
```

### Resource Limits
- **Memory**: Railway provides generous limits
- **Database**: PostgreSQL with automatic backups
- **Bandwidth**: Unlimited for most plans
- **Requests**: Handle thousands of concurrent users

## 🔄 CI/CD Setup

### GitHub Integration

1. **Connect Repository**
   ```bash
   railway connect
   ```

2. **Auto-Deploy Setup**
   - Railway automatically deploys on git push
   - Builds run on every commit
   - Zero-downtime deployments

3. **Environment Branches**
   ```bash
   # Production from main branch
   railway environment production

   # Staging environment
   railway environment staging
   ```

## 📞 Support Resources

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Help Center](https://help.railway.app)

### Bot Support
- Health endpoint: `https://your-app.railway.app/health`
- Application logs: `railway logs`
- Database status: `railway status`

### Emergency Procedures

#### Bot Down
1. Check Railway status page
2. Review application logs
3. Verify environment variables
4. Test webhook connectivity

#### Database Issues
1. Check PostgreSQL service status
2. Verify DATABASE_URL variable
3. Test database connectivity
4. Review recent migrations

---

## 🎉 Deployment Checklist

- [ ] Railway account created
- [ ] PostgreSQL service added
- [ ] All environment variables set
- [ ] Bot token configured
- [ ] Webhook URL set
- [ ] Admin user IDs configured
- [ ] Application deployed successfully
- [ ] Health check passing
- [ ] Bot responding to messages
- [ ] Database connectivity verified
- [ ] Logs monitoring setup

**🚀 Your bot is now live on Railway!**

Test your bot by sending `/start` to verify everything is working correctly.