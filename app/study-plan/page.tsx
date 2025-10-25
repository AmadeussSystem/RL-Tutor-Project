'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Calendar, Clock, Target, TrendingUp, CheckCircle, Circle } from 'lucide-react';

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

export default function StudyPlanPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudyPlans();
    fetchTodayTasks();
  }, []);

  const fetchStudyPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8002';
      const response = await fetch(`${API_BASE}/api/v1/mastery/study-plans`, {
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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8002';
      const response = await fetch(`${API_BASE}/api/v1/mastery/study-plans/today/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTodayTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching today tasks:', error);
    }
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

  const completedCount = completedTasks.size;
  const totalMinutes = todayTasks.reduce((sum, task) => sum + task.minutes, 0);
  const completedMinutes = todayTasks
    .filter((task, idx) => completedTasks.has(`${task.plan_id}-${task.skill_id}-${idx}`))
    .reduce((sum, task) => sum + task.minutes, 0);

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Study Plans...</p>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Study Plans</h1>
              <p className="text-gray-600">Personalized learning schedules tailored to your goals</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Create New Plan
            </button>
          </div>

          {/* Today's Tasks Dashboard */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">📚 Today's Tasks</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
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
            <h2 className="text-xl font-bold text-gray-900">Your Study Plans</h2>

            {plans.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No study plans yet</p>
                <p className="text-gray-500 mb-4">Create a personalized plan to reach your learning goals</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Plan
                </button>
              </div>
            ) : (
              plans.map(plan => (
                <div key={plan.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                        {plan.performance_trend && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTrendColor(plan.performance_trend)}`}>
                            {getTrendIcon(plan.performance_trend)} {plan.performance_trend}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{plan.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
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
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${plan.status === 'active' ? 'bg-green-100 text-green-800' :
                      plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {plan.status}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{Math.round(plan.progress_percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${plan.progress_percentage >= 75 ? 'bg-green-600' :
                          plan.progress_percentage >= 50 ? 'bg-blue-600' :
                            plan.progress_percentage >= 25 ? 'bg-yellow-600' :
                              'bg-gray-400'
                          }`}
                        style={{ width: `${plan.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      View Details
                    </button>
                    {plan.is_active && (
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Adjust Plan
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Plan Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateForm(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">Create Study Plan</h2>
                <p className="text-gray-600 mb-4">Feature coming soon! Study plan generation will help you create personalized learning schedules.</p>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
