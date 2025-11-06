"""
Analytics and dashboard API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Student, LearningSession, StudentKnowledge
from app.models.schemas import DashboardData, StudentResponse, KnowledgeState, ProgressData
from app.services.student_model import StudentModelService
from app.services.rl_agent import agent
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard(username: str, db: Session = Depends(get_db)):
    """Get complete dashboard analytics for student"""
    
    # Get student
    student = db.query(Student).filter(Student.username == username).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get knowledge state
    knowledge = db.query(StudentKnowledge).filter(
        StudentKnowledge.student_id == student.id
    ).first()
    
    if not knowledge:
        knowledge = StudentModelService.initialize_knowledge(db, student.id)
    
    # Get progress summary
    progress = StudentModelService.get_progress_summary(db, student.id)
    
    # Get recent sessions
    recent_sessions = db.query(LearningSession).filter(
        LearningSession.student_id == student.id
    ).order_by(LearningSession.timestamp.desc()).limit(10).all()
    
    session_data = [{
        'id': s.id,
        'content_id': s.content_id,
        'is_correct': s.is_correct,
        'reward': s.reward,
        'time_spent': s.time_spent,
        'timestamp': s.timestamp.isoformat()
    } for s in recent_sessions]
    
    # Calculate time spent today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = db.query(LearningSession).filter(
        LearningSession.student_id == student.id,
        LearningSession.timestamp >= today_start
    ).all()
    time_spent_today = sum(s.time_spent for s in today_sessions) / 60  # Convert to minutes
    
    # Calculate skill improvements (JEE topics)
    skill_improvements = {
        'mechanics': knowledge.mechanics_score * 100,
        'electromagnetism': knowledge.electromagnetism_score * 100,
        'optics': knowledge.optics_score * 100,
        'modern_physics': knowledge.modern_physics_score * 100,
        'physical_chemistry': knowledge.physical_chemistry_score * 100,
        'organic_chemistry': knowledge.organic_chemistry_score * 100,
        'inorganic_chemistry': knowledge.inorganic_chemistry_score * 100,
        'algebra': knowledge.algebra_score * 100,
        'calculus': knowledge.calculus_score * 100,
        'coordinate_geometry': knowledge.coordinate_geometry_score * 100,
        'trigonometry': knowledge.trigonometry_score * 100,
        'vectors': knowledge.vectors_score * 100,
        'probability': knowledge.probability_score * 100
    }
    
    # Calculate streak
    streak_days = calculate_streak(db, student.id)
    
    return {
        'student': {
            'id': student.id,
            'email': student.email,
            'username': student.username,
            'full_name': student.full_name,
            'created_at': student.created_at
        },
        'knowledge': {
            # Physics
            'mechanics_score': knowledge.mechanics_score,
            'electromagnetism_score': knowledge.electromagnetism_score,
            'optics_score': knowledge.optics_score,
            'modern_physics_score': knowledge.modern_physics_score,
            # Chemistry
            'physical_chemistry_score': knowledge.physical_chemistry_score,
            'organic_chemistry_score': knowledge.organic_chemistry_score,
            'inorganic_chemistry_score': knowledge.inorganic_chemistry_score,
            # Mathematics
            'algebra_score': knowledge.algebra_score,
            'calculus_score': knowledge.calculus_score,
            'coordinate_geometry_score': knowledge.coordinate_geometry_score,
            'trigonometry_score': knowledge.trigonometry_score,
            'vectors_score': knowledge.vectors_score,
            'probability_score': knowledge.probability_score,
            # Metrics
            'accuracy_rate': knowledge.accuracy_rate,
            'preferred_difficulty': knowledge.preferred_difficulty,
            'learning_style': knowledge.learning_style
        },
        'progress': {
            'total_attempts': knowledge.total_attempts,
            'correct_answers': knowledge.correct_answers,
            'accuracy_rate': knowledge.accuracy_rate,
            'topics_mastered': progress['topics_mastered'],
            'current_streak': streak_days,
            'time_spent_today': time_spent_today,
            'skill_improvements': skill_improvements
        },
        'recent_sessions': session_data
    }


@router.get("/rl-stats")
def get_rl_statistics():
    """Get RL agent statistics"""
    return agent.get_statistics()


@router.get("/performance-chart")
def get_performance_chart(username: str, days: int = 7, db: Session = Depends(get_db)):
    """Get performance data for charting"""
    
    student = db.query(Student).filter(Student.username == username).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get sessions from last N days
    start_date = datetime.now() - timedelta(days=days)
    sessions = db.query(LearningSession).filter(
        LearningSession.student_id == student.id,
        LearningSession.timestamp >= start_date
    ).order_by(LearningSession.timestamp).all()
    
    # Group by day
    daily_data = {}
    for session in sessions:
        day = session.timestamp.date().isoformat()
        if day not in daily_data:
            daily_data[day] = {
                'date': day,
                'attempts': 0,
                'correct': 0,
                'accuracy': 0.0,
                'avg_reward': 0.0,
                'total_reward': 0.0,
                'total_time': 0.0
            }
        
        daily_data[day]['attempts'] += 1
        if session.is_correct:
            daily_data[day]['correct'] += 1
        daily_data[day]['total_time'] += session.time_spent / 60  # minutes
        daily_data[day]['total_reward'] += session.reward if session.reward else 0
    
    # Calculate averages
    for day_data in daily_data.values():
        day_data['accuracy'] = (day_data['correct'] / day_data['attempts'] * 100) if day_data['attempts'] > 0 else 0
        day_data['avg_time'] = day_data['total_time'] / day_data['attempts'] if day_data['attempts'] > 0 else 0
        day_data['avg_reward'] = day_data['total_reward'] / day_data['attempts'] if day_data['attempts'] > 0 else 0
        del day_data['total_reward']  # Remove temporary field
    
    return list(daily_data.values())


def calculate_streak(db: Session, student_id: int) -> int:
    """Calculate consecutive days of activity"""
    
    # Get all unique session dates
    sessions = db.query(
        func.date(LearningSession.timestamp).label('session_date')
    ).filter(
        LearningSession.student_id == student_id
    ).distinct().order_by(func.date(LearningSession.timestamp).desc()).all()
    
    if not sessions:
        return 0
    
    # Check for consecutive days
    streak = 0
    expected_date = datetime.now().date()
    
    for session in sessions:
        session_date = session.session_date
        if isinstance(session_date, str):
            session_date = datetime.fromisoformat(session_date).date()
        
        if session_date == expected_date or session_date == expected_date - timedelta(days=1):
            streak += 1
            expected_date = session_date - timedelta(days=1)
        else:
            break
    
    return streak
