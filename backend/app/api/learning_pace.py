"""
Learning Pace API Endpoints
Tracks and analyzes student learning speed and adjusts difficulty accordingly
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import statistics

from app.core.database import get_db
from app.models.models import Student, LearningSession
from app.models.learning_pace import LearningPace, ConceptTimeLog
from app.api.auth import get_current_student

router = APIRouter(prefix="/learning-pace", tags=["learning-pace"])


# Baseline concept completion times (in seconds) - JEE Topics
BASELINE_TIMES = {
    # Physics
    "mechanics": 240,  # 4 minutes
    "electromagnetism": 260,  # 4.3 minutes
    "optics": 220,  # 3.7 minutes
    "modern_physics": 280,  # 4.7 minutes
    # Chemistry
    "physical_chemistry": 240,  # 4 minutes
    "organic_chemistry": 260,  # 4.3 minutes
    "inorganic_chemistry": 240,  # 4 minutes
    # Mathematics
    "algebra": 180,  # 3 minutes
    "calculus": 240,  # 4 minutes
    "coordinate_geometry": 220,  # 3.7 minutes
    "trigonometry": 200,  # 3.3 minutes
    "vectors": 200,  # 3.3 minutes
    "probability": 220,  # 3.7 minutes
    # Default
    "default": 240
}


def calculate_pace_metrics(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Calculate learning pace metrics from session history
    
    Returns:
        Dict with avg_speed, avg_time, completion_rate, time_by_concept
    """
    # Get all sessions for student
    sessions = db.query(LearningSession).filter(
        LearningSession.student_id == student_id
    ).all()
    
    if not sessions:
        return {
            "avg_speed": 1.0,
            "avg_time_per_concept": 0,
            "completion_rate": 0,
            "total_concepts": 0,
            "time_by_concept": {}
        }
    
    # Calculate time by concept
    time_by_concept = {}
    valid_sessions = []
    
    for session in sessions:
        # Get time spent (support both fields)
        time_spent = session.time_spent_seconds or session.time_spent or 0
        if time_spent <= 0:
            continue
            
        valid_sessions.append(session)
        concept = session.concept_name or "general"
        
        if concept not in time_by_concept:
            time_by_concept[concept] = []
        time_by_concept[concept].append(time_spent)
    
    if not valid_sessions:
        return {
            "avg_speed": 1.0,
            "avg_time_per_concept": 0,
            "completion_rate": 0,
            "total_concepts": 0,
            "time_by_concept": {}
        }
    
    # Calculate average time per concept
    avg_times = {}
    for concept, times in time_by_concept.items():
        avg_times[concept] = statistics.mean(times)
    
    # Calculate overall average speed compared to baseline
    speed_ratios = []
    for concept, avg_time in avg_times.items():
        baseline = BASELINE_TIMES.get(concept, BASELINE_TIMES["default"])
        # Speed = baseline / actual (faster students have higher values)
        speed = baseline / avg_time if avg_time > 0 else 1.0
        speed_ratios.append(speed)
    
    avg_speed = statistics.mean(speed_ratios) if speed_ratios else 1.0
    
    # Calculate completion rate (accuracy)
    total_sessions = len(valid_sessions)
    correct_sessions = sum(1 for s in valid_sessions if s.is_correct)
    completion_rate = (correct_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    # Calculate overall average time
    all_times = [session.time_spent_seconds or session.time_spent or 0 
                 for session in valid_sessions]
    all_times = [t for t in all_times if t > 0]
    avg_time = statistics.mean(all_times) if all_times else 0
    
    return {
        "avg_speed": round(avg_speed, 2),
        "avg_time_per_concept": round(avg_time, 1),
        "completion_rate": round(completion_rate, 1),
        "total_concepts": total_sessions,
        "time_by_concept": {k: round(v, 1) for k, v in avg_times.items()}
    }


@router.post("/analyze")
async def analyze_learning_pace(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Analyze student's learning pace and create/update LearningPace profile
    
    Analyzes:
    - Average speed compared to baseline
    - Time spent per concept
    - Completion rate
    - Recommended difficulty adjustment
    """
    # Calculate pace metrics
    metrics = calculate_pace_metrics(current_student.id, db)
    
    # Get or create LearningPace record
    pace = db.query(LearningPace).filter(
        LearningPace.student_id == current_student.id
    ).first()
    
    if not pace:
        pace = LearningPace(student_id=current_student.id)
        db.add(pace)
    
    # Update pace metrics
    pace.avg_speed = metrics["avg_speed"]
    pace.avg_time_per_concept_seconds = metrics["avg_time_per_concept"]
    pace.completion_rate = metrics["completion_rate"]
    pace.total_concepts_completed = metrics["total_concepts"]
    pace.time_on_task_data = metrics["time_by_concept"]
    pace.last_analyzed = datetime.utcnow()
    
    # Determine if difficulty should be adjusted
    old_difficulty = pace.difficulty_preference
    
    if pace.should_increase_difficulty():
        pace.difficulty_preference = min(10, pace.difficulty_preference + 1)
        adjustment_reason = "High speed and completion rate - increasing difficulty"
    elif pace.should_decrease_difficulty():
        pace.difficulty_preference = max(1, pace.difficulty_preference - 1)
        adjustment_reason = "Low speed or completion rate - decreasing difficulty"
    else:
        adjustment_reason = "No adjustment needed"
    
    # Log adjustment if difficulty changed
    if old_difficulty != pace.difficulty_preference:
        if not pace.adjustment_history:
            pace.adjustment_history = []
        pace.adjustment_history.append({
            "date": datetime.utcnow().isoformat(),
            "from_difficulty": old_difficulty,
            "to_difficulty": pace.difficulty_preference,
            "reason": adjustment_reason
        })
    
    pace.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pace)
    
    return {
        "student_id": current_student.id,
        "pace_category": pace.get_pace_category(),
        "avg_speed": pace.avg_speed,
        "difficulty_preference": pace.difficulty_preference,
        "fast_track_mode": pace.fast_track_mode,
        "deep_dive_mode": pace.deep_dive_mode,
        "completion_rate": pace.completion_rate,
        "total_concepts_completed": pace.total_concepts_completed,
        "avg_time_per_concept_seconds": pace.avg_time_per_concept_seconds,
        "recommended_difficulty": pace.get_recommended_difficulty(),
        "adjustment_made": old_difficulty != pace.difficulty_preference,
        "adjustment_reason": adjustment_reason,
        "time_by_concept": pace.time_on_task_data,
        "last_analyzed": pace.last_analyzed.isoformat()
    }


@router.get("/profile")
async def get_learning_pace_profile(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get learning pace profile for the current authenticated student
    """
    pace = db.query(LearningPace).filter(
        LearningPace.student_id == current_student.id
    ).first()
    
    if not pace:
        # Create default pace profile
        pace = LearningPace(student_id=current_student.id)
        db.add(pace)
        db.commit()
        db.refresh(pace)
    
    return {
        "student_id": pace.student_id,
        "avg_speed": pace.avg_speed or 1.0,
        "avg_time_per_concept_seconds": pace.avg_time_per_concept_seconds or 0,
        "fast_track_mode": pace.fast_track_mode or False,
        "deep_dive_mode": pace.deep_dive_mode or False,
        "difficulty_preference": pace.difficulty_preference or 5,
        "pace_category": pace.get_pace_category(),
        "total_concepts_completed": pace.total_concepts_completed or 0,
        "completion_rate": pace.completion_rate or 0,
        "last_analyzed": pace.last_analyzed.isoformat() if pace.last_analyzed else None,
        "created_at": pace.created_at.isoformat() if pace.created_at else None,
        "updated_at": pace.updated_at.isoformat() if pace.updated_at else None
    }


@router.get("/students/{student_id}")
async def get_learning_pace(
    student_id: int,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get learning pace profile for a student
    """
    # Verify access
    if current_student.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student's pace data"
        )
    
    pace = db.query(LearningPace).filter(
        LearningPace.student_id == student_id
    ).first()
    
    if not pace:
        # Create default pace profile
        pace = LearningPace(student_id=student_id)
        db.add(pace)
        db.commit()
        db.refresh(pace)
    
    return {
        "student_id": pace.student_id,
        "pace_category": pace.get_pace_category(),
        "avg_speed": pace.avg_speed,
        "difficulty_preference": pace.difficulty_preference,
        "fast_track_mode": pace.fast_track_mode,
        "deep_dive_mode": pace.deep_dive_mode,
        "completion_rate": pace.completion_rate,
        "total_concepts_completed": pace.total_concepts_completed,
        "avg_time_per_concept_seconds": pace.avg_time_per_concept_seconds,
        "recommended_difficulty": pace.get_recommended_difficulty(),
        "time_by_concept": pace.time_on_task_data or {},
        "adjustment_history": pace.adjustment_history or [],
        "last_analyzed": pace.last_analyzed.isoformat() if pace.last_analyzed else None,
        "created_at": pace.created_at.isoformat(),
        "updated_at": pace.updated_at.isoformat()
    }


@router.post("/preferences")
async def update_preferences(
    fast_track_mode: Optional[bool] = None,
    deep_dive_mode: Optional[bool] = None,
    difficulty_preference: Optional[int] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Update the current authenticated student's learning pace preferences
    """
    # Get or create pace profile
    pace = db.query(LearningPace).filter(
        LearningPace.student_id == current_student.id
    ).first()
    
    if not pace:
        pace = LearningPace(student_id=current_student.id)
        db.add(pace)
    
    # Update preferences
    if fast_track_mode is not None:
        pace.fast_track_mode = fast_track_mode
        if fast_track_mode:
            pace.deep_dive_mode = False  # Mutually exclusive
    
    if deep_dive_mode is not None:
        pace.deep_dive_mode = deep_dive_mode
        if deep_dive_mode:
            pace.fast_track_mode = False  # Mutually exclusive
    
    if difficulty_preference is not None:
        pace.difficulty_preference = difficulty_preference
    
    pace.last_updated = datetime.now()
    db.commit()
    db.refresh(pace)
    
    return {"message": "Preferences updated", "pace": pace}


@router.post("/students/{student_id}/preferences")
async def update_pace_preferences(
    student_id: int,
    fast_track_mode: Optional[bool] = None,
    deep_dive_mode: Optional[bool] = None,
    difficulty_preference: Optional[int] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Update student's learning pace preferences
    
    Body:
        fast_track_mode: Enable accelerated learning
        deep_dive_mode: Enable thorough learning
        difficulty_preference: Manual difficulty setting (1-10)
    """
    # Verify access
    if current_student.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this student's preferences"
        )
    
    # Get or create pace profile
    pace = db.query(LearningPace).filter(
        LearningPace.student_id == student_id
    ).first()
    
    if not pace:
        pace = LearningPace(student_id=student_id)
        db.add(pace)
    
    # Update preferences
    if fast_track_mode is not None:
        pace.fast_track_mode = fast_track_mode
        if fast_track_mode:
            pace.deep_dive_mode = False  # Mutually exclusive
    
    if deep_dive_mode is not None:
        pace.deep_dive_mode = deep_dive_mode
        if deep_dive_mode:
            pace.fast_track_mode = False  # Mutually exclusive
    
    if difficulty_preference is not None:
        if not 1 <= difficulty_preference <= 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Difficulty preference must be between 1 and 10"
            )
        pace.difficulty_preference = difficulty_preference
    
    pace.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pace)
    
    return {
        "message": "Preferences updated successfully",
        "fast_track_mode": pace.fast_track_mode,
        "deep_dive_mode": pace.deep_dive_mode,
        "difficulty_preference": pace.difficulty_preference,
        "recommended_difficulty": pace.get_recommended_difficulty()
    }


@router.get("/difficulty-adjustment")
async def get_difficulty_adjustment(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get recommended difficulty adjustment based on recent performance
    
    Returns:
        - current_difficulty
        - recommended_difficulty
        - adjustment_reason
        - should_increase
        - should_decrease
    """
    pace = db.query(LearningPace).filter(
        LearningPace.student_id == current_student.id
    ).first()
    
    if not pace:
        # Analyze pace first
        metrics = calculate_pace_metrics(current_student.id, db)
        pace = LearningPace(
            student_id=current_student.id,
            avg_speed=metrics["avg_speed"],
            completion_rate=metrics["completion_rate"]
        )
        db.add(pace)
        db.commit()
        db.refresh(pace)
    
    should_increase = pace.should_increase_difficulty()
    should_decrease = pace.should_decrease_difficulty()
    
    if should_increase:
        reason = f"Great job! You're performing well (speed: {pace.avg_speed:.1f}x, {pace.completion_rate:.0f}% completion). Try harder content!"
        recommended = min(10, pace.difficulty_preference + 1)
    elif should_decrease:
        reason = f"Let's adjust the difficulty (speed: {pace.avg_speed:.1f}x, {pace.completion_rate:.0f}% completion). Try easier content to build confidence."
        recommended = max(1, pace.difficulty_preference - 1)
    else:
        reason = "Current difficulty seems appropriate for your pace and performance."
        recommended = pace.difficulty_preference
    
    return {
        "student_id": current_student.id,
        "current_difficulty": pace.difficulty_preference,
        "recommended_difficulty": recommended,
        "should_increase": should_increase,
        "should_decrease": should_decrease,
        "adjustment_reason": reason,
        "pace_category": pace.get_pace_category(),
        "avg_speed": pace.avg_speed,
        "completion_rate": pace.completion_rate
    }


@router.get("/time-analytics")
async def get_time_analytics(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
    days: int = 7
):
    """
    Get detailed time analytics for the last N days
    
    Returns:
        - daily_time_spent
        - time_by_concept
        - time_by_difficulty
        - peak_learning_hours
    """
    # Get sessions from last N days
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    sessions = db.query(LearningSession).filter(
        LearningSession.student_id == current_student.id,
        LearningSession.timestamp >= cutoff_date
    ).all()
    
    if not sessions:
        return {
            "daily_time_spent": [],
            "time_by_concept": {},
            "time_by_difficulty": {},
            "peak_learning_hours": [],
            "total_time_seconds": 0
        }
    
    # Calculate daily time spent
    daily_time = {}
    for session in sessions:
        time_spent = session.time_spent_seconds or session.time_spent or 0
        date_key = session.timestamp.date().isoformat()
        if date_key not in daily_time:
            daily_time[date_key] = 0
        daily_time[date_key] += time_spent
    
    # Calculate time by concept (JEE topics)
    time_by_concept = {}
    for session in sessions:
        time_spent = session.time_spent_seconds or session.time_spent or 0
        concept = session.concept_name or "general"
        if concept not in time_by_concept:
            time_by_concept[concept] = 0
        time_by_concept[concept] += time_spent
    
    # Calculate time by difficulty
    time_by_difficulty = {}
    for session in sessions:
        time_spent = session.time_spent_seconds or session.time_spent or 0
        if session.content:
            diff = session.content.difficulty or 3
            if diff not in time_by_difficulty:
                time_by_difficulty[diff] = 0
            time_by_difficulty[diff] += time_spent
    
    # Find peak learning hours
    hour_counts = {}
    for session in sessions:
        hour = session.timestamp.hour
        if hour not in hour_counts:
            hour_counts[hour] = 0
        hour_counts[hour] += 1
    
    peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    peak_hours_list = [f"{hour:02d}:00" for hour, _ in peak_hours]
    
    total_time = sum(s.time_spent_seconds or s.time_spent or 0 for s in sessions)
    
    return {
        "daily_time_spent": [
            {"date": date, "seconds": seconds, "minutes": round(seconds/60, 1)}
            for date, seconds in sorted(daily_time.items())
        ],
        "time_by_concept": {
            concept: {"seconds": seconds, "minutes": round(seconds/60, 1)}
            for concept, seconds in time_by_concept.items()
        },
        "time_by_difficulty": {
            str(diff): {"seconds": seconds, "minutes": round(seconds/60, 1)}
            for diff, seconds in time_by_difficulty.items()
        },
        "peak_learning_hours": peak_hours_list,
        "total_time_seconds": total_time,
        "total_time_minutes": round(total_time / 60, 1),
        "total_time_hours": round(total_time / 3600, 2),
        "days_analyzed": days
    }
