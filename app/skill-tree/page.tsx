'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { API_BASE } from '@/app/config/api';
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
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillTree();
  }, []);

  const handleStartLearning = (skill: Skill) => {
    router.push(`/learning-path?skillId=${skill.id}&skillName=${encodeURIComponent(skill.name)}`);
  };

  const fetchSkillTree = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mastery/skills/tree`, {
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
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🌳 Skill Tree
                </h1>
                <p className="text-zinc-400 mt-1">Master skills to unlock new learning paths</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 rounded-lg hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Skills</p>
                  <p className="text-2xl font-bold text-white">{statsData.total}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 rounded-lg hover:border-green-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Unlocked</p>
                  <p className="text-2xl font-bold text-green-400">{statsData.unlocked}</p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 rounded-lg hover:border-orange-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">In Progress</p>
                  <p className="text-2xl font-bold text-orange-400">{statsData.inProgress}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 rounded-lg hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Mastered</p>
                  <p className="text-2xl font-bold text-purple-400">{statsData.mastered}</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 rounded-lg mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all ${filter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-purple-400'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
              >
                All Skills
              </button>
              <button
                onClick={() => setFilter('unlocked')}
                className={`px-4 py-2 rounded-lg transition-all ${filter === 'unlocked'
                  ? 'bg-green-600/80 text-white border border-green-400'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
              >
                Unlocked
              </button>
              <button
                onClick={() => setFilter('locked')}
                className={`px-4 py-2 rounded-lg transition-all ${filter === 'locked'
                  ? 'bg-gray-600/80 text-white border border-gray-400'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
              >
                Locked
              </button>
              <button
                onClick={() => setFilter('mastered')}
                className={`px-4 py-2 rounded-lg transition-all ${filter === 'mastered'
                  ? 'bg-purple-600/80 text-white border border-purple-400'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
              >
                Mastered
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg transition-all ${filter === cat
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-blue-400'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
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
                className={`bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 rounded-lg cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 ${!skill.is_unlocked ? 'opacity-60' : ''
                  }`}
                style={{ borderLeft: `4px solid ${getMasteryColor(skill.mastery_level)}` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!skill.is_unlocked && <Lock className="w-4 h-4 text-gray-500" />}
                      {skill.mastery_level >= 5 && <Award className="w-4 h-4 text-purple-400" />}
                      <h3 className="font-semibold text-white">{skill.name}</h3>
                    </div>
                    <p className="text-xs text-zinc-500">{skill.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${skill.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    skill.difficulty === 'intermediate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      skill.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                    {skill.difficulty}
                  </span>
                </div>

                <p className="text-sm text-zinc-400 mb-3">{skill.description}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{getMasteryLabel(skill.mastery_level)}</span>
                    <span className="text-zinc-400">{Math.round(skill.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${skill.progress_percentage}%`,
                        backgroundColor: getMasteryColor(skill.mastery_level)
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  <span>{skill.estimated_hours}h to master</span>
                </div>
              </div>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-lg">
              <p className="text-zinc-400">No skills found matching your filter</p>
            </div>
          )}

          {/* Skill Detail Modal */}
          {selectedSkill && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedSkill(null)}>
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/20" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {selectedSkill.name}
                </h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Category</p>
                    <p className="font-semibold text-white text-lg">{selectedSkill.category}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Description</p>
                    <p className="text-zinc-300 leading-relaxed">{selectedSkill.description}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Mastery Level</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="w-full bg-zinc-800 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${selectedSkill.progress_percentage}%`,
                              backgroundColor: getMasteryColor(selectedSkill.mastery_level)
                            }}
                          />
                        </div>
                      </div>
                      <span className="font-semibold text-white min-w-fit">{getMasteryLabel(selectedSkill.mastery_level)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Difficulty</p>
                      <p className="font-semibold text-white capitalize">{selectedSkill.difficulty}</p>
                    </div>
                    <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Estimated Time</p>
                      <p className="font-semibold text-white">{selectedSkill.estimated_hours} hours</p>
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Status</p>
                    <p className={`font-semibold text-lg ${selectedSkill.is_unlocked ? 'text-green-400' : 'text-gray-400'}`}>
                      {selectedSkill.is_unlocked ? '🔓 Unlocked' : '🔒 Locked - Complete prerequisites first'}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  {selectedSkill.is_unlocked && selectedSkill.mastery_level < 5 && (
                    <button
                      onClick={() => handleStartLearning(selectedSkill)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/20">
                      Start Learning
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="px-6 py-3 border border-zinc-600 text-zinc-300 rounded-lg hover:bg-zinc-800/50 hover:border-zinc-500 transition-all font-semibold"
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
