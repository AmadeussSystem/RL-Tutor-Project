# Backend Files Explained

## 📁 backend/main.py
**Purpose**: FastAPI application entry point

**What it does**:
- Creates FastAPI app instance
- Configures CORS for frontend communication
- Includes all API routers (auth, recommendations, analytics, etc.)
- Sets up database on startup
- Runs on port 8001

**Key Code**:
```python
app = FastAPI(title="RL Tutor API")
app.add_middleware(CORSMiddleware)  # Allow frontend requests
app.include_router(auth.router)     # Auth endpoints
app.include_router(recommendations.router)  # RL recommendations
```

---

## 📁 backend/app/core/

### config.py
**Purpose**: Application configuration and environment variables

**What it does**:
- Loads `.env` file settings
- Defines SECRET_KEY for JWT
- Sets token expiration times
- Database URL configuration

**Key Settings**:
- `SECRET_KEY`: For JWT signing
- `ACCESS_TOKEN_EXPIRE_MINUTES`: 30 minutes
- `REFRESH_TOKEN_EXPIRE_DAYS`: 7 days
- `DATABASE_URL`: SQLite database path

### database.py
**Purpose**: Database connection and session management

**What it does**:
- Creates SQLAlchemy engine
- Manages database sessions
- Provides `get_db()` dependency for API routes
- Creates all tables on startup

**Key Functions**:
```python
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(engine)
Base = declarative_base()  # For models

def get_db():  # Used in API endpoints
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### security.py
**Purpose**: Password hashing and JWT token management

**What it does**:
- Hashes passwords with bcrypt
- Verifies password hashes
- Creates JWT access and refresh tokens
- Verifies and decodes tokens

**Key Functions**:
```python
def hash_password(password: str) -> str
def verify_password(plain: str, hashed: str) -> bool
def create_access_token(data: dict) -> str
def create_refresh_token(data: dict) -> str
def verify_token(token: str) -> dict
```

---

## 📁 backend/app/models/

### models.py
**Purpose**: Main SQLAlchemy database models

**Key Models**:

#### 1. User
- Stores user credentials
- Fields: id, username, hashed_password, learning_style
- Relationships: sessions, knowledge, mastery

#### 2. Content
- Question bank
- Fields: id, skill, difficulty, question_text, options, correct_answer, explanation
- Linked to sessions

#### 3. Session
- Each question attempt
- Fields: user_id, content_id, correct, reward, timestamp
- Tracks RL rewards

#### 4. StudentKnowledge
- Current mastery per skill
- Fields: user_id, skill, mastery_level (0-100)
- Updated after each question

#### 5. StudentMastery
- Long-term skill tracking
- Fields: user_id, skill, mastery_percentage, questions_attempted

#### 6. Achievement
- Badge system
- Fields: user_id, badge_name, tier, earned_at

#### 7. StudyPlan
- Personalized study schedules
- Fields: user_id, title, tasks, target_date

### skill_gap.py
**Purpose**: Skill gap analysis models

**Models**:
- `SkillGap`: Identifies weak skills
- `Skill`: Individual skill definitions
- `PreAssessmentResult`: Placement test results

### learning_pace.py
**Purpose**: Learning speed tracking

**Models**:
- `LearningPace`: Time spent per topic
- `PaceMetrics`: Calculated speed metrics

### learning_style.py
**Purpose**: VARK learning style

**Models**:
- `LearningStyleResponse`: Quiz answers
- `LearningStyleProfile`: VARK preferences (Visual/Auditory/Reading/Kinesthetic)

### smart_recommendations.py
**Purpose**: Advanced recommendation tracking

**Models**:
- `RecommendationFeedback`: User feedback on recommendations
- `RecommendationHistory`: Past recommendations

### mastery.py
**Purpose**: Detailed mastery tracking

**Models**:
- `MasteryLevel`: Skill proficiency levels
- `SkillUnlock`: Which skills are accessible

---

## 📁 backend/app/services/

### rl_agent.py
**Purpose**: Core Q-Learning reinforcement learning agent

**What it does**:
- Implements Q-Learning algorithm
- Maintains Q-table: Q[skill][difficulty] = expected_reward
- Updates Q-values using Bellman equation
- Recommends next question difficulty

**Key Components**:

#### RLAgent Class
```python
class RLAgent:
    def __init__(self):
        self.q_table = {}  # Q[skill][difficulty] = value
        self.learning_rate = 0.1
        self.discount_factor = 0.95
        self.epsilon = 0.1  # Exploration rate
```

#### Key Methods:
1. `get_action(skill, mastery)`: Choose difficulty (epsilon-greedy)
2. `update(skill, action, reward, next_mastery)`: Update Q-table
3. `get_reward(correct, difficulty)`: Calculate reward
4. `save()/load()`: Persist Q-table to disk

**Learning Process**:
```
1. Get current mastery level
2. Choose action (difficulty) - 90% best, 10% random
3. Student answers question
4. Calculate reward based on correctness
5. Update Q-value: Q(s,a) += α[r + γ*max(Q(s',a')) - Q(s,a)]
6. Update mastery level
```

### student_model.py
**Purpose**: Student performance modeling

**What it does**:
- Tracks mastery levels per skill
- Updates knowledge after each session
- Calculates learning trends

**Key Functions**:
```python
def update_mastery(user_id, skill, correct)
def get_mastery_level(user_id, skill) -> float
def predict_performance(user_id, skill) -> float
```

### collaborative_filtering.py
**Purpose**: Collaborative recommendation system

**What it does**:
- Finds similar students based on performance
- Recommends content that similar students succeeded on
- Uses cosine similarity

**Algorithm**:
1. Build user-skill matrix
2. Calculate similarity between students
3. Recommend skills where similar students performed well

### content_bandit.py
**Purpose**: Multi-armed bandit for content selection

**What it does**:
- Balances exploration vs exploitation
- Tries different content types
- Learns which content works best per student

**Algorithm**: Upper Confidence Bound (UCB)

### mastery_service.py
**Purpose**: Business logic for skill mastery

**What it does**:
- Checks skill unlock eligibility
- Updates mastery percentages
- Manages prerequisite relationships
- Handles placement test scoring

**Key Functions**:
```python
def check_skill_unlocked(user_id, skill_name) -> bool
def unlock_skill(user_id, skill_name)
def get_available_skills(user_id) -> list
def process_placement_test(user_id, answers)
```

---

## 📁 backend/app/api/ (Continued in DOCS_05_API_ENDPOINTS.md)

Quick overview:
- `auth.py`: Login, register, token refresh
- `recommendations.py`: RL-powered question suggestions
- `analytics.py`: Progress charts and statistics
- `mastery.py`: Skill tree and mastery endpoints
- `placement.py`: Placement test
- `skill_gaps.py`: Weak area analysis
- `learning_pace.py`: Speed tracking
- `learning_style.py`: VARK quiz
- `students.py`: User profile management
- `session.py`: Question submission and tracking

---

**Interview Tips for Backend**:
1. Explain Q-Learning: "We use temporal difference learning to optimize question difficulty"
2. Database: "SQLAlchemy ORM with relationship mapping for efficient queries"
3. Security: "JWT tokens with bcrypt hashing, refresh token rotation"
4. Performance: "FastAPI's async support, database session management"
5. Scalability: "Modular service layer, can swap SQLite for PostgreSQL"
