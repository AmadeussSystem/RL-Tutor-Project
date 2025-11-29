"""
FastAPI Main Application - RL Educational Tutor Backend
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth, session, analytics, learning_style, students, 
    recommendations, skill_gaps, learning_pace, smart_recommendations, mastery, placement
)
from app.models.mastery import MasterySkill
from app.models.models import Content

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for RL-Based Personalized Educational Tutor",
    version="1.0.0"
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://rl-tutor-project.vercel.app",
        "https://*.vercel.app"  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(session.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(learning_style.router, prefix=settings.API_V1_STR, tags=["Learning Style"])
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(skill_gaps.router, prefix=settings.API_V1_STR)
app.include_router(learning_pace.router, prefix=settings.API_V1_STR)
app.include_router(smart_recommendations.router, prefix=settings.API_V1_STR)
app.include_router(mastery.router, prefix=settings.API_V1_STR)
app.include_router(placement.router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    from app.core.database import SessionLocal
    
    init_db()
    print("[OK] Database initialized")
    
    # Auto-seed skill tree if empty
    db = SessionLocal()
    try:
        skill_count = db.query(MasterySkill).count()
        if skill_count == 0:
            print("[INFO] Populating skill tree with 20 skills...")
            # Import the seeding data directly instead of calling function
            skills_data = [
                ("Sets and Relations", "Understand sets, relations, and functions", "Algebra", "beginner", 3.0, []),
                ("Quadratic Equations", "Solve quadratic equations and inequalities", "Algebra", "beginner", 4.0, ["Sets and Relations"]),
                ("Polynomials", "Polynomial equations and their roots", "Algebra", "intermediate", 4.0, ["Quadratic Equations"]),
                ("Sequences and Series", "Arithmetic and geometric progressions", "Algebra", "intermediate", 5.0, ["Polynomials"]),
                ("Complex Numbers", "Complex numbers and their operations", "Algebra", "intermediate", 4.0, ["Quadratic Equations"]),
                ("Permutations and Combinations", "Counting principles and probability basics", "Algebra", "intermediate", 5.0, ["Sets and Relations"]),
                ("Trigonometric Ratios", "Basic trigonometric functions and angles", "Trigonometry", "beginner", 4.0, []),
                ("Trigonometric Identities", "Fundamental trigonometric identities", "Trigonometry", "intermediate", 5.0, ["Trigonometric Ratios"]),
                ("Inverse Trigonometric Functions", "Inverse trigonometric functions", "Trigonometry", "intermediate", 4.0, ["Trigonometric Ratios"]),
                ("Straight Lines", "Equations of straight lines and their properties", "Geometry", "beginner", 4.0, []),
                ("Circles", "Equations and properties of circles", "Geometry", "intermediate", 5.0, ["Straight Lines"]),
                ("Conic Sections", "Parabola, ellipse, and hyperbola", "Geometry", "advanced", 6.0, ["Circles"]),
                ("Limits and Continuity", "Limits, continuity, and basic calculus concepts", "Calculus", "beginner", 4.0, []),
                ("Differentiation", "Derivatives and their applications", "Calculus", "intermediate", 6.0, ["Limits and Continuity"]),
                ("Integration", "Indefinite and definite integrals", "Calculus", "intermediate", 6.0, ["Differentiation"]),
                ("Applications of Calculus", "Differential equations and optimization", "Calculus", "advanced", 6.0, ["Integration"]),
                ("Vectors", "Vector algebra and 3D geometry", "Advanced", "intermediate", 5.0, ["Straight Lines"]),
                ("Matrices and Determinants", "Matrix algebra and linear systems", "Advanced", "intermediate", 5.0, []),
                ("Probability", "Probability theory and distributions", "Statistics", "advanced", 5.0, ["Permutations and Combinations"]),
                ("Statistics", "Statistical analysis and inference", "Statistics", "advanced", 4.0, ["Probability"]),
            ]
            
            # Create skills map
            skills_map = {}
            for name, desc, cat, diff, hours, _ in skills_data:
                skill = MasterySkill(
                    name=name,
                    description=desc,
                    category=cat,
                    difficulty=diff,
                    estimated_hours=hours
                )
                db.add(skill)
                skills_map[name] = skill
            
            db.commit()
            
            # Add prerequisites
            for name, _, _, _, _, prereqs in skills_data:
                skill = skills_map[name]
                for prereq_name in prereqs:
                    if prereq_name in skills_map:
                        skill.prerequisites.append(skills_map[prereq_name])
            
            db.commit()
            print("[OK] Skill tree populated with 20 skills!")
        
        # Auto-seed JEE PYQ content if empty
        jee_pyq_count = db.query(Content).filter(Content.tags.contains("jee_pyq")).count()
        if jee_pyq_count == 0:
            print("[INFO] Populating IIT JEE PYQ content...")
            try:
                from seed_jee_pyq import seed_jee_pyq
                seed_jee_pyq()
                print("[OK] IIT JEE PYQ content populated!")
            except Exception as e:
                print(f"[ERROR] Error seeding JEE PYQ: {e}")
    except Exception as e:
        print(f"[ERROR] Error during startup: {e}")
    finally:
        db.close()
    
    print(f"[OK] Server starting on {settings.API_V1_STR}")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "RL Educational Tutor API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
