'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Radar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    ArcElement
);

interface LearningStyleResults {
    visual_score: number;
    auditory_score: number;
    reading_score: number;
    kinesthetic_score: number;
    dominant_style: string;
    description: string;
    study_tips: string[];
    assessed_at: string;
}

export default function LearningStyleResults() {
    const router = useRouter();
    const [results, setResults] = useState<LearningStyleResults | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedResults = localStorage.getItem('learning_style_results');
        if (storedResults) {
            setResults(JSON.parse(storedResults));
            // Clean up localStorage
            localStorage.removeItem('learning_style_results');
        } else {
            // Try to fetch from API
            fetchResults();
        }
        setLoading(false);
    }, []);

    const fetchResults = async () => {
        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                router.push('/login');
                return;
            }

            const { api } = await import('@/app/api/client');
            const data = await api.getLearningStyle(userId);
            setResults(data);
        } catch (err) {
            console.error('Failed to fetch results:', err);
            router.push('/dashboard');
        }
    };

    if (loading || !results) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                </div>
            </Sidebar>
        );
    }

    // Prepare chart data
    const radarData = {
        labels: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'],
        datasets: [
            {
                label: 'Your Learning Style Profile',
                data: [
                    results.visual_score,
                    results.auditory_score,
                    results.reading_score,
                    results.kinesthetic_score,
                ],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
            },
        ],
    };

    const pieData = {
        labels: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'],
        datasets: [
            {
                data: [
                    results.visual_score,
                    results.auditory_score,
                    results.reading_score,
                    results.kinesthetic_score,
                ],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(168, 85, 247, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const styleEmoji: Record<string, string> = {
        V: '👁️',
        A: '👂',
        R: '📚',
        K: '✋',
        Multimodal: '🌟',
    };

    const styleName: Record<string, string> = {
        V: 'Visual Learner',
        A: 'Auditory Learner',
        R: 'Reading/Writing Learner',
        K: 'Kinesthetic Learner',
        Multimodal: 'Multimodal Learner',
    };

    return (
        <Sidebar>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Your Learning Style Profile
                        </h1>
                        <p className="text-gray-600">
                            Discovered on {new Date(results.assessed_at).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Dominant Style Card */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-2xl p-8 mb-8 text-white">
                        <div className="text-center">
                            <div className="text-6xl mb-4">{styleEmoji[results.dominant_style]}</div>
                            <h2 className="text-3xl font-bold mb-2">
                                {styleName[results.dominant_style]}
                            </h2>
                            <p className="text-lg opacity-90">{results.description}</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Radar Chart */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                                Learning Style Breakdown
                            </h3>
                            <div className="h-80 flex items-center justify-center">
                                <Radar
                                    data={radarData}
                                    options={{
                                        scales: {
                                            r: {
                                                beginAtZero: true,
                                                max: 100,
                                                ticks: {
                                                    stepSize: 20,
                                                },
                                            },
                                        },
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                        maintainAspectRatio: true,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                                Distribution
                            </h3>
                            <div className="h-80 flex items-center justify-center">
                                <Pie
                                    data={pieData}
                                    options={{
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                            },
                                        },
                                        maintainAspectRatio: true,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scores Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-2">👁️</div>
                            <div className="text-2xl font-bold text-red-600">{results.visual_score}%</div>
                            <div className="text-sm text-gray-600">Visual</div>
                        </div>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-2">👂</div>
                            <div className="text-2xl font-bold text-blue-600">{results.auditory_score}%</div>
                            <div className="text-sm text-gray-600">Auditory</div>
                        </div>
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-2">📚</div>
                            <div className="text-2xl font-bold text-green-600">{results.reading_score}%</div>
                            <div className="text-sm text-gray-600">Reading/Writing</div>
                        </div>
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-2">✋</div>
                            <div className="text-2xl font-bold text-purple-600">{results.kinesthetic_score}%</div>
                            <div className="text-sm text-gray-600">Kinesthetic</div>
                        </div>
                    </div>

                    {/* Study Tips */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">💡</span>
                            Personalized Study Tips
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {results.study_tips.map((tip, index) => (
                                <div key={index} className="flex items-start bg-indigo-50 rounded-lg p-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                                        {index + 1}
                                    </div>
                                    <p className="text-gray-700">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-lg"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => router.push('/learning-style-quiz')}
                            className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 shadow-lg"
                        >
                            Retake Quiz
                        </button>
                        <button
                            onClick={() => router.push('/learn')}
                            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg"
                        >
                            Start Learning
                        </button>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
