# Frontend Files Explained

## 📁 app/ (Next.js Pages)

### app/layout.tsx
**Purpose**: Root layout component for entire app

**What it does**:
- Wraps all pages with common layout
- Sets up global fonts (Inter)
- Includes metadata (title, description)
- Applies global CSS

**Structure**:
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}  {/* All pages render here */}
      </body>
    </html>
  )
}
```

### app/page.tsx
**Purpose**: Landing page (Home page at `/`)

**What it does**:
- Hero section with animated text
- Feature showcase
- "Get Started" and "Try Demo" buttons
- Responsive design with gradients

**Key Features**:
- TypewriterEffect for animated title
- Feature cards explaining RL, analytics, progress tracking
- Redirects to `/register` or `/demo`

### app/globals.css
**Purpose**: Global CSS styles

**What it does**:
- TailwindCSS imports
- Custom CSS variables for theming
- Dark theme color definitions
- Base styles for body, headings

**Key Styles**:
```css
:root {
  --background: 0 0% 0%;      /* Black background */
  --foreground: 0 0% 100%;    /* White text */
}
```

---

## 📁 app/register/ & app/login/

### app/register/page.tsx
**Purpose**: User registration page

**What it does**:
- Registration form (username, password, confirm password)
- Validates password match
- Calls `/auth/register` API
- Redirects to placement test on success

**State Management**:
```typescript
const [formData, setFormData] = useState({
  username: '',
  password: '',
  confirmPassword: ''
})
```

### app/login/page.tsx
**Purpose**: User login page

**What it does**:
- Login form (username, password)
- Calls `/auth/login` API
- Stores token in localStorage
- Redirects to dashboard on success

**Authentication Flow**:
1. Submit credentials
2. Receive JWT token
3. Store: `localStorage.setItem('token', token)`
4. Navigate to `/dashboard`

---

## 📁 app/placement-test/

### app/placement-test/page.tsx
**Purpose**: Initial skill assessment (20 questions)

**What it does**:
- Presents 20 questions across all topics
- Tracks answers and time
- Submits to `/placement/submit` endpoint
- Unlocks appropriate skills based on performance

**Key Features**:
- Progress bar showing question number
- Timer for each question
- Multiple choice options
- Auto-unlocks skills after completion

**Logic**:
```typescript
// Submit test
const results = {
  answers: userAnswers,
  totalTime: elapsedTime
}
// Backend unlocks skills where user scored >40%
```

---

## 📁 app/skill-tree/

### app/skill-tree/page.tsx
**Purpose**: Visual skill tree with unlock system

**What it does**:
- Displays 48 skills across Physics, Chemistry, Math
- Shows locked/unlocked status
- Color-coded by mastery level
- Prerequisite relationships

**Key Features**:

#### Skill Categories
```typescript
const skillsBySubject = {
  Physics: ['Kinematics', 'Dynamics', 'Electrostatics', ...],
  Chemistry: ['Atomic Structure', 'Chemical Bonding', ...],
  Mathematics: ['Algebra Basics', 'Calculus', ...]
}
```

#### Mastery Colors
- 0-20%: Red (Beginner)
- 21-50%: Yellow (Learning)
- 51-80%: Blue (Intermediate)
- 81-100%: Green (Mastered)

#### Lock System
- Locked skills: Gray with lock icon
- Unlocked: Colored by mastery
- Click unlocked skill → Start practice

---

## 📁 app/learn/

### app/learn/page.tsx
**Purpose**: Main learning interface - practice questions

**What it does**:
- Fetches RL-recommended question
- Displays question with options
- Submits answer and gets feedback
- Shows explanation after answer
- Updates mastery in real-time

**RL Integration**:
```typescript
// Get recommendation from RL agent
const question = await api.getRecommendation(username, selectedSkill)

// Submit answer
const response = await api.submitAnswer({
  userId: username,
  contentId: question.id,
  answer: selectedAnswer,
  skill: selectedSkill
})

// Response includes:
// - correct: boolean
// - reward: number (RL reward)
// - newMastery: updated mastery level
// - explanation: detailed solution
```

**Features**:
- Skill selector dropdown
- Real-time mastery display
- Answer feedback with colors (green/red)
- Detailed explanations
- "Next Question" button

---

## 📁 app/dashboard/

### app/dashboard/page.tsx
**Purpose**: Main user dashboard after login

**What it does**:
- Overview of all user stats
- Quick access to all features
- Recent activity
- Recommended next actions

**Sections**:
1. **Welcome Header**: Greeting with username
2. **Stats Cards**: 
   - Questions attempted
   - Accuracy percentage
   - Current streak
   - Total time spent
3. **Quick Actions**:
   - Continue Learning
   - View Skill Tree
   - Check Analytics
   - Take Quiz
4. **Recent Sessions**: Last 5 question attempts

---

## 📁 app/analytics/

### app/analytics/page.tsx
**Purpose**: Comprehensive progress analytics

**What it does**:
- Visualizes learning data with Recharts
- Multiple chart types
- Filterable by time range and subject

**Charts**:

#### 1. Performance Over Time (Line Chart)
```typescript
<LineChart data={sessions}>
  <XAxis dataKey="date" />
  <YAxis />
  <Line dataKey="accuracy" stroke="#8b5cf6" />
  <Line dataKey="reward" stroke="#10b981" />
