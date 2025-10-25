# Render.com Backend Configuration Guide

## 📋 Configuration Settings

Copy these exact values into Render:

### Basic Settings

**Name:**
```
RL-Tutor-Project
```

**Language:**
```
Python 3
```
⚠️ Change from "Docker" to "Python 3"

**Branch:**
```
main
```

**Root Directory:**
```
backend
```
⚠️ IMPORTANT: Set this to `backend` (your FastAPI code is in the backend folder)

**Region:**
```
Singapore (Southeast Asia)
```

---

## 🔨 Build & Start Commands

**Build Command:**
```bash
pip install -r requirements.txt && python populate_jee_questions.py
```

This will:
1. Install all Python dependencies
2. Populate the database with 39 JEE questions

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

⚠️ Note: Use `$PORT` not a fixed port - Render provides the port via environment variable

---

## 🔐 Environment Variables

Click "Advanced" → Add Environment Variables:

### Required Variables:

**SECRET_KEY**
```
your-super-secret-random-key-min-32-characters-long-change-this
```
💡 Generate a secure random key (use password generator or run in terminal):
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**DATABASE_URL**
```
sqlite:///./rl_tutor.db
```

**FRONTEND_URL**
```
http://localhost:3000
```
⚠️ Update this after deploying frontend to Vercel (e.g., `https://your-app.vercel.app`)

**PYTHON_VERSION** (Optional but recommended)
```
3.11.0
```

**PORT** (Auto-provided by Render - don't add manually)

---

## 📝 Step-by-Step Configuration

### Step 1: Basic Info
1. ✅ Name: `RL-Tutor-Project`
2. ❌ Language: Change to **"Python 3"** (click dropdown)
3. ✅ Branch: `main`
4. ✅ Region: Keep as Singapore

### Step 2: Root Directory
1. Find **"Root Directory"** field (should be near top)
2. Enter: `backend`
3. This tells Render your app is in the `backend` folder

### Step 3: Build & Start Commands
1. **Build Command:**
   ```bash
   pip install -r requirements.txt && python populate_jee_questions.py
   ```

2. **Start Command:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Step 4: Environment Variables
Click "Advanced" button → "Add Environment Variable"

Add these one by one:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | `your-random-secret-key-here` |
| `DATABASE_URL` | `sqlite:///./rl_tutor.db` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `PYTHON_VERSION` | `3.11.0` |

### Step 5: Instance Type
1. Select **"Free"** ($0/month, 512 MB RAM, 0.1 CPU)
2. This is perfect for getting started!

---

## 🚀 After Configuration

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://rl-tutor-project.onrender.com`
4. Test it: `https://rl-tutor-project.onrender.com/docs`

---

## ⚠️ Important Notes

### First Request Will Be Slow
- Free tier services spin down after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast

### Database Persistence
- SQLite data persists but may reset on redeploy
- For production, consider upgrading to PostgreSQL
- Render offers free PostgreSQL: https://render.com/docs/databases

### Health Checks
Render will ping your service to check if it's alive. Your FastAPI app automatically handles this.

---

## 🔍 Troubleshooting

### Build Fails
**Check Logs:**
- Look for "Build" logs in Render dashboard
- Common issues:
  - Missing dependencies in `requirements.txt`
  - Python version mismatch
  - Wrong root directory

**Solutions:**
```bash
# Make sure requirements.txt has all dependencies
pip freeze > backend/requirements.txt
git add backend/requirements.txt
git commit -m "Update requirements"
git push
```

### Service Won't Start
**Check Logs:**
- Look for "Deploy" logs
- Common issues:
  - Wrong start command
  - Port binding issues
  - Database connection errors

**Verify Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
Make sure it's exactly this (with `$PORT` not `8002`)

### 404 Errors
**Check Root Directory:**
- Should be set to `backend`
- Your `main.py` should be at `backend/main.py`

### CORS Errors (After deploying frontend)
**Update Environment Variable:**
1. Go to Render dashboard → Your service → Environment
2. Update `FRONTEND_URL` to your Vercel URL
3. Example: `https://jee-rl-tutor.vercel.app`
4. Click "Save Changes" (auto-redeploys)

---

## 📊 Monitoring

After deployment:
- **Logs**: View real-time logs in Render dashboard
- **Metrics**: See CPU, memory usage
- **Events**: Track deployments, restarts
- **Shell**: Access shell to run commands (Pro plan)

---

## 💡 Pro Tips

1. **Keep Service Awake:**
   - Use UptimeRobot.com (free) to ping every 5 minutes
   - Prevents cold starts

2. **Environment Variables:**
   - Can be updated without redeploying code
   - Click "Save Changes" to restart with new values

3. **Logs:**
   - Check logs frequently during first deployment
   - Use `print()` statements for debugging

4. **Database:**
   - Backup your SQLite file before major changes
   - Consider PostgreSQL for production

---

## ✅ Success Checklist

- [ ] Language set to "Python 3"
- [ ] Root Directory set to "backend"
- [ ] Build command includes `populate_jee_questions.py`
- [ ] Start command uses `$PORT` variable
- [ ] SECRET_KEY environment variable is set (random)
- [ ] DATABASE_URL is set to SQLite path
- [ ] FRONTEND_URL is set (update after Vercel deploy)
- [ ] Instance Type is "Free"
- [ ] Service is created and deploying

---

## 🎯 Next Steps

After backend is deployed:
1. ✅ Test API docs: `https://your-service.onrender.com/docs`
2. 🚀 Deploy frontend to Vercel (see DEPLOY_QUICK.md)
3. 🔗 Update `FRONTEND_URL` in Render with Vercel URL
4. ✨ Your app is live!

---

## 🆘 Still Having Issues?

Common commands to fix things:

```bash
# Update requirements
cd backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update requirements"
git push

# Check your repo structure
git ls-files | grep backend

# Verify main.py exists
ls -la backend/main.py
```

**Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com

---

Good luck! Your backend should be live in ~5-10 minutes! 🚀
