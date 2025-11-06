'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import { api, DashboardData, DashboardRecommendations } from '@/app/api/client';
import { Brain, Target, TrendingUp, Award, BookOpen, Lightbulb, ArrowRight, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [recommendations, setRecommendations] = useState<DashboardRecommendations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tokenExpired, setTokenExpired] = useState(false);
    const [checkingPlacement, setCheckingPlacement] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        checkPlacementStatus();
    }, [isAuthenticated, user]);

    const checkPlacementStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const status = await api.getPlacementStatus(token);
            if (!status.completed) {
                // Redirect to placement test if not completed
                router.push('/placement-test');
                return;
            }
            // Placement completed, load dashboard
            setCheckingPlacement(false);
            loadDashboard();
        } catch (err: any) {
            console.error('Failed to check placement status:', err);
            setCheckingPlacement(false);
            loadDashboard(); // Continue to dashboard on error
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        loadDashboard();
    }, [isAuthenticated, user]);

    const loadDashboard = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const data = await api.getDashboard(user);
            setDashboard(data);

            // Load recommendations if token available
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const recs = await api.getDashboardRecommendations(token);
                    setRecommendations(recs);
                } catch (recError: any) {
                    console.error('Failed to load recommendations:', recError);

                    // If token is invalid/expired, clear it and show warning
                    if (recError.message && recError.message.includes('401')) {
                        console.warn('Token expired or invalid - clearing local storage');
                        localStorage.removeItem('token');
                        localStorage.removeItem('username');
                        setTokenExpired(true);
                        // Don't set error - just skip recommendations, dashboard still works
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingPlacement || isLoading) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-white text-xl">
                        {checkingPlacement ? 'Checking placement status...' : 'Loading dashboard...'}
                    </div>
                </div>
            </Sidebar>
        );
    }

    if (error || !dashboard) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-xl mb-4">{error || 'Failed to load'}</div>
                        <button
                            onClick={loadDashboard}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </Sidebar>
        );
    }

    const { student, knowledge, progress } = dashboard;

    return (
        <Sidebar>
            <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
                {/* Token Expired Warning Banner */}
                {tokenExpired && (
                    <div className="bg-yellow-900/20 border-b border-yellow-500/30 backdrop-blur-sm">
                        <div className="max-w-7xl mx-auto px-6 py-3">
                            <div className="flex items-center gap-3 text-yellow-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">
                                    Your session has expired. Some features may be limited.{' '}
                                    <Link href="/login" className="underline font-semibold hover:text-yellow-300">
                                        Log in again
                                    </Link>
                                    {' '}to access personalized recommendations.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome Header with Gradient */}
                <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border-b border-zinc-800/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                                    Welcome back, {student.full_name || student.username}! 👋
                                </h1>
                                <p className="text-neutral-400 text-lg">Here's your personalized learning overview</p>
                            </div>
                            <div className="hidden md:flex items-center gap-3">
                                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                    <span className="text-purple-400 font-semibold">Level {Math.floor(progress.total_attempts / 10) + 1}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Stats Grid with Enhanced Design */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all duration-300 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Target className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-neutral-400 text-sm font-medium">Total Attempts</h3>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{progress.total_attempts}</p>
                                <p className="text-xs text-neutral-500">Questions answered</p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                        <Award className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-neutral-400 text-sm font-medium">Accuracy Rate</h3>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{(progress.accuracy_rate * 100).toFixed(1)}%</p>
                                <p className="text-xs text-neutral-500">Average success rate</p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all duration-300 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h3 className="text-neutral-400 text-sm font-medium">Current Streak</h3>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{progress.current_streak}</p>
                                <p className="text-xs text-neutral-500">Days in a row 🔥</p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-neutral-400 text-sm font-medium">Time Today</h3>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{progress.time_spent_today.toFixed(0)}</p>
                                <p className="text-xs text-neutral-500">Minutes studied</p>
                            </div>
                        </div>
                    </div>

                    {/* Knowledge Scores with Enhanced Styling */}
                    <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 mb-10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                                <Brain className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Knowledge Progress</h2>
                        </div>
                        <div className="space-y-6">
                            {Object.entries(knowledge).slice(0, 4).map(([topic, score]) => {
                                const percentage = typeof score === 'number' ? score * 100 : 0;
                                // Format topic name: remove _score, replace underscores with spaces, capitalize each word
                                const topicName = topic
                                    .replace('_score', '')
                                    .split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');

                                // Color coding based on percentage
                                let gradientColor = 'from-red-500 to-orange-500';
                                if (percentage >= 80) gradientColor = 'from-green-500 to-emerald-500';
                                else if (percentage >= 60) gradientColor = 'from-blue-500 to-cyan-500';
                                else if (percentage >= 40) gradientColor = 'from-yellow-500 to-amber-500';

                                return (
                                    <div key={topic} className="group">
                                        <div className="flex justify-between mb-3">
                                            <span className="text-neutral-300 font-medium group-hover:text-white transition-colors">{topicName}</span>
                                            <span className="text-neutral-400 font-semibold">{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="relative w-full bg-zinc-800/50 rounded-full h-4 overflow-hidden">
                                            <div
                                                className={`bg-gradient-to-r ${gradientColor} h-4 rounded-full transition-all duration-700 ease-out relative`}
                                                style={{ width: `${percentage}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Topics Mastered & Learning Profile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Award className="w-5 h-5 text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Topics Mastered</h2>
                            </div>
                            {progress.topics_mastered.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {progress.topics_mastered.map((topic) => (
                                        <span
                                            key={topic}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-lg border border-green-500/30 font-medium hover:scale-105 transition-transform"
                                        >
                                            ✓ {topic}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <AlertCircle className="w-12 h-12 text-neutral-600 mb-3" />
                                    <p className="text-neutral-400">No topics mastered yet.</p>
                                    <p className="text-neutral-500 text-sm">Keep learning to unlock achievements!</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Brain className="w-5 h-5 text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Learning Profile</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
                                    <span className="text-neutral-400">Preferred Difficulty</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${i < knowledge.preferred_difficulty ? 'bg-purple-500' : 'bg-zinc-700'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="font-semibold text-white">{knowledge.preferred_difficulty}/5</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
                                    <span className="text-neutral-400">Learning Style</span>
                                    <span className="font-semibold text-white capitalize">{knowledge.learning_style}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
                                    <span className="text-neutral-400">Correct Answers</span>
                                    <span className="font-semibold text-green-400">{progress.correct_answers}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations Section with Enhanced Design */}
                    {recommendations && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                            {/* Learning Style Card */}
                            <div className="group relative bg-gradient-to-br from-purple-950/50 via-purple-900/30 to-blue-950/50 border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                            <Brain className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Your Learning Style</h2>
                                    </div>
                                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
                                        {recommendations.learning_style.style}
                                    </div>
                                    {recommendations.learning_style.style !== "Not assessed" ? (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-400">Visual</span>
                                                <span className="font-semibold text-white">{recommendations.learning_style.visual_score.toFixed(0)}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-400">Auditory</span>
                                                <span className="font-semibold text-white">{recommendations.learning_style.auditory_score.toFixed(0)}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-400">Reading</span>
                                                <span className="font-semibold text-white">{recommendations.learning_style.reading_score.toFixed(0)}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-400">Kinesthetic</span>
                                                <span className="font-semibold text-white">{recommendations.learning_style.kinesthetic_score.toFixed(0)}%</span>
                                            </div>
                                            <Link
                                                href="/learning-style-results"
                                                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mt-4 font-medium group-hover:gap-3 transition-all"
                                            >
                                                View Details <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <Link
                                            href="/learning-style-quiz"
                                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium group-hover:gap-3 transition-all"
                                        >
                                            Take Assessment <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Study Tips */}
                            <div className="group relative bg-gradient-to-br from-yellow-950/50 via-yellow-900/30 to-amber-950/50 border border-yellow-500/30 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 shadow-xl hover:shadow-yellow-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                                            <Lightbulb className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Study Tips</h2>
                                    </div>
                                    <ul className="space-y-4">
                                        {recommendations.study_tips.map((tip, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold mt-0.5">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-neutral-300 leading-relaxed">{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Knowledge Gaps */}
                            <div className="group relative bg-gradient-to-br from-orange-950/50 via-orange-900/30 to-red-950/50 border border-orange-500/30 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 shadow-xl hover:shadow-orange-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-orange-500/20 rounded-lg">
                                            <AlertCircle className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Focus Areas</h2>
                                    </div>
                                    {recommendations.knowledge_gaps.length > 0 ? (
                                        <ul className="space-y-4">
                                            {recommendations.knowledge_gaps.map((gap, index) => (
                                                <li key={index} className="p-4 bg-zinc-900/50 rounded-lg border border-orange-500/20">
                                                    <div className="font-semibold text-orange-400 mb-2">{gap.topic}</div>
                                                    <div className="text-neutral-400 text-sm leading-relaxed">{gap.recommendation}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="text-green-400 text-5xl mb-3">✓</div>
                                            <p className="text-neutral-400 text-sm">Great job! No major knowledge gaps detected.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Study Tips */}
                            <div className="group relative bg-gradient-to-br from-yellow-950/50 via-yellow-900/30 to-amber-950/50 border border-yellow-500/30 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 shadow-xl hover:shadow-yellow-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                                            <Lightbulb className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Study Tips</h2>
                                    </div>
                                    <ul className="space-y-4">
                                        {recommendations.study_tips.map((tip, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold mt-0.5">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-neutral-300 leading-relaxed">{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Knowledge Gaps */}
                            <div className="group relative bg-gradient-to-br from-orange-950/50 via-orange-900/30 to-red-950/50 border border-orange-500/30 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 shadow-xl hover:shadow-orange-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-orange-500/20 rounded-lg">
                                            <AlertCircle className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Focus Areas</h2>
                                    </div>
                                    {recommendations.knowledge_gaps.length > 0 ? (
                                        <ul className="space-y-4">
                                            {recommendations.knowledge_gaps.map((gap, index) => (
                                                <li key={index} className="p-4 bg-zinc-900/50 rounded-lg border border-orange-500/20">
                                                    <div className="font-semibold text-orange-400 mb-2">{gap.topic}</div>
                                                    <div className="text-neutral-400 text-sm leading-relaxed">{gap.recommendation}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="text-green-400 text-5xl mb-3">✓</div>
                                            <p className="text-neutral-400 text-sm">Great job! No major knowledge gaps detected.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recommended Content */}
                    {recommendations && recommendations.recommended_content.length > 0 && (
                        <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 mb-10 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
                            </div>
                            <div className="space-y-4">
                                {recommendations.recommended_content.map((content) => (
                                    <div key={content.id} className="group flex items-center justify-between p-6 bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white mb-2 text-lg">{content.title}</h3>
                                            <p className="text-sm text-neutral-400 mb-3">{content.reason}</p>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium border border-blue-500/30">
                                                    {content.topic}
                                                </span>
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium border border-purple-500/30">
                                                    Level {content.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="ml-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium group-hover:scale-105">
                                            Start
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/learn"
                            className="flex-1 group relative bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-5 px-8 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 text-center shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <BookOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Start Learning Session
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                        <Link
                            href="/"
                            className="px-8 py-5 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all duration-200 text-center font-medium text-neutral-300 hover:text-white"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
