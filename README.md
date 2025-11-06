# RL-Based Personalized Educational Tutor 🎓🤖

A full-stack intelligent tutoring system that uses **Reinforcement Learning (Q-Learning)** to personalize educational content delivery for IIT JEE preparation based on individual student performance and learning patterns.

## 🎯 Overview

This project demonstrates a practical application of reinforcement learning in education. The system adapts to each student's knowledge level and learning style, recommending appropriate content in real-time using a Q-Learning agent.

### Key Features
- 🧠 **Q-Learning Agent** - Adaptive content recommendation
- 📚 **IIT JEE Content** - Real Previous Year Questions (PYQ) from Physics, Chemistry & Mathematics
- 🌳 **Skill Tree System** - 48 skills across 3 subjects with progressive unlocking
- 🎯 **Placement Test** - Initial assessment to unlock appropriate starting skills
- 📊 **Real-time Analytics** - Track progress, accuracy, and rewards with beautiful charts
- 🎨 **Modern Dark Theme UI** - Consistent, elegant interface
- 🔐 **Secure Authentication** - JWT-based with refresh tokens
- 📈 **Progress Tracking** - Detailed learning analytics with Recharts visualization
- ⚡ **Fast Backend** - FastAPI with async support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- pip and npm

### Easy Start (Recommended)

**Windows:**
```bash
# Double-click start.bat or run in terminal:
start.bat
```

**Linux/Mac:**
```bash
# Run in terminal:
./start.sh
```

The startup script will:
1. Install Python dependencies (pip)
2. Install Node.js dependencies (npm)
3. Start Backend server on http://localhost:8001
4. Start Frontend server on http://localhost:3000

Both servers will open in separate terminal windows.

### Manual Start

#### 1. Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database
python seed_db.py

# Run server
uvicorn main:app --reload
```

Visit: **http://localhost:8000/docs** (API Documentation)

## 📁 Project Structure

```
mini_project/
├── app/                      # Next.js Frontend
│   ├── components/ui/       # Aceternity UI components
│   ├── lib/                 # Utilities
│   └── page.tsx            # Landing page
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Database models
│   │   └── services/       # RL Agent & Student Model
│   ├── main.py             # FastAPI app
│   └── seed_db.py          # Database seeding
├── INTEGRATION.md          # Integration guide
├── PROJECT_SUMMARY.md      # Detailed project info
└── TODO.txt               # Project checklist
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new student
- `POST /api/v1/auth/login` - Login and get JWT token

### Learning Sessions
- `POST /api/v1/session/start` - Start session, get recommended content
- `POST /api/v1/session/answer` - Submit answer, get feedback
- `GET /api/v1/session/progress` - Get learning progress

### Analytics
- `GET /api/v1/analytics/dashboard` - Complete dashboard data
- `GET /api/v1/analytics/rl-stats` - RL agent statistics

## 🧠 RL Agent

### Q-Learning Algorithm
- **State Space**: 4D knowledge vector (algebra, calculus, geometry, statistics)
- **Action Space**: Content selection from available pool
- **Reward Function**: 
  - Correctness (+1.0 correct, -0.5 wrong)
  - Time efficiency (bonus for quick answers)
  - Difficulty appropriateness (bonus for matching level)
- **Exploration**: Epsilon-greedy (ε = 0.1)
- **Learning Rate**: α = 0.1
- **Discount Factor**: γ = 0.95

## 🧪 Testing

The project includes comprehensive test coverage:

### Unit Tests (20+ tests)
```bash
cd backend
pytest test_rl_agent.py -v
```

### Integration Tests
```bash
cd backend
python test_integration.py
```

### End-to-End Tests (13 scenarios)
```bash
cd backend
python test_e2e.py
```

### Test Credentials
- **Username**: `testuser`
- **Password**: `test123`

### Interactive Testing
Visit http://localhost:8000/docs for Swagger UI

### Documentation
See [TESTING.md](./TESTING.md) for complete testing guide

## 📊 Database

### Content Available
- **Algebra**: 5 questions (difficulty 1-4)
- **Calculus**: 4 questions (difficulty 1-4)
- **Geometry**: 4 questions (difficulty 1-3)
- **Statistics**: 4 questions (difficulty 1-3)

### Models
- Students, Content, LearningSession, StudentKnowledge, PerformanceMetrics

## 📚 Documentation

- **[INTEGRATION.md](INTEGRATION.md)** - Frontend-Backend integration guide
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project details
- **[backend/README.md](backend/README.md)** - Backend documentation
- **[TODO.txt](TODO.txt)** - Project progress checklist

## 🛠️ Tech Stack

### Frontend
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion (as 'motion')
- Aceternity UI Components
- Lucide Icons

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- NumPy, Pandas, Scikit-learn

### Database
- SQLite (development)
- PostgreSQL (production ready)

## 🎯 Current Status

✅ **COMPLETED**
- Backend API fully functional
- RL Agent implemented
- Database seeded with content
- Landing page with animations
- Authentication system
- Learning session management
- Analytics endpoints

⏳ **IN PROGRESS**
- Frontend-backend integration
- Dashboard UI
- Learning session interface

## 🔗 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

## 👥 Team

- Dr. Sarah Chen - AI Research Lead
- Alex Kumar - Full-Stack Developer
- Maya Patel - ML Engineer
- James Wilson - UX Designer

## 📝 Next Steps

1. Create API client in Next.js
2. Build login/register pages
3. Create student dashboard
4. Build quiz interface
5. Add progress visualization
6. Deploy to production

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Q-Learning Tutorial](https://en.wikipedia.org/wiki/Q-learning)

---

**University Mini-Project** | **Reinforcement Learning Application** | **Educational Technology**

---

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment instructions
- [TESTING.md](./TESTING.md) - Complete testing guide
- [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md) - Project overview
- [PHASE_9_10_COMPLETE.md](./PHASE_9_10_COMPLETE.md) - Demo & testing features

---

## 🎮 Demo Features

### Interactive Demo
Visit `/demo` to try a 5-step walkthrough of the system without creating an account.

### RL Visualization
Visit `/rl-viz` to see how the Q-Learning agent makes decisions in real-time.

---

**Project Status**: 98% Complete ✅  
**Last Updated**: October 22, 2025

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Aceternity UI setup

This project is prepared to use components from Aceternity UI (Tailwind-based components).

Installed/required packages:

- Tailwind CSS v4 (already configured via `@tailwindcss/postcss` and `@import "tailwindcss"` in `app/globals.css`)
- motion (Framer Motion v11)
- clsx
- tailwind-merge
- lucide-react (icons)

Utility:

- `lib/utils.ts` exports a `cn` helper for merging class names with Tailwind-merge.

Optional install (if any of the above are missing):

```bash
npm i motion clsx tailwind-merge lucide-react
```

Usage example:

```tsx
import { cn } from "@/lib/utils";

export function Example({ active }: { active?: boolean }) {
	return (
		<button className={cn("px-4 py-2 rounded-md", active && "bg-black text-white")}>Click</button>
	);
}
```
