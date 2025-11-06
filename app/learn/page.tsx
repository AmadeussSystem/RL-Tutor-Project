'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { api, Content, SessionResponse } from '@/app/api/client';
import Sidebar from '@/app/components/Sidebar';
import { Brain, ArrowRight, CheckCircle, XCircle, Award, Clock } from 'lucide-react';

export default function LearnPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [currentContent, setCurrentContent] = useState<Content | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<SessionResponse | null>(null);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionStats, setSessionStats] = useState({
        totalQuestions: 0,
        correctAnswers: 0,
        totalReward: 0,
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated]);

    const startSession = async (topic?: string) => {
        if (!user) return;

        try {
            setIsLoading(true);
            setFeedback(null);
            setError(null);
            const content = await api.startSession(user, topic);
            setCurrentContent(content);
            setStartTime(Date.now());
            setSelectedAnswer('');
            setSelectedTopic(topic || '');
        } catch (err: any) {
            setError(err.message || 'Failed to start session');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!user || !currentContent || !selectedAnswer) return;

        try {
            setIsSubmitting(true);
            setError(null);
            const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds

            const result = await api.submitAnswer(user, {
                session_id: currentContent.id,
                student_answer: selectedAnswer,
                time_spent: timeSpent,
            });

            setFeedback(result);
            setSessionStats(prev => ({
                totalQuestions: prev.totalQuestions + 1,
                correctAnswers: prev.correctAnswers + (result.is_correct ? 1 : 0),
                totalReward: prev.totalReward + result.reward,
            }));
        } catch (err: any) {
            setError(err.message || 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (feedback?.next_content) {
            setCurrentContent(feedback.next_content);
            setFeedback(null);
            setSelectedAnswer('');
            setStartTime(Date.now());
        } else {
            startSession(selectedTopic || undefined);
        }
    };

    // JEE Subject Topics - Organized by Chapters matching Skill Tree
    // Topics must match the Content table in backend
    const subjects = [
        {
            name: 'Mathematics',
            chapters: [
                { name: 'Sets and Relations', topics: ['sets_and_relations'] },
                { name: 'Quadratic Equations', topics: ['quadratic_equations'] },
                { name: 'Polynomials', topics: ['polynomials'] },
                { name: 'Sequences and Series', topics: ['sequences_and_series'] },
                { name: 'Complex Numbers', topics: ['complex_numbers'] },
                { name: 'Permutations and Combinations', topics: ['permutations_and_combinations'] },
                { name: 'Trigonometric Ratios', topics: ['trigonometric_ratios'] },
                { name: 'Trigonometric Identities', topics: ['trigonometric_identities'] },
                { name: 'Inverse Trigonometric Functions', topics: ['inverse_trigonometric_functions'] },
                { name: 'Straight Lines', topics: ['straight_lines'] },
                { name: 'Circles', topics: ['circles'] },
                { name: 'Conic Sections', topics: ['conic_sections'] },
                { name: 'Limits and Continuity', topics: ['limits_and_continuity'] },
                { name: 'Differentiation', topics: ['differentiation'] },
                { name: 'Integration', topics: ['integration'] },
            ],
            description: 'Practice IIT JEE Mathematics problems',
            icon: '📐'
        },
        {
            name: 'Physics',
            chapters: [
                { name: 'Mechanics', topics: ['mechanics'] },
                { name: 'Waves and Oscillations', topics: ['waves'] },
                { name: 'Thermodynamics', topics: ['thermodynamics'] },
                { name: 'Electromagnetism', topics: ['electromagnetism'] },
                { name: 'Optics', topics: ['optics'] },
            ],
            description: 'Practice IIT JEE Physics problems',
            icon: '⚛️'
        },
        {
            name: 'Chemistry',
            chapters: [
                { name: 'Physical Chemistry', topics: ['physical_chemistry'] },
                { name: 'Inorganic Chemistry', topics: ['inorganic_chemistry'] },
                { name: 'Organic Chemistry', topics: ['organic_chemistry'] },
            ],
            description: 'Practice IIT JEE Chemistry problems',
            icon: '🧪'
        },
        {
            name: 'Statistics & Probability',
            chapters: [
                { name: 'Statistics and Probability', topics: ['statistics'] },
            ],
            description: 'Practice Statistics and Probability problems',
            icon: '📊'
        }
    ];

    if (!user) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>
            </Sidebar>
        );
    }

    return (
        <Sidebar>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Brain className="w-8 h-8 text-purple-400" />
                            JEE Practice - Interactive Learning
                        </h1>
                        <p className="text-gray-400">AI-powered adaptive JEE questions tailored to your learning style</p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <XCircle className="w-6 h-6 text-red-400" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-red-300 mb-1">
                                        {error.includes('locked') ? 'Skill Locked' : 'Error'}
                                    </h3>
                                    <p className="text-red-200/80 mb-4">{error}</p>
                                    {error.includes('locked') && (
                                        <div className="flex gap-3">
                                            <Link
                                                href="/skill-tree"
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                                            >
                                                View Skill Tree
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => setError(null)}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    )}
                                    {!error.includes('locked') && (
                                        <button
                                            onClick={() => setError(null)}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session Stats */}
                    {sessionStats.totalQuestions > 0 && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6 flex justify-between items-center">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-gray-400 text-sm">Questions:</span>
                                    <span className="text-white font-semibold ml-2">{sessionStats.totalQuestions}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm">Correct:</span>
                                    <span className="text-green-400 font-semibold ml-2">{sessionStats.correctAnswers}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm">Accuracy:</span>
                                    <span className="text-purple-400 font-semibold ml-2">
                                        {((sessionStats.correctAnswers / sessionStats.totalQuestions) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-amber-400" />
                                <span className="text-amber-400 font-semibold">+{sessionStats.totalReward.toFixed(1)} pts</span>
                            </div>
                        </div>
                    )}

                    {!currentContent ? (
                        /* Topic Selection */
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8">
                            <h2 className="text-3xl font-bold mb-4">Choose Your Subject</h2>
                            <p className="text-gray-400 mb-8">Select a chapter to start practicing, or let the RL agent pick for you!</p>

                            <div className="space-y-6">
                                {subjects.map((subject) => (
                                    <div key={subject.name}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-3xl">{subject.icon}</span>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{subject.name}</h3>
                                                <p className="text-sm text-gray-400">{subject.description}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-4 mb-6">
                                            {subject.chapters?.map((chapter: any) => (
                                                <button
                                                    key={chapter.name}
                                                    onClick={() => {
                                                        const randomTopic = chapter.topics[Math.floor(Math.random() * chapter.topics.length)];
                                                        startSession(randomTopic);
                                                    }}
                                                    disabled={isLoading}
                                                    className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-purple-500 hover:bg-zinc-800/50 transition-all duration-200 text-left group disabled:opacity-50"
                                                >
                                                    <h4 className="font-semibold text-white group-hover:text-purple-400 mb-1">{chapter.name}</h4>
                                                    <p className="text-xs text-gray-400">{chapter.topics.length} topics</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => startSession()}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Let RL Agent Choose (Recommended)'}
                            </button>
                        </div>
                    ) : (
                        /* Question Display */
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8">
                            {/* Question Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold capitalize">
                                        {currentContent.topic.replace(/_/g, ' ')}
                                    </span>
                                    <span className="ml-3 text-gray-400 text-sm">
                                        Difficulty: {currentContent.difficulty}/10
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{Math.floor((Date.now() - startTime) / 1000)}s</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-2">{currentContent.title}</h2>
                            <p className="text-xl text-gray-300 mb-8">{currentContent.question_text}</p>

                            {!feedback ? (
                                /* Answer Options */
                                <div className="space-y-3 mb-8">
                                    {currentContent.options && currentContent.options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedAnswer(option)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedAnswer === option
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="font-semibold text-lg">{option}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                /* Feedback Display */
                                <div className={`p-6 rounded-xl mb-8 ${feedback.is_correct
                                    ? 'bg-green-500/10 border-2 border-green-500/50'
                                    : 'bg-red-500/10 border-2 border-red-500/50'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        {feedback.is_correct ? (
                                            <CheckCircle className="w-8 h-8 text-green-400" />
                                        ) : (
                                            <XCircle className="w-8 h-8 text-red-400" />
                                        )}
                                        <h3 className="text-2xl font-bold">
                                            {feedback.is_correct ? 'Correct!' : 'Incorrect'}
                                        </h3>
                                    </div>
                                    <p className="text-lg mb-4">{feedback.explanation}</p>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-400" />
                                        <span className="text-amber-400 font-semibold">Reward: +{feedback.reward.toFixed(1)} points</span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!feedback ? (
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={!selectedAnswer || isSubmitting}
                                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextQuestion}
                                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    Next Question
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
