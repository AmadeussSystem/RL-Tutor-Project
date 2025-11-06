# Project Overview - RL-Based Personalized Educational Tutor

## 🎯 What is this Project?

An intelligent tutoring system that uses **Reinforcement Learning (Q-Learning)** to personalize IIT JEE exam preparation. The system adapts to each student's performance in real-time, recommending the most suitable questions and topics.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite
- **AI/ML**: Q-Learning Agent, Collaborative Filtering
- **Auth**: JWT tokens with refresh mechanism

### Project Structure
```
mini_project/
├── app/                    # Next.js frontend pages
├── components/             # React components
├── lib/                    # Frontend utilities
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Config, DB, Security
│   │   ├── models/        # Database models
│   │   └── services/      # Business logic (RL Agent)
│   └── main.py            # FastAPI entry point
├── public/                # Static assets
└── start.bat/start.sh     # Startup scripts
```

## 🔑 Core Features

### 1. Reinforcement Learning Agent
- **Algorithm**: Q-Learning with epsilon-greedy exploration
- **Purpose**: Learns optimal question difficulty based on student performance
- **State Space**: Student mastery level (0-100%) for each skill
- **Action Space**: Question difficulty (Easy, Medium, Hard)
- **Reward System**: 
  - Correct answer: +10 (easy), +20 (medium), +30 (hard)
  - Wrong answer: -5 (easy), -10 (medium), -15 (hard)

### 2. Skill Tree System
- **48 Skills** across Physics, Chemistry, Mathematics
- **Progressive Unlocking**: Skills locked until prerequisites are mastered
- **Placement Test**: Initial assessment to unlock appropriate starting skills
- **Mastery Tracking**: 0-100% mastery for each skill

### 3. Personalization Features
- **Learning Style Assessment**: VARK questionnaire (Visual, Auditory, Reading, Kinesthetic)
- **Skill Gap Analysis**: Identifies weak areas based on performance
- **Learning Pace Tracking**: Monitors time spent vs. expected baselines
- **Smart Recommendations**: Combines RL, collaborative filtering, and content-based methods

### 4. Analytics Dashboard
- **Progress Tracking**: Real-time charts with Recharts
- **Performance Metrics**: Accuracy, streaks, time spent
- **Reward Visualization**: Q-Learning rewards over time
- **Topic-wise Analysis**: Performance breakdown by subject

## 🎓 IIT JEE Content

### Subjects Covered
1. **Physics** (16 skills): Mechanics, Electromagnetism, Optics, Modern Physics, etc.
2. **Chemistry** (16 skills): Physical, Organic, Inorganic Chemistry topics
3. **Mathematics** (16 skills): Algebra, Calculus, Geometry, Trigonometry, etc.

### Question Bank
- **Real PYQ**: Previous Year Questions from JEE Main/Advanced
- **Difficulty Levels**: Easy, Medium, Hard
- **Total Questions**: 100+ across all topics
- **Detailed Solutions**: Step-by-step explanations

## 🔐 Security Features
- JWT authentication with access and refresh tokens
- Password hashing with bcrypt
- Token expiration and auto-refresh
- Protected API routes

## 📊 Data Flow

### User Journey
1. **Register** → Create account
2. **Placement Test** → Answer 20 questions across topics
3. **Skill Unlock** → System unlocks appropriate skills based on test
4. **Learning** → Practice questions with RL-powered recommendations
5. **Progress** → Track mastery, analytics, achievements

### RL Learning Loop
```
Student answers question 
→ RL Agent observes (state, action, reward)
→ Q-Table updates via Bellman equation
→ Agent recommends next difficulty
→ Repeat
```

## 🎨 UI/UX Highlights
- **Dark Theme**: Consistent black/zinc-900 design
- **Responsive**: Mobile and desktop optimized
- **Real-time Updates**: Live progress tracking
- **Interactive Visualizations**: Charts with Recharts
- **Smooth Animations**: Framer Motion transitions

## 📈 Key Metrics Tracked
- Questions attempted/correct
- Accuracy percentage
- Time spent per topic
- Mastery levels
- Learning pace
- Achievement badges
- Study streaks

## 🚀 Deployment Ready
- Docker support
- Environment configuration
- Production database migration scripts
- One-command startup (start.bat/start.sh)

---

**Next Files:**
- DOCS_02_BACKEND_FILES.md - Backend file explanations
- DOCS_03_FRONTEND_FILES.md - Frontend file explanations
- DOCS_04_RL_AGENT.md - Deep dive into RL implementation
- DOCS_05_API_ENDPOINTS.md - All API routes explained
