"""
Mastery Service
Handles skill tree navigation, mastery assessment, and progression logic.
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Set, Optional
from datetime import datetime, timedelta
import random

from app.models.mastery import MasterySkill, StudentMastery, Badge, StudentBadge, StudyPlan


class MasteryService:
    """
    Service for managing skill mastery and competency-based progression.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_skill_tree(self, student_id: Optional[int] = None) -> Dict:
        """
        Get complete skill tree with optional student progress.
        Returns tree structure with nodes and edges.
        """
        skills = self.db.query(MasterySkill).all()
        
        # Build nodes
        nodes = []
        for skill in skills:
            node = skill.to_dict(include_prerequisites=True)
            
            # Add student progress if provided
            if student_id:
                mastery = self.db.query(StudentMastery).filter(
                    StudentMastery.student_id == student_id,
                    StudentMastery.skill_id == skill.id
                ).first()
                
                node["is_unlocked"] = skill.is_unlocked_for_student(student_id, self.db)
                node["mastery_level"] = mastery.mastery_level if mastery else 0
                node["progress_percentage"] = mastery.progress_percentage if mastery else 0.0
            else:
                node["is_unlocked"] = len(skill.prerequisites) == 0
                node["mastery_level"] = 0
                node["progress_percentage"] = 0.0
            
            nodes.append(node)
        
        # Build edges (prerequisite relationships)
        edges = []
        for skill in skills:
            for prereq in skill.prerequisites:
                edges.append({
                    "source": prereq.id,
                    "target": skill.id,
                    "type": "prerequisite"
                })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "total_skills": len(skills)
        }
    
    def get_student_mastery_overview(self, student_id: int) -> Dict:
        """
        Get comprehensive mastery overview for a student.
        """
        masteries = self.db.query(StudentMastery).filter(
            StudentMastery.student_id == student_id
        ).all()
        
        total_skills = self.db.query(MasterySkill).count()
        unlocked_skills = len([m for m in masteries if m.mastery_level > 0])
        mastered_skills = len([m for m in masteries if m.mastery_level >= 5])
        
        # Calculate average mastery level
        avg_mastery = sum(m.mastery_level for m in masteries) / len(masteries) if masteries else 0
        
        # Group by category
        by_category = {}
        for mastery in masteries:
            if mastery.skill:
                category = mastery.skill.category or "Other"
                if category not in by_category:
                    by_category[category] = {
                        "total": 0,
                        "mastered": 0,
                        "in_progress": 0
                    }
                
                by_category[category]["total"] += 1
                if mastery.mastery_level >= 5:
                    by_category[category]["mastered"] += 1
                elif mastery.mastery_level > 0:
                    by_category[category]["in_progress"] += 1
        
        return {
            "student_id": student_id,
            "total_skills": total_skills,
            "unlocked_skills": unlocked_skills,
            "mastered_skills": mastered_skills,
            "average_mastery_level": round(avg_mastery, 2),
            "by_category": by_category,
            "recent_masteries": [m.to_dict() for m in masteries[-5:]]
        }
    
    def assess_skill(self, student_id: int, skill_id: int, correct: bool, time_spent: int = 0) -> Dict:
        """
        Assess student performance on a skill and update mastery level.
        """
        skill = self.db.query(MasterySkill).filter(MasterySkill.id == skill_id).first()
        if not skill:
            raise ValueError(f"Skill {skill_id} not found")
        
        # Check if skill is unlocked
        if not skill.is_unlocked_for_student(student_id, self.db):
            raise ValueError(f"Skill {skill_id} is locked. Complete prerequisites first.")
        
        # Get or create mastery record
        mastery = self.db.query(StudentMastery).filter(
            StudentMastery.student_id == student_id,
            StudentMastery.skill_id == skill_id
        ).first()
        
        if not mastery:
            mastery = StudentMastery(
                student_id=student_id,
                skill_id=skill_id,
                mastery_level=0,
                total_attempts=0,
                correct_attempts=0,
                total_practice_time=0,
                accuracy=0.0,
                progress_percentage=0.0
            )
            self.db.add(mastery)
        
        # Update mastery
        old_level = mastery.mastery_level or 0
        mastery.update_mastery(correct, time_spent)
        
        self.db.commit()
        self.db.refresh(mastery)
        
        # Check if new skills unlocked
        newly_unlocked = []
        if mastery.mastery_level >= 3 and old_level < 3:
            # Check what skills this unlocks
            all_skills = self.db.query(MasterySkill).all()
            for s in all_skills:
                if skill in s.prerequisites:
                    if s.is_unlocked_for_student(student_id, self.db):
                        newly_unlocked.append({
                            "id": s.id,
                            "name": s.name,
                            "description": s.description
                        })
        
        return {
            "mastery": mastery.to_dict(),
            "level_up": (mastery.mastery_level or 0) > old_level,
            "old_level": old_level,
            "new_level": mastery.mastery_level,
            "newly_unlocked_skills": newly_unlocked
        }
    
    def get_recommended_next_skills(self, student_id: int, limit: int = 5) -> List[Dict]:
        """
        Get recommended skills for student to work on next.
        Prioritizes: unlocked skills, closest to mastery, foundational skills.
        """
        all_skills = self.db.query(MasterySkill).all()
        recommendations = []
        
        for skill in all_skills:
            # Check if unlocked
            if not skill.is_unlocked_for_student(student_id, self.db):
                continue
            
            # Get current mastery
            mastery = self.db.query(StudentMastery).filter(
                StudentMastery.student_id == student_id,
                StudentMastery.skill_id == skill.id
            ).first()
            
            # Skip if already mastered
            if mastery and mastery.mastery_level >= 5:
                continue
            
            # Calculate priority score
            priority_score = 0
            
            # Factor 1: Progress (skills close to next level)
            if mastery:
                progress_factor = mastery.progress_percentage / 100.0
                priority_score += progress_factor * 30
            
            # Factor 2: Foundation (skills that unlock others)
            unlocks_count = len(skill.unlocks)
            priority_score += min(unlocks_count * 10, 30)
            
            # Factor 3: Difficulty (start with easier skills)
            difficulty_map = {"beginner": 20, "intermediate": 10, "advanced": 5, "expert": 2}
            priority_score += difficulty_map.get(skill.difficulty, 10)
            
            # Factor 4: Recent activity (deprioritize recently worked on)
            if mastery and mastery.last_assessed_at:
                hours_since = (datetime.now() - mastery.last_assessed_at).total_seconds() / 3600
                if hours_since < 24:
                    priority_score -= 20
            
            recommendations.append({
                "skill": skill.to_dict(include_prerequisites=True),
                "mastery": mastery.to_dict() if mastery else None,
                "priority_score": priority_score,
                "unlocks_count": unlocks_count
            })
        
        # Sort by priority score
        recommendations.sort(key=lambda x: x["priority_score"], reverse=True)
        
        return recommendations[:limit]
    
    def get_learning_path(self, student_id: int, target_skill_id: int) -> Dict:
        """
        Generate optimal learning path to reach a target skill.
        Uses topological sort on prerequisite DAG.
        """
        target_skill = self.db.query(MasterySkill).filter(MasterySkill.id == target_skill_id).first()
        if not target_skill:
            raise ValueError(f"Target skill {target_skill_id} not found")
        
        # Get all prerequisites recursively
        path = []
        visited = set()
        
        def get_prerequisites_recursive(skill: MasterySkill):
            if skill.id in visited:
                return
            visited.add(skill.id)
            
            for prereq in skill.prerequisites:
                get_prerequisites_recursive(prereq)
            
            # Check student mastery
            mastery = self.db.query(StudentMastery).filter(
                StudentMastery.student_id == student_id,
                StudentMastery.skill_id == skill.id
            ).first()
            
            # Only add if not mastered
            if not mastery or mastery.mastery_level < 3:
                path.append({
                    "skill": skill.to_dict(),
                    "mastery_level": mastery.mastery_level if mastery else 0,
                    "is_unlocked": skill.is_unlocked_for_student(student_id, self.db),
                    "estimated_hours": skill.estimated_hours
                })
        
        get_prerequisites_recursive(target_skill)
        
        # Calculate total time
        total_hours = sum(item["estimated_hours"] for item in path)
        
        return {
            "target_skill": target_skill.to_dict(),
            "path": path,
            "total_skills": len(path),
            "estimated_hours": total_hours,
            "estimated_days": round(total_hours / 2, 1)  # Assuming 2 hours/day
        }


