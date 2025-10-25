'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Lock, Check, Clock, TrendingUp, Target, Award } from 'lucide-react';

interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_hours: number;
  prerequisite_ids: number[];
  is_unlocked: boolean;
  mastery_level: number;
  progress_percentage: number;
}

interface SkillNode extends Skill {
  x: number;
  y: number;
}

export default function SkillTreePage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillTree();
  }, []);

  const fetchSkillTree = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8002';
      const response = await fetch(`${API_BASE}/api/v1/mastery/skills/tree`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSkills(data.tree.nodes);
      }
    } catch (error) {
      console.error('Error fetching skill tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (level: number) => {
    const colors = ['#9CA3AF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[level] || colors[0];
  };

  const getMasteryLabel = (level: number) => {
    const labels = ['Not Started', 'Beginner', 'Developing', 'Proficient', 'Advanced', 'Master'];
    return labels[level] || labels[0];
  };

  const filteredSkills = skills.filter(skill => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return skill.is_unlocked;
    if (filter === 'locked') return !skill.is_unlocked;
    if (filter === 'mastered') return skill.mastery_level >= 5;
    return skill.category === filter;
  });

  const categories = [...new Set(skills.map(s => s.category))];
  const statsData = {
    total: skills.length,
    unlocked: skills.filter(s => s.is_unlocked).length,
    mastered: skills.filter(s => s.mastery_level >= 5).length,
    inProgress: skills.filter(s => s.mastery_level > 0 && s.mastery_level < 5).length
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Skill Tree...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🌳 Skill Tree</h1>
            <p className="text-gray-600">Master skills to unlock new learning paths</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Skills</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unlocked</p>
                  <p className="text-2xl font-bold text-green-600">{statsData.unlocked}</p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{statsData.inProgress}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mastered</p>
                  <p className="text-2xl font-bold text-purple-600">{statsData.mastered}</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Skills
              </button>
              <button
                onClick={() => setFilter('unlocked')}
                className={`px-4 py-2 rounded-lg ${filter === 'unlocked' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Unlocked
              </button>
              <button
                onClick={() => setFilter('locked')}
                className={`px-4 py-2 rounded-lg ${filter === 'locked' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Locked
              </button>
              <button
                onClick={() => setFilter('mastered')}
                className={`px-4 py-2 rounded-lg ${filter === 'mastered' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Mastered
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg ${filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map(skill => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`bg-white p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg ${!skill.is_unlocked ? 'opacity-60' : ''
                  }`}
                style={{ borderLeft: `4px solid ${getMasteryColor(skill.mastery_level)}` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!skill.is_unlocked && <Lock className="w-4 h-4 text-gray-400" />}
                      {skill.mastery_level >= 5 && <Award className="w-4 h-4 text-purple-600" />}
                      <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500">{skill.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${skill.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    skill.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      skill.difficulty === 'advanced' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {skill.difficulty}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{skill.description}</p>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{getMasteryLabel(skill.mastery_level)}</span>
                    <span className="text-gray-600">{Math.round(skill.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${skill.progress_percentage}%`,
                        backgroundColor: getMasteryColor(skill.mastery_level)
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{skill.estimated_hours}h to master</span>
                </div>
              </div>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No skills found matching your filter</p>
            </div>
          )}

          {/* Skill Detail Modal */}
          {selectedSkill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedSkill(null)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">{selectedSkill.name}</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <p className="font-semibold">{selectedSkill.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p>{selectedSkill.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mastery Level</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${selectedSkill.progress_percentage}%`,
                              backgroundColor: getMasteryColor(selectedSkill.mastery_level)
                            }}
                          />
                        </div>
                      </div>
                      <span className="font-semibold">{getMasteryLabel(selectedSkill.mastery_level)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Difficulty</p>
                      <p className="font-semibold capitalize">{selectedSkill.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estimated Time</p>
                      <p className="font-semibold">{selectedSkill.estimated_hours} hours</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-semibold">
                      {selectedSkill.is_unlocked ? '🔓 Unlocked' : '🔒 Locked - Complete prerequisites first'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  {selectedSkill.is_unlocked && selectedSkill.mastery_level < 5 && (
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Start Learning
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
