"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import { Timer, Zap, Target, TrendingUp, Clock, BarChart3, Settings } from "lucide-react";

interface PaceProfile {
  student_id: number;
  pace_category: string;
  avg_speed: number;
  difficulty_preference: number;
  fast_track_mode: boolean;
  deep_dive_mode: boolean;
  completion_rate: number;
  total_concepts_completed: number;
  avg_time_per_concept_seconds: number;
  recommended_difficulty: number;
  time_by_concept: { [key: string]: number };
  adjustment_history: Array<{
    date: string;
    from_difficulty: number;
    to_difficulty: number;
    reason: string;
  }>;
  last_analyzed: string;
}

interface TimeAnalytics {
  daily_time_spent: Array<{ date: string; seconds: number; minutes: number }>;
  time_by_concept: { [key: string]: { seconds: number; minutes: number } };
  time_by_difficulty: { [key: string]: { seconds: number; minutes: number } };
  peak_learning_hours: string[];
  total_time_seconds: number;
  total_time_minutes: number;
  total_time_hours: number;
  days_analyzed: number;
}

interface DifficultyAdjustment {
  current_difficulty: number;
  recommended_difficulty: number;
  should_increase: boolean;
  should_decrease: boolean;
  adjustment_reason: string;
  pace_category: string;
  avg_speed: number;
  completion_rate: number;
}

