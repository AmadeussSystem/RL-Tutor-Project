"""
Learning session API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Student, Content, LearningSession, StudentKnowledge
from app.models.learning_style import LearningStyleProfile
from app.models.mastery import MasterySkill
from app.models.schemas import SessionStart, AnswerSubmit, SessionResponse, ContentResponse
from app.services.rl_agent import agent
from app.services.student_model import StudentModelService
from typing import Optional
import random
import json

router = APIRouter(prefix="/session", tags=["learning-session"])


def get_current_student_id(username: str, db: Session) -> int:
    """Helper to get student ID from username"""
    student = db.query(Student).filter(Student.username == username).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student.id


@router.post("/start", response_model=ContentResponse)
def start_session(session_data: SessionStart, username: str, db: Session = Depends(get_db)):
    """
    Start a new learning session and get recommended content.
    Validates skill locks if topic is provided.
    """
    student_id = get_current_student_id(username, db)
    
    # **SKILL LOCK VALIDATION**: Check if topic requires unlocked skill
    if session_data.topic:
        # Map topic to skill name (convert underscore to space and capitalize)
        topic_to_skill_map = {
            "sets_and_relations": "Sets and Relations",
            "quadratic_equations": "Quadratic Equations",
            "polynomials": "Polynomials",
            "sequences_and_series": "Sequences and Series",
            "complex_numbers": "Complex Numbers",
            "permutations_and_combinations": "Permutations and Combinations",
            "trigonometric_ratios": "Trigonometric Ratios",
            "trigonometric_identities": "Trigonometric Identities",
            "inverse_trigonometric_functions": "Inverse Trigonometric Functions",
            "straight_lines": "Straight Lines",
            "circles": "Circles",
            "conic_sections": "Conic Sections",
            "limits_and_continuity": "Limits and Continuity",
            "differentiation": "Differentiation",
            "integration": "Integration",
            "mechanics": "Mechanics",
            "waves": "Waves and Oscillations",
            "thermodynamics": "Thermodynamics",
            "electromagnetism": "Electromagnetism",
            "optics": "Optics",
            "physical_chemistry": "Physical Chemistry",
            "inorganic_chemistry": "Inorganic Chemistry",
            "organic_chemistry": "Organic Chemistry",
            "statistics": "Statistics"
        }
        
        skill_name = topic_to_skill_map.get(session_data.topic)
        if skill_name:
            # Check if skill exists and is unlocked
            skill = db.query(MasterySkill).filter(MasterySkill.name == skill_name).first()
            if skill:
                if not skill.is_unlocked_for_student(student_id, db):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Skill '{skill_name}' is locked. Complete prerequisites first."
                    )
    
    # Get student's knowledge state
    knowledge_state = StudentModelService.get_knowledge_state(db, student_id)
    
    # Get available content
    query = db.query(Content)
    
    # Filter by topic if specified
    if session_data.topic:
        query = query.filter(Content.topic == session_data.topic)
    
    # Filter by difficulty if specified
    if session_data.difficulty:
        query = query.filter(Content.difficulty == session_data.difficulty)
    else:
        # Use preferred difficulty from knowledge state (scale 1-10)
        # Start with moderate difficulty (5-6) for new students
        preferred_diff = knowledge_state.get('preferred_difficulty', 5)
        
        # Get content within ±2 difficulty levels for variety
        query = query.filter(Content.difficulty.between(
            max(1, preferred_diff - 2),
            min(10, preferred_diff + 2)
        ))
    
    available_content = query.all()
    
    if not available_content:
        # If no content in preferred range, get any available content
        available_content = db.query(Content).all()
        
    if not available_content:
        raise HTTPException(status_code=404, detail="No content available")
    
    # Get student's learning style
    learning_style_profile = db.query(LearningStyleProfile).filter(
        LearningStyleProfile.student_id == student_id
    ).first()
    
    learning_style = learning_style_profile.dominant_style if learning_style_profile else None
    
    # Use RL agent to recommend content
    content_ids = [c.id for c in available_content]
    
    try:
        recommended_id, confidence = agent.get_recommended_content(
            knowledge_state, 
            content_ids,
            learning_style=learning_style
        )
        recommended_content = db.query(Content).filter(Content.id == recommended_id).first()
    except:
        # Fallback to random selection if agent fails
        recommended_content = random.choice(available_content)
    
    # Parse options from JSON string to list if needed
    if recommended_content and isinstance(recommended_content.options, str):
        try:
            recommended_content.options = json.loads(recommended_content.options)
        except:
            pass  # Keep as string if JSON parsing fails
    
    # Parse tags from JSON string to list if needed
    if recommended_content and isinstance(recommended_content.tags, str):
        try:
            recommended_content.tags = json.loads(recommended_content.tags)
        except:
            pass
    
    return recommended_content


@router.post("/answer", response_model=SessionResponse)
def submit_answer(answer_data: AnswerSubmit, username: str, db: Session = Depends(get_db)):
    """
    Submit an answer and get feedback with next content
    """
    student_id = get_current_student_id(username, db)
    
    # Get the content for this session
    # Note: In production, session_id should track actual session object
    # For MVP, we'll use content_id directly
    content_id = answer_data.session_id  # Simplified for MVP
    
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if answer is correct
    is_correct = answer_data.student_answer.strip().lower() == content.correct_answer.strip().lower()
    
    # Get current knowledge state (before update)
    state_before = StudentModelService.get_knowledge_state(db, student_id)
    
    # Calculate reward using RL agent
    reward = agent.calculate_reward(
        is_correct=is_correct,
        time_spent=answer_data.time_spent,
        difficulty=content.difficulty,
        student_level=state_before.get('accuracy_rate', 0.5)
    )
    
    # Update student knowledge
    updated_knowledge = StudentModelService.update_knowledge(
        db=db,
        student_id=student_id,
        topic=content.topic,
        is_correct=is_correct,
        difficulty=content.difficulty,
        time_spent=answer_data.time_spent
    )
    
    # Get state after update
    state_after = StudentModelService.get_knowledge_state(db, student_id)
    
    # Create learning session record
    session = LearningSession(
        student_id=student_id,
        content_id=content.id,
        student_answer=answer_data.student_answer,
        is_correct=is_correct,
        time_spent=answer_data.time_spent,
        attempts=1,
        state_before=state_before,
        action_taken={'content_id': content.id, 'difficulty': content.difficulty},
        reward=reward,
        state_after=state_after
    )
    
    db.add(session)
    db.commit()
    
    # Update RL agent Q-table
    state_idx = agent._discretize_state(state_before)
    next_state_idx = agent._discretize_state(state_after)
    agent.update_q_value(state_idx, content.id % agent.num_actions, reward, next_state_idx)
    
    # Get next recommended content
    available_content = db.query(Content).filter(Content.topic == content.topic).all()
    content_ids = [c.id for c in available_content]
    
    try:
        next_content_id, _ = agent.get_recommended_content(state_after, content_ids)
        next_content = db.query(Content).filter(Content.id == next_content_id).first()
    except:
        next_content = random.choice(available_content) if available_content else None
    
    # Parse options and tags from JSON string to list if needed
    if next_content:
        if isinstance(next_content.options, str):
            try:
                next_content.options = json.loads(next_content.options)
            except:
                pass
        if isinstance(next_content.tags, str):
            try:
                next_content.tags = json.loads(next_content.tags)
            except:
                pass
    
    return SessionResponse(
        id=session.id,
        content_id=content.id,
        is_correct=is_correct,
        reward=reward,
        explanation=content.explanation if not is_correct else "Correct! Well done!",
        next_content=next_content
    )


@router.get("/progress")
def get_progress(username: str, db: Session = Depends(get_db)):
    """Get student's learning progress"""
    student_id = get_current_student_id(username, db)
    
    # Get progress summary
    progress = StudentModelService.get_progress_summary(db, student_id)
    
    # Get recent sessions
    recent_sessions = db.query(LearningSession).filter(
        LearningSession.student_id == student_id
    ).order_by(LearningSession.timestamp.desc()).limit(10).all()
    
    session_data = [{
        'content_id': s.content_id,
        'is_correct': s.is_correct,
        'reward': s.reward,
        'time_spent': s.time_spent,
        'timestamp': s.timestamp.isoformat()
    } for s in recent_sessions]
    
    return {
        'progress': progress,
        'recent_sessions': session_data
    }
