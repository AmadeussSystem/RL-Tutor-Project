# PostgreSQL Migration Guide

## Problem: SQLite Database Gets Wiped on Render

**Issue:** Render's free tier uses ephemeral storage. SQLite database files are deleted when:
- Service restarts
- Service sleeps after inactivity
- New deployment occurs

**Symptom:** User accounts and data disappear after some time.

**Solution:** Use PostgreSQL (free on Render with persistent storage)

---

## Step-by-Step Migration to PostgreSQL

### 1. Create PostgreSQL Database on Render

1. **Login to Render:** https://dashboard.render.com
2. **Create New PostgreSQL Database:**
   - Click **"New +"** → **"PostgreSQL"**
   - **Name:** `rl-tutor-db` (or your preferred name)
   - **Database:** `rl_tutor`
   - **User:** (auto-generated)
   - **Region:** Choose same region as your backend (e.g., Oregon)
   - **PostgreSQL Version:** 16 (or latest)
   - **Instance Type:** **Free** ✅
3. **Click "Create Database"**
4. **Wait for database to be created** (takes 1-2 minutes)

### 2. Get Database Connection URL

After creation, you'll see the database dashboard with connection info:

1. **Copy the Internal Database URL**
   - Format: `postgresql://user:password@host/dbname`
   - Example: `postgresql://rl_tutor_user:xRkL...@dpg-xyz.oregon-postgres.render.com/rl_tutor_db`
   - ⚠️ Use **Internal URL** (faster) not External URL

### 3. Update Backend Environment Variables

1. **Go to your backend service:** https://dashboard.render.com/web/your-service
2. **Click "Environment" tab** (left sidebar)
3. **Find or Add `DATABASE_URL`:**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the PostgreSQL URL from step 2
   - Example: `postgresql://rl_tutor_user:xRkL...@dpg-xyz.oregon-postgres.render.com/rl_tutor_db`
4. **Click "Save Changes"**

### 4. Update Backend Code (Already Done ✅)

The `requirements.txt` has been updated to include `psycopg2-binary` (PostgreSQL driver).

### 5. Deploy Updated Code

```bash
git add .
git commit -m "Add PostgreSQL support for production"
git push origin main
```

Render will automatically:
- Detect the changes
- Install `psycopg2-binary`
- Use the new `DATABASE_URL`
- Create all tables in PostgreSQL
- Start the service

### 6. Verify Migration

1. **Check Logs on Render:**
   - Go to your service → "Logs" tab
   - Look for: `✅ Database initialized`
   - Should NOT see any SQLite-related errors

2. **Test Creating Account:**
   - Go to your deployed frontend
   - Register a new account
   - Login
   - **Wait a few hours or restart the service**
   - Login again - account should still exist ✅

---

## Database Comparison

| Feature | SQLite (Current) | PostgreSQL (Recommended) |
|---------|-----------------|-------------------------|
| **Persistence** | ❌ Ephemeral on Render | ✅ Persistent |
| **Data Loss** | ❌ Lost on restart | ✅ Data persists |
| **Free Tier** | ✅ Free | ✅ Free on Render |
| **Performance** | ⚠️ Good for local | ✅ Better for production |
| **Concurrent Users** | ⚠️ Limited | ✅ Excellent |
| **Backup** | ❌ Manual | ✅ Automatic on Render |

---

## Environment Variables Summary

After migration, your environment variables should be:

### Render Environment Variables:
```bash
# Database - PostgreSQL URL from Render
DATABASE_URL=postgresql://user:pass@host/dbname

# Security
SECRET_KEY=your-secret-key-from-openssl-rand-hex-32
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## Troubleshooting

### Error: "Could not load plugin: sqlalchemy.dialects:postgresql"
**Solution:** Make sure `psycopg2-binary` is in `requirements.txt` and redeploy.

### Error: "Connection refused"
**Solution:** 
- Check DATABASE_URL is correct
- Use **Internal URL** not External URL
- Make sure PostgreSQL database is in same region as backend

### Error: "password authentication failed"
**Solution:**
- Double-check DATABASE_URL is copied exactly
- No extra spaces or quotes
- Use the URL from Render dashboard

### Tables Not Created
**Solution:**
- Check logs for errors
- SQLAlchemy should auto-create tables on startup
- Look for: `✅ Database initialized` in logs

---

## Data Migration (If Needed)

If you have important data in SQLite locally that you want to migrate:

### Option 1: Export/Import via Script
```python
# export_data.py - Run locally
from app.core.database import SessionLocal
from app.models.models import Student, Question
import json

db = SessionLocal()
students = db.query(Student).all()
questions = db.query(Question).all()

# Export to JSON
data = {
    "students": [{"email": s.email, "username": s.username, ...} for s in students],
    "questions": [{"text": q.text, "options": q.options, ...} for q in questions]
}

with open("backup.json", "w") as f:
    json.dump(data, f)
```

### Option 2: Start Fresh
For development, it's often easier to just recreate test accounts.

---

## Next Steps After Migration

1. ✅ PostgreSQL database created
2. ✅ Backend using PostgreSQL
3. ✅ Data persists across restarts
4. 🎯 **Test thoroughly:**
   - Create account
   - Answer questions
   - View analytics
   - **Restart service on Render**
   - Login again - everything should still be there!

---

## Cost

- **PostgreSQL on Render Free Tier:**
  - Storage: 1 GB (plenty for this app)
  - Connections: Limited
  - **No credit card required** ✅
  - Data persists forever
  - Automatic backups

**Perfect for your project!** 🚀
