"""
Phase 13: Mastery-Based Progression Models
- Skill tree with competency-based learning paths
- Micro-credentials and badge system
- Personalized study plans
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
import json

from app.core.database import Base


# Association table for skill prerequisites (many-to-many)
skill_prerequisites = Table(
    'skill_prerequisites',
    Base.metadata,
    Column('skill_id', Integer, ForeignKey('mastery_skills.id'), primary_key=True),
    Column('prerequisite_id', Integer, ForeignKey('mastery_skills.id'), primary_key=True)
)


class MasterySkill(Base):
    """
    Represents a skill in the learning tree.
    Skills form a DAG (Directed Acyclic Graph) with prerequisites.
    """
    __tablename__ = "mastery_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    category = Column(String)  # e.g., "Algebra", "Geometry", "Calculus"
    difficulty = Column(String)  # "beginner", "intermediate", "advanced", "expert"
    estimated_hours = Column(Float, default=1.0)  # Estimated time to master
    
    # DAG structure - prerequisites
    prerequisites = relationship(
        "app.models.mastery.MasterySkill",
        secondary=skill_prerequisites,
        primaryjoin=(id == skill_prerequisites.c.skill_id),
        secondaryjoin=(id == skill_prerequisites.c.prerequisite_id),
        backref="unlocks"  # Skills that this skill unlocks
    )
    
    # Mastery tracking
    student_mastery = relationship("app.models.mastery.StudentMastery", back_populates="skill")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def is_unlocked_for_student(self, student_id: int, db) -> bool:
        """
        Check if this skill is unlocked for a student.
        A skill is unlocked if all its prerequisites are mastered.
        """
        if not self.prerequisites:
            return True  # No prerequisites, always unlocked
        
        for prereq in self.prerequisites:
            mastery = db.query(StudentMastery).filter(
                StudentMastery.student_id == student_id,
                StudentMastery.skill_id == prereq.id,
                StudentMastery.mastery_level >= 3  # Need at least level 3 (Proficient)
            ).first()
            
            if not mastery:
                return False
        
        return True
    
    def get_prerequisite_ids(self) -> List[int]:
        """Get list of prerequisite skill IDs"""
        return [skill.id for skill in self.prerequisites]
    
    def to_dict(self, include_prerequisites: bool = False) -> Dict:
        """Convert to dictionary representation"""
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "difficulty": self.difficulty,
            "estimated_hours": self.estimated_hours,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_prerequisites:
            data["prerequisite_ids"] = self.get_prerequisite_ids()
        
        return data


class StudentMastery(Base):
    """
    Tracks student mastery level for each skill.
    Mastery levels: 0=Not Started, 1=Beginner, 2=Developing, 3=Proficient, 4=Advanced, 5=Master
    """
    __tablename__ = "student_mastery"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("mastery_skills.id"), nullable=False)
    
    # Mastery tracking
    mastery_level = Column(Integer, default=0)  # 0-5 scale
    progress_percentage = Column(Float, default=0.0)  # 0-100
    total_practice_time = Column(Integer, default=0)  # Minutes spent practicing
    
    # Evidence of mastery
    correct_attempts = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)  # Percentage
    
    # Assessment history
    last_assessed_at = Column(DateTime)
    last_assessment_score = Column(Float)
    
    # Metadata
    unlocked_at = Column(DateTime, default=datetime.now)
    mastered_at = Column(DateTime)  # When reached level 5
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    student = relationship("app.models.models.Student", back_populates="skill_mastery")
    skill = relationship("app.models.mastery.MasterySkill", back_populates="student_mastery")
    
    def update_mastery(self, correct: bool, time_spent: int = 0):
        """
        Update mastery level based on performance.
        Uses accuracy and practice time to calculate mastery.
        """
        # Initialize defaults if None (for newly created records)
        if self.total_attempts is None:
            self.total_attempts = 0
        if self.correct_attempts is None:
            self.correct_attempts = 0
        if self.total_practice_time is None:
            self.total_practice_time = 0
        if self.mastery_level is None:
            self.mastery_level = 0
        if self.accuracy is None:
            self.accuracy = 0.0
        
        # Update attempts
        self.total_attempts += 1
        if correct:
            self.correct_attempts += 1
        
        # Update accuracy
        self.accuracy = (self.correct_attempts / self.total_attempts * 100) if self.total_attempts > 0 else 0
        
        # Update practice time
        self.total_practice_time += time_spent
        
        # Calculate mastery level based on accuracy and attempts
        if self.accuracy >= 95 and self.total_attempts >= 20:
            self.mastery_level = 5  # Master
            if not self.mastered_at:
                self.mastered_at = datetime.now()
        elif self.accuracy >= 85 and self.total_attempts >= 15:
            self.mastery_level = 4  # Advanced
        elif self.accuracy >= 75 and self.total_attempts >= 10:
            self.mastery_level = 3  # Proficient
        elif self.accuracy >= 60 and self.total_attempts >= 5:
            self.mastery_level = 2  # Developing
        elif self.total_attempts >= 1:
            self.mastery_level = 1  # Beginner
        else:
            self.mastery_level = 0  # Not Started
        
        # Update progress percentage (normalized to 0-100)
        self.progress_percentage = min(100, (self.mastery_level / 5.0) * 100)
        
        self.last_assessed_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "skill_id": self.skill_id,
            "mastery_level": self.mastery_level,
            "progress_percentage": self.progress_percentage,
            "total_practice_time": self.total_practice_time,
            "correct_attempts": self.correct_attempts,
            "total_attempts": self.total_attempts,
            "accuracy": round(self.accuracy, 2),
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
            "mastered_at": self.mastered_at.isoformat() if self.mastered_at else None,
            "last_assessed_at": self.last_assessed_at.isoformat() if self.last_assessed_at else None,
        }


class Badge(Base):
    """
    Represents a badge/credential that can be earned.
    Examples: "Algebra Master", "10-Day Streak", "Perfect Score"
    """
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    category = Column(String)  # "mastery", "streak", "achievement", "social"
    tier = Column(String)  # "bronze", "silver", "gold", "platinum"
    
    # Visual
    icon = Column(String)  # Icon name or emoji
    color = Column(String)  # Hex color code
    image_url = Column(String)  # URL to badge image
    
    # Criteria (stored as JSON)
    criteria = Column(JSON)  # e.g., {"mastery_level": 5, "skill_count": 10}
    points = Column(Integer, default=0)  # Gamification points
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    student_badges = relationship("app.models.mastery.StudentBadge", back_populates="badge")
    
    def check_criteria(self, student_data: Dict) -> bool:
        """
        Check if student meets badge criteria.
        student_data should contain all relevant stats.
        """
        if not self.criteria:
            return False
        
        # Example criteria checks
        for key, required_value in self.criteria.items():
            student_value = student_data.get(key, 0)
            
            if isinstance(required_value, dict):
                # Handle complex criteria like {">=": 10}
                operator = list(required_value.keys())[0]
                threshold = required_value[operator]
                
                if operator == ">=":
                    if student_value < threshold:
                        return False
                elif operator == "==":
                    if student_value != threshold:
                        return False
                elif operator == ">":
                    if student_value <= threshold:
                        return False
            else:
                # Simple equality check
                if student_value < required_value:
                    return False
        
        return True
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "tier": self.tier,
            "icon": self.icon,
            "color": self.color,
            "image_url": self.image_url,
            "criteria": self.criteria,
            "points": self.points,
        }


class StudentBadge(Base):
    """
    Tracks badges earned by students.
    """
    __tablename__ = "student_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    
    # Evidence and verification
    earned_at = Column(DateTime, default=datetime.now)
    evidence = Column(JSON)  # Snapshot of stats when earned
    verification_code = Column(String, unique=True)  # For certificate verification
    
    # Sharing
    is_public = Column(Boolean, default=True)
    shared_count = Column(Integer, default=0)
    
    # Relationships
    student = relationship("app.models.models.Student", back_populates="badges")
    badge = relationship("app.models.mastery.Badge", back_populates="student_badges")
    
    def generate_verification_code(self) -> str:
        """Generate unique verification code for certificate"""
        import hashlib
        import secrets
        
        data = f"{self.student_id}-{self.badge_id}-{secrets.token_hex(8)}"
        code = hashlib.sha256(data.encode()).hexdigest()[:12].upper()
        return code
    
    def to_dict(self, include_badge: bool = False) -> Dict:
        """Convert to dictionary representation"""
        data = {
            "id": self.id,
            "student_id": self.student_id,
            "badge_id": self.badge_id,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
            "evidence": self.evidence,
            "verification_code": self.verification_code,
            "is_public": self.is_public,
        }
        
        if include_badge and self.badge:
            data["badge"] = self.badge.to_dict()
        
        return data


class StudyPlan(Base):
    """
    Personalized study plan generated for a student.
    Can be goal-based (e.g., "Master Calculus in 3 months") or time-based.
    """
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    
    # Plan details
    title = Column(String, nullable=False)
    description = Column(Text)
    goal_type = Column(String)  # "skill_mastery", "exam_prep", "daily_practice", "badge_collection"
    
    # Target
    target_skills = Column(JSON)  # List of skill IDs to master
    target_date = Column(DateTime)
    daily_minutes = Column(Integer, default=30)  # Recommended daily study time
    
    # Schedule (stored as JSON)
    schedule = Column(JSON)  # Daily/weekly breakdown of topics
    
    # Progress tracking
    progress_percentage = Column(Float, default=0.0)
    completed_tasks = Column(Integer, default=0)
    total_tasks = Column(Integer, default=0)
    
    # Adaptive adjustments
    adjustment_count = Column(Integer, default=0)
    last_adjusted_at = Column(DateTime)
    performance_trend = Column(String)  # "ahead", "on_track", "behind"
    
    # Status
    status = Column(String, default="active")  # "active", "completed", "abandoned"
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    completed_at = Column(DateTime)
    
    # Relationships
    student = relationship("app.models.models.Student", back_populates="study_plans")
    
    def calculate_progress(self, db) -> float:
        """
        Calculate progress percentage based on skill mastery.
        """
        if not self.target_skills or len(self.target_skills) == 0:
            return 0.0
        
        total_progress = 0.0
        for skill_id in self.target_skills:
            mastery = db.query(StudentMastery).filter(
                StudentMastery.student_id == self.student_id,
                StudentMastery.skill_id == skill_id
            ).first()
            
            if mastery:
                total_progress += mastery.progress_percentage
        
        self.progress_percentage = total_progress / len(self.target_skills)
        return self.progress_percentage
    
    def adjust_schedule(self, performance_data: Dict):
        """
        Adjust study plan based on performance.
        If student is ahead, can increase difficulty or add more topics.
        If student is behind, can reduce workload or focus on fundamentals.
        """
        self.adjustment_count += 1
        self.last_adjusted_at = datetime.now()
        
        # Determine performance trend
        if self.progress_percentage > self.expected_progress():
            self.performance_trend = "ahead"
        elif self.progress_percentage < self.expected_progress() - 10:
            self.performance_trend = "behind"
        else:
            self.performance_trend = "on_track"
        
        self.updated_at = datetime.now()
    
    def expected_progress(self) -> float:
        """
        Calculate expected progress percentage based on time elapsed.
        """
        if not self.target_date or not self.created_at:
            return 0.0
        
        total_duration = (self.target_date - self.created_at).total_seconds()
        elapsed_duration = (datetime.now() - self.created_at).total_seconds()
        
        if total_duration <= 0:
            return 100.0
        
        return min(100.0, (elapsed_duration / total_duration) * 100)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "title": self.title,
            "description": self.description,
            "goal_type": self.goal_type,
            "target_skills": self.target_skills,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "daily_minutes": self.daily_minutes,
            "schedule": self.schedule,
            "progress_percentage": round(self.progress_percentage, 2),
            "completed_tasks": self.completed_tasks,
            "total_tasks": self.total_tasks,
            "adjustment_count": self.adjustment_count,
            "performance_trend": self.performance_trend,
            "status": self.status,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "target_date": self.target_date.isoformat() if self.target_date else None,
        }
