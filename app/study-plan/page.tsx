'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Calendar, Clock, Target, TrendingUp, CheckCircle, Circle, X, BookOpen, Zap, ArrowRight, Loader, AlertCircle, Trash2, Eye } from 'lucide-react';
import { API_BASE } from '@/app/config/api';

interface StudyPlan {
  id: number;
  title: string;
  description: string;
  goal_type: string;
  target_date: string;
  daily_minutes: number;
  progress_percentage: number;
  performance_trend: string;
  status: string;
  is_active: boolean;
  target_skills: number[];
  schedule?: {
    daily_tasks: Array<{
      day: number;
      date: string;
      skill_id: number;
      skill_name: string;
      minutes: number;
      task_type: string;
    }>;
  };
}

interface TodayTask {
  day: number;
  date: string;
  skill_id: number;
  skill_name: string;
  minutes: number;
  task_type: string;
  plan_id: number;
  plan_title: string;
}

interface Skill {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  estimated_hours: number;
  is_unlocked: boolean;
}

const goalTypes = [
  { value: 'skill_mastery', label: 'Skill Mastery', description: 'Master specific skills', icon: '🎯' },
  { value: 'exam_prep', label: 'Exam Preparation', description: 'Prepare for an upcoming exam', icon: '📚' },
  { value: 'daily_practice', label: 'Daily Practice', description: 'Build a consistent study habit', icon: '⚡' },
  { value: 'catch_up', label: 'Catch Up', description: 'Get back on track with learning', icon: '🚀' },
];

const categoryColors: Record<string, string> = {
  'Algebra': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  'Trigonometry': 'bg-green-500/20 border-green-500/30 text-green-400',
  'Calculus': 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  'Geometry': 'bg-orange-500/20 border-orange-500/30 text-orange-400',
  'Statistics': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
};