class BadgeService:
    """
    Service for managing badges and achievements.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_and_award_badges(self, student_id: int) -> List[Dict]:
        """
        Check all badge criteria and award newly earned badges.
        """
        # Get student stats
        student_stats = self._get_student_stats(student_id)
        
        # Get all active badges
        all_badges = self.db.query(Badge).filter(Badge.is_active == True).all()
        
        # Get already earned badges
        earned_badge_ids = set(
            b.badge_id for b in self.db.query(StudentBadge).filter(
                StudentBadge.student_id == student_id
            ).all()
        )
        
        # Check criteria and award
        newly_earned = []
        for badge in all_badges:
            # Skip if already earned
            if badge.id in earned_badge_ids:
                continue
            
            # Check criteria
            if badge.check_criteria(student_stats):
                student_badge = StudentBadge(
                    student_id=student_id,
                    badge_id=badge.id,
                    evidence=student_stats,
                    verification_code=self._generate_verification_code(student_id, badge.id)
                )
                self.db.add(student_badge)
                newly_earned.append(badge.to_dict())
        
        if newly_earned:
            self.db.commit()
        
        return newly_earned
    
    def get_student_badges(self, student_id: int) -> Dict:
        """
        Get all badges earned by a student.
        """
        student_badges = self.db.query(StudentBadge).filter(
            StudentBadge.student_id == student_id
        ).all()
        
        total_points = sum(sb.badge.points for sb in student_badges if sb.badge)
        
        # Group by tier
        by_tier = {"bronze": 0, "silver": 0, "gold": 0, "platinum": 0}
        for sb in student_badges:
            if sb.badge and sb.badge.tier in by_tier:
                by_tier[sb.badge.tier] += 1
        
        return {
            "total_badges": len(student_badges),
            "total_points": total_points,
            "by_tier": by_tier,
            "badges": [sb.to_dict(include_badge=True) for sb in student_badges]
        }
    
    def _get_student_stats(self, student_id: int) -> Dict:
        """
        Get comprehensive student statistics for badge criteria checking.
        """
        from app.models.models import Student, LearningSession
        
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {}
        
        masteries = self.db.query(StudentMastery).filter(
            StudentMastery.student_id == student_id
        ).all()
        
        sessions = self.db.query(LearningSession).filter(
            LearningSession.student_id == student_id
        ).all()
        
        mastered_skills = len([m for m in masteries if m.mastery_level >= 5])
        total_attempts = sum(m.total_attempts for m in masteries)
        correct_attempts = sum(m.correct_attempts for m in masteries)
        
        # Calculate streak
        streak = self._calculate_streak(student_id)
        
        return {
            "student_id": student_id,
            "mastered_skills": mastered_skills,
            "total_skills": len(masteries),
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "accuracy": (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0,
            "total_sessions": len(sessions),
            "current_streak": streak,
            "account_age_days": (datetime.now() - student.created_at).days if student.created_at else 0
        }
    
    def _calculate_streak(self, student_id: int) -> int:
        """Calculate current daily streak"""
        masteries = self.db.query(StudentMastery).filter(
            StudentMastery.student_id == student_id
        ).order_by(StudentMastery.last_assessed_at.desc()).all()
        
        if not masteries:
            return 0
        
        streak = 0
        current_date = datetime.now().date()
        
        for mastery in masteries:
            if not mastery.last_assessed_at:
                continue
            
            assessment_date = mastery.last_assessed_at.date()
            
            if assessment_date == current_date:
                streak = max(streak, 1)
                current_date -= timedelta(days=1)
            elif assessment_date == current_date - timedelta(days=1):
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        return streak
    
    def _generate_verification_code(self, student_id: int, badge_id: int) -> str:
        """Generate unique verification code"""
        import hashlib
        import secrets
        
        data = f"{student_id}-{badge_id}-{secrets.token_hex(8)}"
        code = hashlib.sha256(data.encode()).hexdigest()[:12].upper()
        return code


class StudyPlanService:
    """
    Service for generating and managing personalized study plans.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_plan(
        self,
        student_id: int,
        goal_type: str,
        target_skills: List[int],
        target_date: datetime,
        daily_minutes: int = 30
    ) -> Dict:
        """
        Generate AI-powered personalized study plan.
        """
        # Validate target skills
        skills = self.db.query(MasterySkill).filter(MasterySkill.id.in_(target_skills)).all()
        if len(skills) != len(target_skills):
            raise ValueError("Some target skills not found")
        
        # Calculate total required hours
        total_hours = sum(skill.estimated_hours for skill in skills)
        
        # Calculate available study days - handle timezone-aware dates
        now = datetime.now()
        if target_date.tzinfo is not None:
            # Convert target_date to naive by removing timezone
            target_date_naive = target_date.replace(tzinfo=None)
        else:
            target_date_naive = target_date
        
        days_available = (target_date_naive - now).days
        if days_available <= 0:
            raise ValueError("Target date must be in the future")
        
        # Calculate daily requirement
        required_daily_minutes = (total_hours * 60) / days_available
        
        # Check feasibility
        if required_daily_minutes > daily_minutes * 1.5:
            # Adjust timeline or workload
            feasibility = "challenging"
        elif required_daily_minutes > daily_minutes:
            feasibility = "moderate"
        else:
            feasibility = "comfortable"
        
        # Generate schedule
        schedule = self._generate_schedule(
            skills=skills,
            days_available=days_available,
            daily_minutes=daily_minutes
        )
        
        # Create study plan
        plan = StudyPlan(
            student_id=student_id,
            title=f"{goal_type.replace('_', ' ').title()} Study Plan",
            description=f"Master {len(skills)} skills in {days_available} days",
            goal_type=goal_type,
            target_skills=target_skills,
            target_date=target_date,
            daily_minutes=daily_minutes,
            schedule=schedule,
            total_tasks=len(schedule.get("daily_tasks", []))
        )
        
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        
        return {
            "plan": plan.to_dict(),
            "feasibility": feasibility,
            "required_daily_minutes": round(required_daily_minutes, 1),
            "total_hours": total_hours,
            "skills": [skill.to_dict() for skill in skills]
        }
    
    def _generate_schedule(
        self,
        skills: List[MasterySkill],
        days_available: int,
        daily_minutes: int
    ) -> Dict:
        """
        Generate day-by-day schedule.
        Uses spaced repetition principles and skill dependencies.
        """
        # Sort skills by prerequisites (topological sort)
        sorted_skills = self._topological_sort(skills)
        
        daily_tasks = []
        current_day = 0
        
        for skill in sorted_skills:
            # Calculate days needed for this skill
            skill_hours = skill.estimated_hours
            days_for_skill = max(1, int((skill_hours * 60) / daily_minutes))
            
            # Distribute across days with spaced repetition
            for day in range(days_for_skill):
                if current_day >= days_available:
                    break
                
                task_day = current_day + day
                daily_tasks.append({
                    "day": task_day,
                    "date": (datetime.now() + timedelta(days=task_day)).isoformat(),
                    "skill_id": skill.id,
                    "skill_name": skill.name,
                    "minutes": daily_minutes,
                    "task_type": "learn" if day < days_for_skill - 1 else "review"
                })
            
            current_day += days_for_skill
        
        # Add review days for spacing
        review_days = [7, 14, 21, 28]  # Review on these days
        for review_day in review_days:
            if review_day < days_available:
                for skill in sorted_skills:
                    daily_tasks.append({
                        "day": review_day,
                        "date": (datetime.now() + timedelta(days=review_day)).isoformat(),
                        "skill_id": skill.id,
                        "skill_name": skill.name,
                        "minutes": 15,
                        "task_type": "review"
                    })
        
        # Sort by day
        daily_tasks.sort(key=lambda x: x["day"])
        
        return {
            "daily_tasks": daily_tasks,
            "total_days": days_available,
            "skills_count": len(skills)
        }
    
    def _topological_sort(self, skills: List[MasterySkill]) -> List[MasterySkill]:
        """
        Sort skills by prerequisite dependencies.
        Skills with no prerequisites come first.
        """
        sorted_skills = []
        visited = set()
        
        def visit(skill: MasterySkill):
            if skill.id in visited:
                return
            visited.add(skill.id)
            
            for prereq in skill.prerequisites:
                if prereq in skills:
                    visit(prereq)
            
            sorted_skills.append(skill)
        
        for skill in skills:
            visit(skill)
        
        return sorted_skills
    
    def adjust_plan(self, plan_id: int, performance_data: Dict) -> Dict:
        """
        Adjust study plan based on actual performance.
        """
        plan = self.db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
        if not plan:
            raise ValueError(f"Study plan {plan_id} not found")
        
        # Update progress
        plan.calculate_progress(self.db)
        
        # Adjust based on performance
        plan.adjust_schedule(performance_data)
        
        self.db.commit()
        self.db.refresh(plan)
        
        return {
            "plan": plan.to_dict(),
            "adjustments_made": plan.adjustment_count,
            "performance_trend": plan.performance_trend
        }
    
    def get_today_tasks(self, student_id: int) -> Dict:
        """
        Get today's tasks from active study plans.
        """
        active_plans = self.db.query(StudyPlan).filter(
            StudyPlan.student_id == student_id,
            StudyPlan.is_active == True
        ).all()
        
        today_tasks = []
        total_minutes = 0
        
        for plan in active_plans:
            if not plan.schedule or "daily_tasks" not in plan.schedule:
                continue
            
            days_since_start = (datetime.now() - plan.created_at).days
            
            for task in plan.schedule["daily_tasks"]:
                if task["day"] == days_since_start:
                    today_tasks.append({
                        **task,
                        "plan_id": plan.id,
                        "plan_title": plan.title
                    })
                    total_minutes += task.get("minutes", 0)
        
        return {
            "date": datetime.now().date().isoformat(),
            "total_tasks": len(today_tasks),
            "total_minutes": total_minutes,
            "tasks": today_tasks
        }
