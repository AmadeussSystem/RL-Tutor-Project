'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/api/client';
import Sidebar from '@/app/components/Sidebar';

interface QuizQuestion {
    id: number;
    text: string;
    options: Array<{
        text: string;
        style: string;
    }>;
}

interface QuizData {
    quiz_title: string;
    description: string;
    instructions: string;
    questions: QuizQuestion[];
}

export default function LearningStyleQuiz() {
    const router = useRouter();
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const data = await api.getLearningStyleQuiz();
            setQuizData(data);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Failed to load quiz');
            setLoading(false);
        }
    };

    const handleSelectOption = (index: number) => {
        setSelectedOption(index);
    };

    const handleNext = () => {
        if (selectedOption === null) {
            setError('Please select an answer before continuing');
            return;
        }

        const newAnswers = [...answers];
        newAnswers[currentQuestion] = quizData!.questions[currentQuestion].options[selectedOption].style;
        setAnswers(newAnswers);

        if (currentQuestion < quizData!.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedOption(null);
            setError('');
        } else {
            submitQuiz(newAnswers);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setSelectedOption(null);
            setError('');
        }
    };

    const submitQuiz = async (finalAnswers: string[]) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const userId = localStorage.getItem('user_id');

            if (!token || !userId) {
                router.push('/login');
                return;
            }

            const result = await api.submitLearningStyle(userId, finalAnswers);

            // Store results temporarily for the results page
            localStorage.setItem('learning_style_results', JSON.stringify(result));
            router.push('/learning-style-results');
        } catch (err: any) {
            setError(err.message || 'Failed to submit quiz');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading quiz...</p>
                    </div>
                </div>
            </Sidebar>
        );
    }

    if (!quizData) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-lg shadow-lg max-w-md">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
                        <p className="text-gray-300 mb-4">{error || 'Failed to load quiz'}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </Sidebar>
        );
    }

    const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
    const question = quizData.questions[currentQuestion];

    return (
        <Sidebar>
            <div className="min-h-screen bg-black py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-lg p-8 mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">{quizData.quiz_title}</h1>
                        <p className="text-gray-400 mb-4">{quizData.description}</p>

                        {/* Progress Bar */}
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-400 bg-purple-500/20">
                                        Question {currentQuestion + 1} of {quizData.questions.length}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-purple-400">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-800">
                                <div
                                    style={{ width: `${progress}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-lg p-8">
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            {question.text}
                        </h2>

                        {/* Options */}
                        <div className="space-y-4">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectOption(index)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedOption === index
                                        ? 'border-purple-500 bg-purple-500/10 shadow-md'
                                        : 'border-zinc-700 hover:border-purple-400 hover:bg-zinc-900'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div
                                            className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${selectedOption === index
                                                ? 'border-purple-500 bg-purple-600'
                                                : 'border-zinc-600'
                                                }`}
                                        >
                                            {selectedOption === index && (
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-gray-300">{option.text}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0}
                                className={`px-6 py-3 rounded-lg font-semibold ${currentQuestion === 0
                                    ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-zinc-700 text-white hover:bg-zinc-600'
                                    }`}
                            >
                                Previous
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={submitting}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Submitting...
                                    </>
                                ) : currentQuestion === quizData.questions.length - 1 ? (
                                    'Submit Quiz'
                                ) : (
                                    'Next'
                                )}
                            </button>
                        </div>

                        {/* Instructions */}
                        {currentQuestion === 0 && (
                            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <p className="text-purple-300 text-sm">
                                    <strong>💡 Tip:</strong> {quizData.instructions}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
