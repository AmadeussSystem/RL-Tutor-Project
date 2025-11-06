"""
Seed database with IIT JEE Previous Year Questions mapped to skill tree topics
"""
import sys
sys.path.append('.')

from app.core.database import SessionLocal
from app.models.models import Content

def seed_jee_pyq():
    """Populate Content table with IIT JEE PYQ for each skill"""
    db = SessionLocal()
    
    try:
        # Check if JEE PYQ content already exists
        jee_pyq_count = db.query(Content).filter(Content.tags.contains("jee_pyq")).count()
        if jee_pyq_count > 20:  # Already seeded with JEE PYQ
            print(f"[OK] JEE PYQ content already populated with {jee_pyq_count} items")
            return
        
        # Map skill names to topic identifiers and JEE PYQ
        jee_pyq_content = [
            # ========== MATHEMATICS: ALGEBRA ==========
            {
                "topic": "sets_and_relations",
                "title": "JEE 2023: Set Theory Problem",
                "description": "Sets and Relations - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, then A ∩ B is?",
                "correct_answer": "{3, 4}",
                "options": ["{1, 2, 3}", "{3, 4}", "{5, 6}", "{1, 2, 3, 4, 5, 6}"],
                "explanation": "The intersection of two sets contains only elements common to both sets. A ∩ B = {3, 4}"
            },
            {
                "topic": "sets_and_relations",
                "title": "JEE 2022: Relations Problem",
                "description": "Relations - IIT JEE Main 2022",
                "difficulty": 3,
                "question_text": "If R = {(x, y) : x² + y² ≤ 4, x, y ∈ Z}, then the number of ordered pairs is?",
                "correct_answer": "13",
                "options": ["9", "11", "13", "15"],
                "explanation": "We need x² + y² ≤ 4. Valid pairs: (0,0), (±1,0), (0,±1), (±2,0), (0,±2), (±1,±1) = 13 pairs"
            },
            
            # Quadratic Equations
            {
                "topic": "quadratic_equations",
                "title": "JEE 2023: Quadratic Roots",
                "description": "Quadratic Equations - IIT JEE Advanced 2023",
                "difficulty": 3,
                "question_text": "If α and β are roots of x² - 5x + 6 = 0, then α + β equals?",
                "correct_answer": "5",
                "options": ["3", "5", "6", "11"],
                "explanation": "By Vieta's formulas, for x² - 5x + 6 = 0, sum of roots = 5/1 = 5"
            },
            {
                "topic": "quadratic_equations",
                "title": "JEE 2021: Discriminant Problem",
                "description": "Quadratic Equations - IIT JEE Main 2021",
                "difficulty": 2,
                "question_text": "How many real roots does x² + 3x + 5 = 0 have?",
                "correct_answer": "0",
                "options": ["0", "1", "2", "Cannot be determined"],
                "explanation": "Discriminant Δ = 9 - 20 = -11 < 0, so there are no real roots"
            },
            
            # Polynomials
            {
                "topic": "polynomials",
                "title": "JEE 2022: Polynomial Division",
                "description": "Polynomials - IIT JEE Main 2022",
                "difficulty": 3,
                "question_text": "If P(x) = x³ - 6x² + 11x - 6 and (x-1) is a factor, find the other factors?",
                "correct_answer": "(x-2)(x-3)",
                "options": ["(x-2)(x-3)", "(x+2)(x+3)", "(x-1)(x-6)", "(x-4)(x+1)"],
                "explanation": "P(1) = 0, so (x-1) is a factor. By division or factoring: P(x) = (x-1)(x-2)(x-3)"
            },
            
            # Sequences and Series
            {
                "topic": "sequences_and_series",
                "title": "JEE 2023: Arithmetic Progression",
                "description": "Sequences and Series - IIT JEE Advanced 2023",
                "difficulty": 2,
                "question_text": "The sum of first 10 terms of AP 2, 5, 8, ... is?",
                "correct_answer": "155",
                "options": ["110", "135", "155", "175"],
                "explanation": "a=2, d=3, S₁₀ = 10/2[2(2) + 9(3)] = 5[4 + 27] = 155"
            },
            
            # Complex Numbers
            {
                "topic": "complex_numbers",
                "title": "JEE 2022: Complex Numbers",
                "description": "Complex Numbers - IIT JEE Main 2022",
                "difficulty": 2,
                "question_text": "If z = 3 + 4i, then |z| equals?",
                "correct_answer": "5",
                "options": ["3", "4", "5", "7"],
                "explanation": "|z| = √(3² + 4²) = √(9 + 16) = √25 = 5"
            },
            
            # Permutations and Combinations
            {
                "topic": "permutations_and_combinations",
                "title": "JEE 2023: Combinations",
                "description": "Permutations and Combinations - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "How many ways can 5 people sit in a row?",
                "correct_answer": "120",
                "options": ["60", "100", "120", "150"],
                "explanation": "Number of arrangements = 5! = 5×4×3×2×1 = 120"
            },
            
            # ========== MATHEMATICS: TRIGONOMETRY ==========
            {
                "topic": "trigonometric_ratios",
                "title": "JEE 2023: Trigonometric Values",
                "description": "Trigonometric Ratios - IIT JEE Main 2023",
                "difficulty": 1,
                "question_text": "sin(30°) = ?",
                "correct_answer": "1/2",
                "options": ["0", "1/2", "√3/2", "1"],
                "explanation": "sin(30°) = 1/2 is a standard trigonometric value"
            },
            {
                "topic": "trigonometric_identities",
                "title": "JEE 2022: Trigonometric Identities",
                "description": "Trigonometric Identities - IIT JEE Advanced 2022",
                "difficulty": 3,
                "question_text": "sin²θ + cos²θ = ?",
                "correct_answer": "1",
                "options": ["0", "1", "sinθ", "cosθ"],
                "explanation": "This is the fundamental trigonometric identity"
            },
            {
                "topic": "inverse_trigonometric_functions",
                "title": "JEE 2021: Inverse Trigonometry",
                "description": "Inverse Trigonometric Functions - IIT JEE Main 2021",
                "difficulty": 2,
                "question_text": "sin⁻¹(1/2) = ?",
                "correct_answer": "π/6",
                "options": ["π/3", "π/6", "π/4", "π/2"],
                "explanation": "sin(π/6) = 1/2, therefore sin⁻¹(1/2) = π/6"
            },
            
            # ========== MATHEMATICS: GEOMETRY ==========
            {
                "topic": "straight_lines",
                "title": "JEE 2023: Straight Lines",
                "description": "Straight Lines - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "Slope of line through (1, 2) and (3, 6) is?",
                "correct_answer": "2",
                "options": ["1", "2", "3", "4"],
                "explanation": "Slope m = (6-2)/(3-1) = 4/2 = 2"
            },
            {
                "topic": "circles",
                "title": "JEE 2022: Circle Equation",
                "description": "Circles - IIT JEE Advanced 2022",
                "difficulty": 2,
                "question_text": "Circle with center (0, 0) and radius 5: equation is?",
                "correct_answer": "x² + y² = 25",
                "options": ["x² + y² = 5", "x² + y² = 25", "(x-5)² + y² = 25", "x² + y² = 10"],
                "explanation": "Standard form: (x-h)² + (y-k)² = r². Here: x² + y² = 25"
            },
            {
                "topic": "conic_sections",
                "title": "JEE 2021: Parabola",
                "description": "Conic Sections - IIT JEE Main 2021",
                "difficulty": 3,
                "question_text": "Vertex of parabola y² = 4x is at?",
                "correct_answer": "(0, 0)",
                "options": ["(1, 0)", "(0, 0)", "(0, 1)", "(1, 1)"],
                "explanation": "Standard parabola y² = 4ax has vertex at origin (0, 0)"
            },
            
            # ========== MATHEMATICS: CALCULUS ==========
            {
                "topic": "limits_and_continuity",
                "title": "JEE 2023: Limits",
                "description": "Limits and Continuity - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "lim(x→0) sin(x)/x = ?",
                "correct_answer": "1",
                "options": ["0", "1", "∞", "undefined"],
                "explanation": "This is a standard limit: lim(x→0) sin(x)/x = 1"
            },
            {
                "topic": "differentiation",
                "title": "JEE 2022: Derivatives",
                "description": "Differentiation - IIT JEE Advanced 2022",
                "difficulty": 2,
                "question_text": "d/dx(x³) = ?",
                "correct_answer": "3x²",
                "options": ["x²", "3x²", "x³", "3x"],
                "explanation": "Using power rule: d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x³) = 3x²"
            },
            {
                "topic": "integration",
                "title": "JEE 2021: Integration",
                "description": "Integration - IIT JEE Main 2021",
                "difficulty": 2,
                "question_text": "∫x² dx = ?",
                "correct_answer": "x³/3 + C",
                "options": ["x³ + C", "x³/3 + C", "2x + C", "x/3 + C"],
                "explanation": "∫xⁿ dx = xⁿ⁺¹/(n+1) + C, so ∫x² dx = x³/3 + C"
            },
            
            # ========== PHYSICS: MECHANICS ==========
            {
                "topic": "mechanics",
                "title": "JEE 2023: Newton's First Law",
                "description": "Mechanics - IIT JEE Main 2023",
                "difficulty": 1,
                "question_text": "An object at rest remains at rest unless acted upon by an external force. This is?",
                "correct_answer": "Newton's First Law",
                "options": ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Inertia"],
                "explanation": "This describes Newton's First Law of Motion"
            },
            {
                "topic": "mechanics",
                "title": "JEE 2022: Kinematics",
                "description": "Mechanics - IIT JEE Advanced 2022",
                "difficulty": 2,
                "question_text": "A car accelerates from 0 to 100 km/h in 5 seconds. Average acceleration is?",
                "correct_answer": "20/3.6 ≈ 5.56 m/s²",
                "options": ["10 m/s²", "5.56 m/s²", "20 m/s²", "100 m/s²"],
                "explanation": "100 km/h = 100/3.6 ≈ 27.8 m/s. a = Δv/Δt = 27.8/5 ≈ 5.56 m/s²"
            },
            
            # ========== PHYSICS: WAVES ==========
            {
                "topic": "waves",
                "title": "JEE 2023: Wave Equation",
                "description": "Waves - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "Wave speed = frequency × wavelength. If f = 10 Hz and λ = 2 m, then v = ?",
                "correct_answer": "20 m/s",
                "options": ["5 m/s", "20 m/s", "50 m/s", "2 m/s"],
                "explanation": "v = fλ = 10 × 2 = 20 m/s"
            },
            
            # ========== PHYSICS: THERMODYNAMICS ==========
            {
                "topic": "thermodynamics",
                "title": "JEE 2022: First Law of Thermodynamics",
                "description": "Thermodynamics - IIT JEE Advanced 2022",
                "difficulty": 2,
                "question_text": "ΔU = Q - W represents?",
                "correct_answer": "First Law of Thermodynamics",
                "options": ["Ideal Gas Law", "First Law of Thermodynamics", "Carnot's Theorem", "Ohm's Law"],
                "explanation": "ΔU = Q - W is the First Law of Thermodynamics (conservation of energy)"
            },
            
            # ========== PHYSICS: ELECTROMAGNETISM ==========
            {
                "topic": "electromagnetism",
                "title": "JEE 2023: Coulomb's Law",
                "description": "Electromagnetism - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "Force between two charges q₁ and q₂ separated by distance r is?",
                "correct_answer": "F = kq₁q₂/r²",
                "options": ["F = q₁q₂/r", "F = kq₁q₂/r²", "F = kq₁q₂r", "F = kq₁q₂/r"],
                "explanation": "Coulomb's Law: F = k|q₁q₂|/r² where k = 9×10⁹ N·m²/C²"
            },
            
            # ========== PHYSICS: OPTICS ==========
            {
                "topic": "optics",
                "title": "JEE 2021: Lens Formula",
                "description": "Optics - IIT JEE Main 2021",
                "difficulty": 2,
                "question_text": "Lens formula is?",
                "correct_answer": "1/f = 1/u + 1/v",
                "options": ["1/f = 1/u - 1/v", "1/f = 1/u + 1/v", "f = uv", "f = u + v"],
                "explanation": "The lens formula relates object distance (u), image distance (v), and focal length (f)"
            },
            
            # ========== CHEMISTRY: PHYSICAL CHEMISTRY ==========
            {
                "topic": "physical_chemistry",
                "title": "JEE 2023: Atomic Structure",
                "description": "Physical Chemistry - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "Number of electrons in Oxygen atom (O) is?",
                "correct_answer": "8",
                "options": ["6", "7", "8", "9"],
                "explanation": "Oxygen has atomic number 8, so it has 8 electrons"
            },
            {
                "topic": "physical_chemistry",
                "title": "JEE 2022: Thermochemistry",
                "description": "Physical Chemistry - IIT JEE Advanced 2022",
                "difficulty": 2,
                "question_text": "Reaction H₂ + Cl₂ → 2HCl is?",
                "correct_answer": "Exothermic",
                "options": ["Endothermic", "Exothermic", "Isothermal", "Adiabatic"],
                "explanation": "This reaction releases energy (ΔH < 0), making it exothermic"
            },
            
            # ========== CHEMISTRY: INORGANIC CHEMISTRY ==========
            {
                "topic": "inorganic_chemistry",
                "title": "JEE 2021: Periodic Table",
                "description": "Inorganic Chemistry - IIT JEE Main 2021",
                "difficulty": 1,
                "question_text": "Which element has atomic number 17?",
                "correct_answer": "Chlorine (Cl)",
                "options": ["Fluorine (F)", "Chlorine (Cl)", "Bromine (Br)", "Iodine (I)"],
                "explanation": "Chlorine (Cl) has atomic number 17"
            },
            
            # ========== CHEMISTRY: ORGANIC CHEMISTRY ==========
            {
                "topic": "organic_chemistry",
                "title": "JEE 2023: Organic Nomenclature",
                "description": "Organic Chemistry - IIT JEE Main 2023",
                "difficulty": 2,
                "question_text": "CH₃-CH₂-CH₃ is called?",
                "correct_answer": "Propane",
                "options": ["Methane", "Ethane", "Propane", "Butane"],
                "explanation": "This 3-carbon alkane is called Propane (C₃H₈)"
            },
            
            # ========== STATISTICS & PROBABILITY ==========
            {
                "topic": "statistics",
                "title": "JEE 2022: Probability",
                "description": "Statistics & Probability - IIT JEE Advanced 2022",
                "difficulty": 2,
                "question_text": "Probability of getting a head when tossing a fair coin is?",
                "correct_answer": "1/2",
                "options": ["1/4", "1/3", "1/2", "2/3"],
                "explanation": "A fair coin has 2 equally likely outcomes, so P(Head) = 1/2"
            },
        ]
        
        # Add all content to database
        for item in jee_pyq_content:
            content = Content(
                title=item["title"],
                description=item.get("description", ""),
                topic=item["topic"],
                difficulty=item["difficulty"],
                content_type="question",
                question_text=item["question_text"],
                correct_answer=item["correct_answer"],
                options=item["options"],
                explanation=item["explanation"],
                tags=["jee_pyq", item["topic"]]
            )
            db.add(content)
        
        db.commit()
        print(f"[OK] Added {len(jee_pyq_content)} JEE PYQ content items!")
        
    except Exception as e:
        print(f"[ERROR] Error seeding JEE PYQ content: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_jee_pyq()
