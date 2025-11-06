"""
Seed skill tree with JEE (Joint Entrance Examination) mathematics skills
"""
import sys
sys.path.append('.')

from app.core.database import SessionLocal, engine
from app.models.mastery import MasterySkill, Base

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_skill_tree():
    """Populate the skill tree with JEE mathematics topics"""
    db = SessionLocal()
    
    try:
        # Check if skills already exist
        existing_count = db.query(MasterySkill).count()
        if existing_count > 0:
            print(f"✅ Skill tree already populated with {existing_count} skills")
            return
        
        # Define skill hierarchy (topic, description, category, difficulty, estimated_hours)
        skills_data = [
            # ============ MATHEMATICS ============
            # Algebra Foundation
            {
                "name": "Sets and Relations",
                "description": "Understand sets, relations, and functions",
                "category": "Algebra",
                "difficulty": "beginner",
                "estimated_hours": 3.0,
                "prerequisites": []
            },
            {
                "name": "Quadratic Equations",
                "description": "Solve quadratic equations and inequalities",
                "category": "Algebra",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": ["Sets and Relations"]
            },
            {
                "name": "Polynomials",
                "description": "Polynomial equations and their roots",
                "category": "Algebra",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Quadratic Equations"]
            },
            {
                "name": "Sequences and Series",
                "description": "Arithmetic and geometric progressions",
                "category": "Algebra",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Polynomials"]
            },
            {
                "name": "Complex Numbers",
                "description": "Complex numbers and their operations",
                "category": "Algebra",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Quadratic Equations"]
            },
            {
                "name": "Permutations and Combinations",
                "description": "Counting principles and probability basics",
                "category": "Algebra",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Sets and Relations"]
            },
            
            # Trigonometry
            {
                "name": "Trigonometric Ratios",
                "description": "Basic trigonometric functions and angles",
                "category": "Trigonometry",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Trigonometric Identities",
                "description": "Fundamental trigonometric identities",
                "category": "Trigonometry",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Trigonometric Ratios"]
            },
            {
                "name": "Inverse Trigonometric Functions",
                "description": "Inverse trigonometric functions",
                "category": "Trigonometry",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Trigonometric Ratios"]
            },
            
            # Coordinate Geometry
            {
                "name": "Straight Lines",
                "description": "Equations of straight lines and their properties",
                "category": "Geometry",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Circles",
                "description": "Equations and properties of circles",
                "category": "Geometry",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Straight Lines"]
            },
            {
                "name": "Conic Sections",
                "description": "Parabola, ellipse, and hyperbola",
                "category": "Geometry",
                "difficulty": "advanced",
                "estimated_hours": 6.0,
                "prerequisites": ["Circles"]
            },
            
            # Calculus Foundation
            {
                "name": "Limits and Continuity",
                "description": "Limits, continuity, and basic calculus concepts",
                "category": "Calculus",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Differentiation",
                "description": "Derivatives and their applications",
                "category": "Calculus",
                "difficulty": "intermediate",
                "estimated_hours": 6.0,
                "prerequisites": ["Limits and Continuity"]
            },
            {
                "name": "Integration",
                "description": "Indefinite and definite integrals",
                "category": "Calculus",
                "difficulty": "intermediate",
                "estimated_hours": 6.0,
                "prerequisites": ["Differentiation"]
            },
            {
                "name": "Applications of Calculus",
                "description": "Differential equations and optimization",
                "category": "Calculus",
                "difficulty": "advanced",
                "estimated_hours": 6.0,
                "prerequisites": ["Integration"]
            },
            
            # Advanced Topics
            {
                "name": "Vectors",
                "description": "Vector algebra and 3D geometry",
                "category": "Advanced",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Straight Lines"]
            },
            {
                "name": "Matrices and Determinants",
                "description": "Matrix algebra and linear systems",
                "category": "Advanced",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": []
            },
            {
                "name": "Probability",
                "description": "Probability theory and distributions",
                "category": "Statistics",
                "difficulty": "advanced",
                "estimated_hours": 5.0,
                "prerequisites": ["Permutations and Combinations"]
            },
            {
                "name": "Statistics",
                "description": "Statistical analysis and inference",
                "category": "Statistics",
                "difficulty": "advanced",
                "estimated_hours": 4.0,
                "prerequisites": ["Probability"]
            },
            
            # ============ PHYSICS ============
            # Mechanics
            {
                "name": "Kinematics",
                "description": "Motion in 1D and 2D, projectile motion",
                "category": "Mechanics",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Newton's Laws of Motion",
                "description": "Forces, mass, and acceleration",
                "category": "Mechanics",
                "difficulty": "beginner",
                "estimated_hours": 5.0,
                "prerequisites": ["Kinematics"]
            },
            {
                "name": "Work, Energy and Power",
                "description": "Work-energy theorem, conservation of energy",
                "category": "Mechanics",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Newton's Laws of Motion"]
            },
            {
                "name": "Rotational Motion",
                "description": "Torque, angular momentum, rolling motion",
                "category": "Mechanics",
                "difficulty": "advanced",
                "estimated_hours": 6.0,
                "prerequisites": ["Work, Energy and Power"]
            },
            
            # Waves and Oscillations
            {
                "name": "Simple Harmonic Motion",
                "description": "Oscillations and periodic motion",
                "category": "Waves",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Newton's Laws of Motion"]
            },
            {
                "name": "Waves",
                "description": "Sound and electromagnetic waves",
                "category": "Waves",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Simple Harmonic Motion"]
            },
            
            # Thermodynamics
            {
                "name": "Heat and Thermodynamics",
                "description": "First law, second law, and applications",
                "category": "Thermodynamics",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": []
            },
            
            # Electromagnetism
            {
                "name": "Electrostatics",
                "description": "Electric charge, field, and potential",
                "category": "Electromagnetism",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": []
            },
            {
                "name": "Current Electricity",
                "description": "Electric current, resistance, and circuits",
                "category": "Electromagnetism",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Electrostatics"]
            },
            {
                "name": "Magnetism",
                "description": "Magnetic field, force, and induction",
                "category": "Electromagnetism",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Current Electricity"]
            },
            
            # Optics
            {
                "name": "Ray Optics",
                "description": "Reflection, refraction, and lenses",
                "category": "Optics",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Wave Optics",
                "description": "Interference, diffraction, and polarization",
                "category": "Optics",
                "difficulty": "advanced",
                "estimated_hours": 5.0,
                "prerequisites": ["Ray Optics", "Waves"]
            },
            
            # Modern Physics
            {
                "name": "Modern Physics",
                "description": "Atomic structure and nuclear physics",
                "category": "Modern Physics",
                "difficulty": "advanced",
                "estimated_hours": 5.0,
                "prerequisites": []
            },
            
            # ============ CHEMISTRY ============
            # Atomic Structure
            {
                "name": "Atomic Structure",
                "description": "Atoms, electrons, and quantum numbers",
                "category": "Physical Chemistry",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Chemical Bonding",
                "description": "Ionic and covalent bonding, molecular structure",
                "category": "Physical Chemistry",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": ["Atomic Structure"]
            },
            {
                "name": "States of Matter",
                "description": "Gases, liquids, and solids",
                "category": "Physical Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Thermodynamics and Kinetics",
                "description": "Enthalpy, entropy, and reaction rates",
                "category": "Physical Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["States of Matter"]
            },
            {
                "name": "Equilibrium",
                "description": "Chemical equilibrium and Le Chatelier's principle",
                "category": "Physical Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Thermodynamics and Kinetics"]
            },
            {
                "name": "Electrochemistry",
                "description": "Redox reactions and electrochemical cells",
                "category": "Physical Chemistry",
                "difficulty": "advanced",
                "estimated_hours": 5.0,
                "prerequisites": ["Equilibrium"]
            },
            
            # Inorganic Chemistry
            {
                "name": "Periodic Table",
                "description": "Periodic trends and element properties",
                "category": "Inorganic Chemistry",
                "difficulty": "beginner",
                "estimated_hours": 3.0,
                "prerequisites": []
            },
            {
                "name": "Coordination Chemistry",
                "description": "Complex ions and coordination compounds",
                "category": "Inorganic Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Periodic Table"]
            },
            {
                "name": "Metals and Non-metals",
                "description": "Properties and reactions of elements",
                "category": "Inorganic Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Periodic Table"]
            },
            
            # Organic Chemistry
            {
                "name": "Basic Organic Chemistry",
                "description": "Nomenclature and isomerism",
                "category": "Organic Chemistry",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Hydrocarbons",
                "description": "Alkanes, alkenes, and alkynes",
                "category": "Organic Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Basic Organic Chemistry"]
            },
            {
                "name": "Aromatic Compounds",
                "description": "Benzene and aromatic substitution",
                "category": "Organic Chemistry",
                "difficulty": "intermediate",
                "estimated_hours": 4.0,
                "prerequisites": ["Hydrocarbons"]
            },
            {
                "name": "Functional Groups",
                "description": "Alcohols, aldehydes, ketones, and carboxylic acids",
                "category": "Organic Chemistry",
                "difficulty": "advanced",
                "estimated_hours": 6.0,
                "prerequisites": ["Aromatic Compounds"]
            },
            
            # ============ JEE PYQ (Previous Year Questions) ============
            {
                "name": "JEE Main PYQ",
                "description": "Previous year questions from JEE Main",
                "category": "JEE PYQ",
                "difficulty": "advanced",
                "estimated_hours": 8.0,
                "prerequisites": []
            },
            {
                "name": "JEE Advanced PYQ",
                "description": "Previous year questions from JEE Advanced",
                "category": "JEE PYQ",
                "difficulty": "expert",
                "estimated_hours": 10.0,
                "prerequisites": ["JEE Main PYQ"]
            }
        ]
            
            # Coordinate Geometry
            {
                "name": "Straight Lines",
                "description": "Equations of straight lines and their properties",
                "category": "Geometry",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Circles",
                "description": "Equations and properties of circles",
                "category": "Geometry",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Straight Lines"]
            },
            {
                "name": "Conic Sections",
                "description": "Parabola, ellipse, and hyperbola",
                "category": "Geometry",
                "difficulty": "advanced",
                "estimated_hours": 6.0,
                "prerequisites": ["Circles"]
            },
            
            # Calculus Foundation
            {
                "name": "Limits and Continuity",
                "description": "Limits, continuity, and basic calculus concepts",
                "category": "Calculus",
                "difficulty": "beginner",
                "estimated_hours": 4.0,
                "prerequisites": []
            },
            {
                "name": "Differentiation",
                "description": "Derivatives and their applications",
                "category": "Calculus",
                "difficulty": "intermediate",
                "estimated_hours": 6.0,
                "prerequisites": ["Limits and Continuity"]
            },
            {
                "name": "Integration",
                "description": "Indefinite and definite integrals",
                "category": "Calculus",
                "difficulty": "intermediate",
                "estimated_hours": 6.0,
                "prerequisites": ["Differentiation"]
            },
            {
                "name": "Applications of Calculus",
                "description": "Differential equations and optimization",
                "category": "Calculus",
                "difficulty": "advanced",
                "estimated_hours": 6.0,
                "prerequisites": ["Integration"]
            },
            
            # Advanced Topics
            {
                "name": "Vectors",
                "description": "Vector algebra and 3D geometry",
                "category": "Advanced",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": ["Straight Lines"]
            },
            {
                "name": "Matrices and Determinants",
                "description": "Matrix algebra and linear systems",
                "category": "Advanced",
                "difficulty": "intermediate",
                "estimated_hours": 5.0,
                "prerequisites": []
            },
            {
                "name": "Probability",
                "description": "Probability theory and distributions",
                "category": "Statistics",
                "difficulty": "advanced",
                "estimated_hours": 5.0,
                "prerequisites": ["Permutations and Combinations"]
            },
            {
                "name": "Statistics",
                "description": "Statistical analysis and inference",
                "category": "Statistics",
                "difficulty": "advanced",
                "estimated_hours": 4.0,
                "prerequisites": ["Probability"]
            }
        ]
        
        # Create skills in database
        skills_map = {}  # Map name to skill object
        
        # First pass: create all skills without prerequisites
        for skill_data in skills_data:
            skill = MasterySkill(
                name=skill_data["name"],
                description=skill_data["description"],
                category=skill_data["category"],
                difficulty=skill_data["difficulty"],
                estimated_hours=skill_data["estimated_hours"]
            )
            db.add(skill)
            skills_map[skill_data["name"]] = skill
        
        db.commit()
        
        # Second pass: add prerequisites
        for skill_data in skills_data:
            skill = skills_map[skill_data["name"]]
            for prereq_name in skill_data["prerequisites"]:
                if prereq_name in skills_map:
                    prereq_skill = skills_map[prereq_name]
                    skill.prerequisites.append(prereq_skill)
        
        db.commit()
        
        print(f"✅ Skill tree seeded successfully with {len(skills_data)} skills!")
        print("\n📊 Skill Distribution:")
        
        # Print statistics
        categories = {}
        for skill_data in skills_data:
            cat = skill_data["category"]
            categories[cat] = categories.get(cat, 0) + 1
        
        for category, count in sorted(categories.items()):
            print(f"   {category}: {count} skills")
        
    except Exception as e:
        print(f"❌ Error seeding skill tree: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_skill_tree()