</LineChart>
```

#### 2. Skill Mastery (Bar Chart)
- Shows mastery % for each skill
- Color-coded bars
- Sorted by mastery level

#### 3. Accuracy by Difficulty (Pie Chart)
- Easy, Medium, Hard questions
- Success rate for each

#### 4. Time Analytics (Area Chart)
- Time spent per topic
- Cumulative time over days

#### 5. Reward Tracking (Line Chart)
- RL rewards over time
- Shows learning curve

**Filters**:
- Last 7 days / 30 days / All time
- Subject filter (Physics/Chemistry/Math)

---

## 📁 app/skill-gaps/

### app/skill-gaps/page.tsx
**Purpose**: Identify and address weak areas

**What it does**:
- Analyzes performance to find skill gaps
- Recommends focus areas
- Shows improvement suggestions

**Features**:
```typescript
// Backend analyzes all sessions
const gaps = await api.analyzeSkillGaps(username)

// Returns:
{
  gaps: [
    {
      skill: "Electromagnetism",
      severity: "High",
      accuracy: 35%,
      recommendedActions: ["Practice basic concepts", "Review theory"]
    }
  ]
}
```

**Display**:
- Severity levels: High (red), Medium (yellow), Low (green)
- Accuracy percentage per gap
- Recommended actions
- "Practice Now" button → redirects to /learn with that skill

---

## 📁 app/learning-pace/

### app/learning-pace/page.tsx
**Purpose**: Track learning speed and efficiency

**What it does**:
- Compares user's time vs baseline
- Shows which topics are slow/fast
- Suggests time management improvements

**Metrics**:
```typescript
{
  skill: "Calculus",
  avgTimeSpent: 180,  // seconds
  baseline: 150,      // expected time
  efficiency: "Slower",  // or "Faster" or "On Pace"
  percentageDiff: +20%
}
```

**Color Coding**:
- Green: Faster than baseline
- Yellow: On pace
- Red: Slower than baseline

---

## 📁 app/learning-style-quiz/

### app/learning-style-quiz/page.tsx
**Purpose**: VARK learning style assessment

**What it does**:
- 20-question quiz
- Determines if user is Visual, Auditory, Reading, or Kinesthetic learner
- Stores preferences for personalized recommendations

**Question Format**:
```typescript
{
  question: "When studying, I prefer to:",
  options: [
    { text: "Watch videos", type: "Visual" },
    { text: "Listen to lectures", type: "Auditory" },
    { text: "Read textbooks", type: "Reading" },
    { text: "Do practice problems", type: "Kinesthetic" }
  ]
}
```

**Scoring**:
- Counts answers per category
- Dominant category becomes learning style
- Stored in user profile

---

## 📁 app/achievements/

### app/achievements/page.tsx
**Purpose**: Gamification - badges and rewards

**What it does**:
- Displays earned badges
- Shows locked achievements
- Tracks progress towards next badge

**Badge Types**:
- **First Steps**: Complete 10 questions
- **Streak Master**: 7-day streak
- **Subject Expert**: 80%+ mastery in one subject
- **Quick Learner**: Answer 5 questions correctly in a row
- **Dedicated**: 50+ questions attempted

**Tiers**: Bronze → Silver → Gold → Platinum

---

## 📁 app/study-plan/

### app/study-plan/page.tsx
**Purpose**: Personalized study schedule

**What it does**:
- Creates custom study plans
- Daily/weekly task lists
- Tracks completion
- Sends reminders (planned)

**Plan Structure**:
```typescript
{
  title: "JEE Main Preparation",
  targetDate: "2024-01-15",
  tasks: [
    {
      skill: "Calculus",
      questionCount: 10,
      targetDate: "2024-01-08",
      completed: false
    }
  ]
}
```

---

## 📁 components/ui/

### Reusable UI Components
All components use shadcn/ui design system:

- `button.tsx`: Customizable buttons
- `card.tsx`: Card containers
- `input.tsx`: Form inputs
- `select.tsx`: Dropdown selects
- `dialog.tsx`: Modal dialogs
- `progress.tsx`: Progress bars
- `badge.tsx`: Badge elements

---

## 📁 lib/utils.ts

### app/api/index.ts
**Purpose**: Frontend API client

**What it does**:
- Centralized API calls to backend
- Handles authentication headers
- Error handling

**Key Functions**:
```typescript
export const api = {
  // Auth
  login: (username, password) => POST('/auth/login'),
  register: (username, password) => POST('/auth/register'),
  
  // Learning
  getRecommendation: (userId, skill) => GET('/recommendations'),
  submitAnswer: (data) => POST('/session/submit'),
  
  // Analytics
  getAnalytics: (userId) => GET('/analytics'),
  
  // etc...
}
```

---

**Interview Tips for Frontend**:
1. **State Management**: "Used React hooks (useState, useEffect) for local state, localStorage for persistence"
2. **Routing**: "Next.js App Router with file-based routing"
3. **Styling**: "TailwindCSS for utility-first styling, dark theme throughout"
4. **Charts**: "Recharts library for data visualization"
5. **API Integration**: "Centralized API client with error handling"
6. **UX**: "Loading states, error messages, smooth transitions"
