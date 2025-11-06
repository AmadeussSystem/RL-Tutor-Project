#!/bin/bash
# Seed the skill tree for the RL Tutor

echo "🌳 Seeding Skill Tree..."
cd backend
python seed_skill_tree.py

if [ $? -eq 0 ]; then
    echo "✅ Skill tree seeded successfully!"
else
    echo "❌ Failed to seed skill tree"
    exit 1
fi