export default function LearningPacePage() {
  const [pace, setPace] = useState<PaceProfile | null>(null);
  const [analytics, setAnalytics] = useState<TimeAnalytics | null>(null);
  const [adjustment, setAdjustment] = useState<DifficultyAdjustment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaceData();
  }, []);

  const loadPaceData = async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

    if (!token) {
      setError("Please log in to view your learning pace");
      setIsLoading(false);
      return;
    }

    try {
      // Load pace profile
      const paceResponse = await fetch(
        `${API_BASE}/api/v1/learning-pace/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (paceResponse.ok) {
        const paceData = await paceResponse.json();
        setPace(paceData);
      }

      // Load time analytics
      const analyticsResponse = await fetch(
        `${API_BASE}/api/v1/learning-pace/time-analytics?days=7`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      // Load difficulty adjustment recommendation
      const adjustmentResponse = await fetch(
        `${API_BASE}/api/v1/learning-pace/difficulty-adjustment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (adjustmentResponse.ok) {
        const adjustmentData = await adjustmentResponse.json();
        setAdjustment(adjustmentData);
      }
    } catch (err) {
      setError("Failed to load pace data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePace = async () => {
    setIsAnalyzing(true);
    setError(null);

    const token = localStorage.getItem("token");
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/learning-pace/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze pace");
      }

      await loadPaceData();
    } catch (err) {
      setError("Failed to analyze learning pace");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePreferences = async (
    fastTrack?: boolean,
    deepDive?: boolean,
    difficulty?: number
  ) => {
    const token = localStorage.getItem("token");
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (fastTrack !== undefined) params.append("fast_track_mode", String(fastTrack));
      if (deepDive !== undefined) params.append("deep_dive_mode", String(deepDive));
      if (difficulty !== undefined) params.append("difficulty_preference", String(difficulty));

      const response = await fetch(
        `${API_BASE}/api/v1/learning-pace/preferences?${params}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await loadPaceData();
      }
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  const getPaceCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      very_fast: "text-purple-400",
      fast: "text-blue-400",
      normal: "text-green-400",
      slow: "text-yellow-400",
      very_slow: "text-orange-400",
    };
    return colors[category] || "text-gray-400";
  };

  const getPaceCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      very_fast: "Very Fast",
      fast: "Fast",
      normal: "Normal",
      slow: "Steady",
      very_slow: "Thorough",
    };
    return labels[category] || category;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading pace data...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Timer className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Learning Pace
                </h1>
                <p className="text-zinc-400 mt-1">Track your learning speed and optimize difficulty</p>
              </div>
            </div>
            <button
              onClick={analyzePace}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Analyze My Pace
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {pace && (
            <>
              {/* Pace Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-sm">Pace Category</span>
                    <Zap className={`w-5 h-5 ${getPaceCategoryColor(pace.pace_category)}`} />
                  </div>
                  <div className={`text-2xl font-bold ${getPaceCategoryColor(pace.pace_category)}`}>
                    {getPaceCategoryLabel(pace.pace_category)}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {pace.avg_speed.toFixed(2)}x baseline
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-sm">Difficulty Level</span>
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {pace.difficulty_preference}/10
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    Recommended: {pace.recommended_difficulty}/10
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-sm">Completion Rate</span>
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {pace.completion_rate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {pace.total_concepts_completed} concepts
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-sm">Avg Time/Concept</span>
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatTime(pace.avg_time_per_concept_seconds)}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">Per concept</div>
                </div>
              </div>

              {/* Learning Mode Toggles */}
              <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold">Learning Mode</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => updatePreferences(!pace.fast_track_mode, false)}
                    className={`p-4 rounded-lg border-2 transition-all ${pace.fast_track_mode
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-700 hover:border-zinc-600"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className={`w-6 h-6 ${pace.fast_track_mode ? "text-purple-400" : "text-zinc-500"}`} />
                      <div className="text-left">
                        <div className="font-bold">Fast Track Mode</div>
                        <div className="text-sm text-zinc-400">Accelerated learning with harder content</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updatePreferences(false, !pace.deep_dive_mode)}
                    className={`p-4 rounded-lg border-2 transition-all ${pace.deep_dive_mode
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-700 hover:border-zinc-600"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Target className={`w-6 h-6 ${pace.deep_dive_mode ? "text-blue-400" : "text-zinc-500"}`} />
                      <div className="text-left">
                        <div className="font-bold">Deep Dive Mode</div>
                        <div className="text-sm text-zinc-400">Thorough learning with comprehensive coverage</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Difficulty Adjustment Recommendation */}
              {adjustment && (
                <div className={`bg-zinc-950 rounded-xl p-6 border mb-8 ${adjustment.should_increase ? "border-green-500/50" :
                  adjustment.should_decrease ? "border-yellow-500/50" :
                    "border-zinc-800"
                  }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-bold">Difficulty Recommendation</h2>
                  </div>
                  <p className="text-zinc-300 mb-4">{adjustment.adjustment_reason}</p>
                  {adjustment.current_difficulty !== adjustment.recommended_difficulty && (
                    <button
                      onClick={() => updatePreferences(undefined, undefined, adjustment.recommended_difficulty)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-medium transition-all"
                    >
                      Apply Recommended Difficulty ({adjustment.recommended_difficulty}/10)
                    </button>
                  )}
                </div>
              )}

              {/* Time Analytics */}
              {analytics && analytics.total_time_seconds > 0 && (
                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-bold">Time Analytics (Last 7 Days)</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {analytics.total_time_hours.toFixed(1)}h
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">Total Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {analytics.daily_time_spent.length}
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">Days Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {analytics.peak_learning_hours.join(", ")}
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">Peak Hours</div>
                    </div>
                  </div>

                  {/* Time by Concept */}
                  {Object.keys(analytics.time_by_concept).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold mb-3">Time by Concept</h3>
                      <div className="space-y-2">
                        {Object.entries(analytics.time_by_concept).map(([concept, time]) => (
                          <div key={concept} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="capitalize">{concept}</span>
                            <span className="text-purple-400 font-mono">{time.minutes.toFixed(1)}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Adjustment History */}
              {pace.adjustment_history && pace.adjustment_history.length > 0 && (
                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                  <h2 className="text-xl font-bold mb-4">Adjustment History</h2>
                  <div className="space-y-3">
                    {pace.adjustment_history.slice(-5).reverse().map((adj, idx) => (
                      <div key={idx} className="p-4 bg-zinc-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">
                            {new Date(adj.date).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-sm">
                            {adj.from_difficulty} → {adj.to_difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300">{adj.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!pace && !isLoading && (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No pace data available yet</p>
              <button
                onClick={analyzePace}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-medium transition-all"
              >
                Analyze My Learning Pace
              </button>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
