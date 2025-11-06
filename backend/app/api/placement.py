"""
Placement Test API - Initial skill assessment for new students
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_student
from app.models.models import Student, Content
from app.models.mastery import MasterySkill, StudentMastery

router = APIRouter(prefix="/placement", tags=["placement"])


class PlacementAnswer(BaseModel):
    skill_name: str
    question_id: int
    selected_answer: str
    time_spent: int = 0


class PlacementTestResult(BaseModel):
    answers: List[PlacementAnswer]


@router.get("/test/questions")
def get_placement_questions(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    """
    Get placement test questions covering key foundational skills.
    Returns 1-2 questions per major skill category.
    """
    # Get all beginner-level skills (entry points)
    beginner_skills = db.query(MasterySkill).filter(
        MasterySkill.difficulty == "beginner"
    ).all()
    
    questions = []
    
    for skill in beginner_skills:
        # Map skill to topic
        skill_to_topic_map = {
            "Sets and Relations": "sets_and_relations",
            "Quadratic Equations": "quadratic_equations",
            "Trigonometric Ratios": "trigonometric_ratios",
            "Straight Lines": "straight_lines",
            "Limits and Continuity": "limits_and_continuity",
        }
        
        topic = skill_to_topic_map.get(skill.name)
        if topic:
            # Get 1 question for this skill
            content = db.query(Content).filter(
                Content.topic == topic,
                Content.difficulty <= 3  # Easy questions only
            ).first()
            
            if content:
                questions.append({
                    "skill_id": skill.id,
                    "skill_name": skill.name,
                    "category": skill.category,
                    "question": {
                        "id": content.id,
                        "title": content.title,
                        "question_text": content.question_text,
                        "options": content.options,
                        "difficulty": content.difficulty
                    }
                })
    
    return {
        "message": "Placement test questions",
        "total_questions": len(questions),
        "questions": questions,
        "instructions": "Answer these questions to determine your starting skill levels. Don't worry if you don't know all answers - this helps us personalize your learning path!"
    }


@router.post("/test/submit")
def submit_placement_test(
    results: PlacementTestResult,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    """
    Submit placement test results and unlock appropriate skills.
    Sets initial mastery levels based on performance.
    """
    try:
        student_id = current_student.id
        
        print(f"Processing placement test for student {student_id}")
        print(f"Received {len(results.answers)} answers")
        
        # Calculate skill mastery levels based on answers
        skill_performance: Dict[str, int] = {}  # skill_name -> correct_count
        
        for answer in results.answers:
            skill_name = answer.skill_name
            
            print(f"Processing answer for skill: {skill_name}, question_id: {answer.question_id}, selected: {answer.selected_answer}")
            
            # Validate answer by checking against database
            content = db.query(Content).filter(Content.id == answer.question_id).first()
            
            if not content:
                print(f"WARNING: Content not found for question_id {answer.question_id}")
                continue
            
            print(f"Question correct answer: {content.correct_answer}")
            
            # Check if answer is correct
            is_correct = (answer.selected_answer == content.correct_answer)
            
            print(f"Answer is {'correct' if is_correct else 'incorrect'}")
            
            if skill_name not in skill_performance:
                skill_performance[skill_name] = 0
            
            if is_correct:
                skill_performance[skill_name] += 1
        
        # Update StudentMastery records
        unlocked_skills = []
        
        for skill_name, correct_count in skill_performance.items():
            skill = db.query(MasterySkill).filter(MasterySkill.name == skill_name).first()
            
            if not skill:
                continue
            
            # Determine mastery level (1-5)
            # If they got it right, start at level 2 (Basic) or 3 (Proficient)
            # If wrong, start at level 1 (Novice)
            if correct_count > 0:
                mastery_level = 3  # Proficient - unlock this and dependent skills
                total_attempts = 1
                correct_attempts = 1
            else:
                mastery_level = 1  # Novice - needs practice
                total_attempts = 1
                correct_attempts = 0
            
            # Check if mastery record exists
            existing_mastery = db.query(StudentMastery).filter(
                StudentMastery.student_id == student_id,
                StudentMastery.skill_id == skill.id
            ).first()
            
            if existing_mastery:
                # Update existing
                existing_mastery.mastery_level = mastery_level
                existing_mastery.total_attempts = total_attempts
                existing_mastery.correct_attempts = correct_attempts
                existing_mastery.accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
            else:
                # Create new
                new_mastery = StudentMastery(
                    student_id=student_id,
                    skill_id=skill.id,
                    mastery_level=mastery_level,
                    total_attempts=total_attempts,
                    correct_attempts=correct_attempts,
                    accuracy=(correct_attempts / total_attempts * 100) if total_attempts > 0 else 0,
                    total_practice_time=sum(a.time_spent for a in results.answers if a.skill_name == skill_name) // 60
                )
                db.add(new_mastery)
            
            if mastery_level >= 3:
                unlocked_skills.append({
                    "id": skill.id,
                    "name": skill.name,
                    "category": skill.category,
                    "mastery_level": mastery_level
                })
        
        db.commit()
        
        return {
            "message": "Placement test completed successfully",
            "unlocked_skills": unlocked_skills,
            "total_unlocked": len(unlocked_skills),
            "recommendation": "Start with locked skills to learn new concepts, or practice unlocked skills to master them!"
        }
    except Exception as e:
        print(f"ERROR in submit_placement_test: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process placement test: {str(e)}"
        )
@router.get("/status")
def get_placement_status(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    """
    Check if student has completed placement test.
    """
    student_id = current_student.id
    
    # Check if student has any mastery records
    mastery_count = db.query(StudentMastery).filter(
        StudentMastery.student_id == student_id
    ).count()
    
    return {
        "completed": mastery_count > 0,
        "mastery_records": mastery_count
    }
