'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { api } from '@/app/api/client';
import Sidebar from '@/app/components/Sidebar';
import { Brain, TrendingUp, Award, Target, Clock, BarChart3 } from 'lucide-react';

interface PerformanceData {
    date: string;
    accuracy: number;
    attempts: number;
    avg_reward?: number;
    total_time?: number;
    avg_time?: number;
}

interface RLStats {
    total_sessions: number;
    avg_reward: number;
    exploration_rate: number;
    q_table_size: number;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [rlStats, setRLStats] = useState<RLStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            if (!user) return;

            try {
                const [performance, stats] = await Promise.all([
                    api.getPerformanceChart(user),
                    api.getRLStats(),
                ]);

                setPerformanceData(performance);
                setRLStats(stats);
                setLastUpdated(new Date());
            } catch (err: any) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        
        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    if (isLoading) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-white text-xl">Loading analytics...</div>
                </div>
            </Sidebar>
        );
    }

    const maxAccuracy = Math.max(...performanceData.map(d => d.accuracy), 100);
    const maxAttempts = Math.max(...performanceData.map(d => d.attempts), 1);

    return (
        <Sidebar>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                    <BarChart3 className="w-8 h-8 text-purple-400" />
                                    Learning Analytics
                                </h1>
                                <p className="text-gray-400">Track your progress and identify improvement areas</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsLoading(true);
                                        const fetchData = async () => {
                                            if (!user) return;
                                            try {
                                                const [performance, stats] = await Promise.all([
                                                    api.getPerformanceChart(user),
                                                    api.getRLStats(),
                                                ]);
                                                setPerformanceData(performance);
                                                setRLStats(stats);
                                                setLastUpdated(new Date());
                                            } catch (err: any) {
                                                console.error('Failed to fetch analytics:', err);
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        };
                                        fetchData();
                                    }}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Refresh Data
                                </button>
                                {lastUpdated && (
                                    <span className="text-sm text-gray-500">
                                        Last updated: {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* RL Agent Stats */}
                    {rlStats && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Brain className="w-6 h-6 text-purple-400" />
                                RL Agent Statistics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-zinc-900 rounded-lg p-4">
                                    <div className="text-gray-400 text-sm mb-1">Total Sessions</div>
                                    <div className="text-2xl font-bold">{rlStats?.total_sessions || 0}</div>
                                </div>
                                <div className="bg-zinc-900 rounded-lg p-4">
                                    <div className="text-gray-400 text-sm mb-1">Average Reward</div>
                                    <div className="text-2xl font-bold text-amber-400">{(rlStats?.avg_reward || 0).toFixed(2)}</div>
                                </div>
                                <div className="bg-zinc-900 rounded-lg p-4">
                                    <div className="text-gray-400 text-sm mb-1">Exploration Rate</div>
                                    <div className="text-2xl font-bold text-blue-400">{((rlStats?.exploration_rate || 0) * 100).toFixed(1)}%</div>
                                </div>
                                <div className="bg-zinc-900 rounded-lg p-4">
                                    <div className="text-gray-400 text-sm mb-1">Q-Table Size</div>
                                    <div className="text-2xl font-bold text-purple-400">{rlStats?.q_table_size || 0}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance Over Time */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            Performance Over Time
                        </h2>

                        {performanceData.length > 0 ? (
                            <>
                                {/* Accuracy Chart */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Accuracy Trend</h3>
                                    <div className="space-y-3">
                                        {performanceData.map((data, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-24 text-sm text-gray-400">{data.date}</div>
                                                <div className="flex-1 bg-zinc-900 rounded-full h-8 overflow-hidden relative">
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full flex items-center justify-end pr-3 transition-all duration-500"
                                                        style={{ width: `${(data.accuracy / maxAccuracy) * 100}%` }}
                                                    >
                                                        <span className="text-xs font-semibold text-white">
                                                            {data.accuracy.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Attempts Chart */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Daily Attempts</h3>
                                    <div className="space-y-3">
                                        {performanceData.map((data, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-24 text-sm text-gray-400">{data.date}</div>
                                                <div className="flex-1 bg-zinc-900 rounded-full h-8 overflow-hidden relative">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center justify-end pr-3 transition-all duration-500"
                                                        style={{ width: `${(data.attempts / maxAttempts) * 100}%` }}
                                                    >
                                                        <span className="text-xs font-semibold text-white">
                                                            {data.attempts}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rewards Chart */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Total Rewards</h3>
                                    <div className="space-y-3">
                                        {performanceData.map((data, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-24 text-sm text-gray-400">{data.date}</div>
                                                <div className="flex-1 bg-zinc-900 rounded-full h-8 overflow-hidden relative">
                                                    <div
                                                        className="bg-gradient-to-r from-amber-500 to-orange-400 h-full flex items-center justify-end pr-3 transition-all duration-500"
                                                        style={{ width: `${((data.avg_reward || 0) / Math.max(...performanceData.map(d => d.avg_reward || 0), 1)) * 100}%` }}
                                                    >
                                                        <span className="text-xs font-semibold text-white">
                                                            +{(data.avg_reward || 0).toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No performance data yet</p>
                                <p className="text-gray-500 text-sm mt-2">Start learning to see your progress!</p>
                                <Link
                                    href="/learn"
                                    className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
                                >
                                    Start Learning
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Insights */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Award className="w-6 h-6 text-amber-400" />
                            Insights & Tips
                        </h2>
                        <div className="space-y-4">
                            {performanceData.length > 0 && (
                                <>
                                    {performanceData[performanceData.length - 1].accuracy >= 0.8 && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-green-400 text-2xl">🎯</div>
                                                <div>
                                                    <h3 className="font-semibold text-green-400 mb-1">Great Accuracy!</h3>
                                                    <p className="text-gray-300 text-sm">You're performing exceptionally well with {(performanceData[performanceData.length - 1].accuracy * 100).toFixed(0)}% accuracy. Consider trying harder difficulty levels.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {performanceData[performanceData.length - 1].accuracy >= 0.5 && performanceData[performanceData.length - 1].accuracy < 0.8 && (
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-blue-400 text-2xl">�</div>
                                                <div>
                                                    <h3 className="font-semibold text-blue-400 mb-1">Steady Progress!</h3>
                                                    <p className="text-gray-300 text-sm">You're doing well with {(performanceData[performanceData.length - 1].accuracy * 100).toFixed(0)}% accuracy. Keep practicing to reach 80%+!</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {performanceData[performanceData.length - 1].accuracy < 0.5 && performanceData[performanceData.length - 1].attempts > 0 && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-yellow-400 text-2xl">💡</div>
                                                <div>
                                                    <h3 className="font-semibold text-yellow-400 mb-1">Focus on Fundamentals</h3>
                                                    <p className="text-gray-300 text-sm">Your accuracy is {(performanceData[performanceData.length - 1].accuracy * 100).toFixed(0)}%. Review the flashcards and try easier questions first.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {performanceData[performanceData.length - 1].attempts < 10 && (
                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-purple-400 text-2xl">💪</div>
                                                <div>
                                                    <h3 className="font-semibold text-purple-400 mb-1">Keep Practicing!</h3>
                                                    <p className="text-gray-300 text-sm">You've completed {performanceData[performanceData.length - 1].attempts} questions today. Aim for at least 10 questions daily for best results!</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {performanceData[performanceData.length - 1].attempts >= 20 && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-green-400 text-2xl">🔥</div>
                                                <div>
                                                    <h3 className="font-semibold text-green-400 mb-1">Outstanding Dedication!</h3>
                                                    <p className="text-gray-300 text-sm">Amazing! You've completed {performanceData[performanceData.length - 1].attempts} questions today. You're on fire!</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {rlStats && rlStats.exploration_rate > 0.05 && (
                                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-indigo-400 text-2xl">🤖</div>
                                                <div>
                                                    <h3 className="font-semibold text-indigo-400 mb-1">RL Agent Adapting</h3>
                                                    <p className="text-gray-300 text-sm">The AI is learning your patterns (exploration rate: {(rlStats.exploration_rate * 100).toFixed(1)}%). Your recommendations will get better with each session!</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {performanceData.length === 0 && (
                                <div className="bg-zinc-900 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-gray-400 text-2xl">📚</div>
                                        <div>
                                            <h3 className="font-semibold text-gray-300 mb-1">Get Started</h3>
                                            <p className="text-gray-400 text-sm">Begin your learning journey to unlock personalized insights and recommendations.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