export default function StudyPlanPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [goalType, setGoalType] = useState('skill_mastery');
  const [targetDate, setTargetDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudyPlans();
    fetchTodayTasks();
  }, []);

  useEffect(() => {
    if (showCreateForm) {
      fetchAvailableSkills();
    }
  }, [showCreateForm]);

  const fetchAvailableSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mastery/skills/tree`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSkills(data.tree.nodes);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchStudyPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mastery/study-plans?active_only=false`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching study plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mastery/study-plans/today/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTodayTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching today tasks:', error);
    }
  };

  const createStudyPlan = async () => {
    if (selectedSkills.length === 0) {
      setFormError('Please select at least one skill');
      return;
    }
    if (!targetDate) {
      setFormError('Please select a target date');
      return;
    }

    setCreating(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mastery/study-plans/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goal_type: goalType,
          target_skills: selectedSkills,
          target_date: new Date(targetDate).toISOString(),
          daily_minutes: dailyMinutes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(prev => [data.plan, ...prev]);
        setShowCreateForm(false);
        resetForm();
        fetchTodayTasks();
      } else {
        const errorData = await response.json();
        setFormError(errorData.detail || 'Failed to create study plan');
      }
    } catch (error) {
      console.error('Error creating study plan:', error);
      setFormError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const deletePlan = async (planId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mastery/study-plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPlans(prev => prev.filter(p => p.id !== planId));
        if (showPlanDetails?.id === planId) {
          setShowPlanDetails(null);
        }
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const resetForm = () => {
    setSelectedSkills([]);
    setGoalType('skill_mastery');
    setTargetDate('');
    setDailyMinutes(30);
    setFormError(null);
  };

  const toggleSkillSelection = (skillId: number) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'ahead') return '🚀';
    if (trend === 'behind') return '⚠️';
    return '✅';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'ahead') return 'text-green-600 bg-green-100';
    if (trend === 'behind') return 'text-orange-600 bg-orange-100';
    return 'text-blue-600 bg-blue-100';
  };

  const toggleTask = (taskKey: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskKey)) {
      newCompleted.delete(taskKey);
    } else {
      newCompleted.add(taskKey);
    }
    setCompletedTasks(newCompleted);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const calculateEstimatedHours = () => {
    return availableSkills
      .filter(s => selectedSkills.includes(s.id))
      .reduce((sum, s) => sum + s.estimated_hours, 0);
  };

  const completedCount = completedTasks.size;
  const totalMinutes = todayTasks.reduce((sum, task) => sum + task.minutes, 0);
  const completedMinutes = todayTasks
    .filter((task, idx) => completedTasks.has(`${task.plan_id}-${task.skill_id}-${idx}`))
    .reduce((sum, task) => sum + task.minutes, 0);

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading study plans...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 -mx-6 -mt-8 px-6 pt-8 pb-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-400" />
                  Study Plans
                </h1>
                <p className="text-gray-400">Personalized learning schedules tailored to your goals</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold transition-all"
              >
                + Create New Plan
              </button>
            </div>
          </div>

          {/* Today's Tasks Dashboard */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-7 h-7" />
              Today's Tasks
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{completedCount}/{todayTasks.length}</p>
                <p className="text-sm opacity-90">Tasks Completed</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{completedMinutes}/{totalMinutes}</p>
                <p className="text-sm opacity-90">Minutes (min)</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <Target className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{Math.round((completedCount / Math.max(todayTasks.length, 1)) * 100)}%</p>
                <p className="text-sm opacity-90">Progress</p>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 bg-white bg-opacity-10 rounded-lg">
                  <p className="text-lg">No tasks scheduled for today 🎉</p>
                  <p className="text-sm opacity-75 mt-1">Enjoy your day or create a new study plan!</p>
                </div>
              ) : (
                todayTasks.map((task, idx) => {
                  const taskKey = `${task.plan_id}-${task.skill_id}-${idx}`;
                  const isCompleted = completedTasks.has(taskKey);

                  return (
                    <div
                      key={taskKey}
                      onClick={() => toggleTask(taskKey)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isCompleted ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-20 hover:bg-opacity-25'
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold ${isCompleted ? 'line-through opacity-75' : ''}`}>
                          {task.skill_name}
                        </p>
                        <p className="text-sm opacity-75">{task.plan_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{task.minutes} min</p>
                        <p className="text-xs opacity-75 capitalize">{task.task_type}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Study Plans */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Your Study Plans</h2>

            {plans.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
                <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 text-lg mb-2">No study plans yet</p>
                <p className="text-gray-400 mb-4">Create a personalized plan to reach your learning goals</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all"
                >
                  Create Your First Plan
                </button>
              </div>
            ) : (
              plans.map(plan => (
                <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">{plan.title}</h3>
                        {plan.performance_trend && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTrendColor(plan.performance_trend)}`}>
                            {getTrendIcon(plan.performance_trend)} {plan.performance_trend}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mb-2">{plan.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(plan.target_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{plan.daily_minutes} min/day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span className="capitalize">{plan.goal_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${plan.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      plan.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                      {plan.status}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-semibold text-white">{Math.round(plan.progress_percentage)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${plan.progress_percentage >= 75 ? 'bg-green-500' :
                          plan.progress_percentage >= 50 ? 'bg-blue-500' :
                            plan.progress_percentage >= 25 ? 'bg-yellow-500' :
                              'bg-gray-500'
                          }`}
                        style={{ width: `${plan.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPlanDetails(plan)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {plan.is_active && (
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Plan Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCreateForm(false)}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Calendar className="w-7 h-7 text-purple-400" />
                      Create Study Plan
                    </h2>
                    <p className="text-gray-400 mt-1">Design a personalized learning schedule</p>
                  </div>
                  <button
                    onClick={() => { setShowCreateForm(false); resetForm(); }}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Error Message */}
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-400">{formError}</p>
                    </div>
                  )}

                  {/* Goal Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Select Your Goal</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {goalTypes.map(goal => (
                        <button
                          key={goal.value}
                          onClick={() => setGoalType(goal.value)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${goalType === goal.value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                            }`}
                        >
                          <span className="text-2xl mb-2 block">{goal.icon}</span>
                          <p className="font-semibold text-white text-sm">{goal.label}</p>
                          <p className="text-xs text-gray-400 mt-1">{goal.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Date and Daily Minutes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Target Completion Date</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        min={getMinDate()}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Daily Study Time (minutes)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={15}
                          max={120}
                          step={15}
                          value={dailyMinutes}
                          onChange={(e) => setDailyMinutes(parseInt(e.target.value))}
                          className="flex-1 accent-purple-500"
                        />
                        <span className="w-16 text-center px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-semibold">
                          {dailyMinutes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Selection */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-300">Select Skills to Master</label>
                      <span className="text-sm text-gray-400">
                        {selectedSkills.length} selected • ~{calculateEstimatedHours().toFixed(1)} hours total
                      </span>
                    </div>

                    {availableSkills.length === 0 ? (
                      <div className="text-center py-8 bg-zinc-800/50 rounded-lg">
                        <Loader className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                        <p className="text-gray-400">Loading available skills...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                        {availableSkills.map(skill => {
                          const isSelected = selectedSkills.includes(skill.id);
                          const categoryColor = categoryColors[skill.category] || 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400';

                          return (
                            <button
                              key={skill.id}
                              onClick={() => toggleSkillSelection(skill.id)}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white text-sm truncate">{skill.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor}`}>
                                      {skill.category}
                                    </span>
                                    <span className="text-xs text-gray-400">{skill.estimated_hours}h</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {selectedSkills.length > 0 && targetDate && (
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-4">
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Plan Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Skills</p>
                          <p className="text-white font-semibold">{selectedSkills.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Hours</p>
                          <p className="text-white font-semibold">{calculateEstimatedHours().toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Daily Time</p>
                          <p className="text-white font-semibold">{dailyMinutes} min</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Days Until Goal</p>
                          <p className="text-white font-semibold">
                            {Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => { setShowCreateForm(false); resetForm(); }}
                      className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createStudyPlan}
                      disabled={creating || selectedSkills.length === 0 || !targetDate}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Plan
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plan Details Modal */}
          {showPlanDetails && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowPlanDetails(null)}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{showPlanDetails.title}</h2>
                    <p className="text-gray-400 mt-1">{showPlanDetails.description}</p>
                  </div>
                  <button
                    onClick={() => setShowPlanDetails(null)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Progress Overview */}
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400">Overall Progress</span>
                      <span className="text-white font-bold">{Math.round(showPlanDetails.progress_percentage)}%</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                        style={{ width: `${showPlanDetails.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Plan Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Target Date</p>
                      <p className="text-white font-semibold">{new Date(showPlanDetails.target_date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Daily Time</p>
                      <p className="text-white font-semibold">{showPlanDetails.daily_minutes} min</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Goal Type</p>
                      <p className="text-white font-semibold capitalize">{showPlanDetails.goal_type.replace('_', ' ')}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                      <BookOpen className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Skills</p>
                      <p className="text-white font-semibold">{showPlanDetails.target_skills?.length || 0}</p>
                    </div>
                  </div>

                  {/* Schedule Preview */}
                  {showPlanDetails.schedule?.daily_tasks && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        Upcoming Schedule
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {showPlanDetails.schedule.daily_tasks.slice(0, 14).map((task, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-purple-400">D{task.day + 1}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{task.skill_name}</p>
                                <p className="text-gray-400 text-sm">{new Date(task.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{task.minutes} min</p>
                              <p className="text-xs text-gray-400 capitalize">{task.task_type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
