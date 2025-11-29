"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import Sidebar from "../components/Sidebar"
import { 
    Brain, CheckCircle, XCircle, Loader, Clock, 
    ChevronRight, ChevronLeft, SkipForward, Target,
    Award, BookOpen, Sparkles, Trophy, ArrowRight,
    Zap, TrendingUp, Star
} from "lucide-react"

interface PlacementQuestion {
    skill_id: number
    skill_name: string
    category: string
    question: {
        id: number
        title: string
        question_text: string
        options: string[]
        difficulty: number
    }
}

interface Answer {
    skill_name: string
    question_id: number
    selected_answer: string
    time_spent: number
}

interface UnlockedSkill {
    id: number
    name: string
    category: string
    mastery_level: number
}

const categoryColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
    "Algebra": { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", gradient: "from-blue-600 to-cyan-600" },
    "Trigonometry": { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", gradient: "from-green-600 to-emerald-600" },
    "Geometry": { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", gradient: "from-orange-600 to-amber-600" },
    "Calculus": { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", gradient: "from-purple-600 to-pink-600" },
    "Advanced": { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", gradient: "from-red-600 to-rose-600" },
    "Statistics": { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", gradient: "from-yellow-600 to-orange-600" },
}

const difficultyLabels: Record<number, { label: string; color: string }> = {
    1: { label: "Easy", color: "text-green-400" },
    2: { label: "Medium", color: "text-yellow-400" },
    3: { label: "Hard", color: "text-orange-400" },
    4: { label: "Advanced", color: "text-red-400" },
    5: { label: "Expert", color: "text-purple-400" },
}

// Get category color or default
const getCategoryStyle = (category: string) => {
    return categoryColors[category] || { 
        bg: "bg-zinc-500/10", 
        border: "border-zinc-500/30", 
        text: "text-zinc-400",
        gradient: "from-zinc-600 to-gray-600"
    }
}

export default function PlacementTest() {
    const router = useRouter()
    const { user, token } = useAuth()
    
    // Test state
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [questions, setQuestions] = useState<PlacementQuestion[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Answer[]>([])
    const [skippedQuestions, setSkippedQuestions] = useState<number[]>([])
    
    // Timer state
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
    const [totalTimeSpent, setTotalTimeSpent] = useState(0)
    const [currentQuestionTime, setCurrentQuestionTime] = useState(0)
    
    // UI state
    const [showIntro, setShowIntro] = useState(true)
    const [testComplete, setTestComplete] = useState(false)
    const [unlockedSkills, setUnlockedSkills] = useState<UnlockedSkill[]>([])
    const [error, setError] = useState<string | null>(null)
    const [animateIn, setAnimateIn] = useState(false)
    
    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentQuestionTime(Math.floor((Date.now() - questionStartTime) / 1000))
        }, 1000)
        return () => clearInterval(timer)
    }, [questionStartTime])

    useEffect(() => {
        if (!token) {
            router.push("/login")
            return
        }
        fetchPlacementQuestions()
    }, [token])

    useEffect(() => {
        if (!showIntro && questions.length > 0) {
            setAnimateIn(true)
        }
    }, [showIntro, currentQuestionIndex])

    const fetchPlacementQuestions = async () => {
        try {
            const response = await fetch("http://localhost:8002/api/v1/placement/test/questions", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setQuestions(data.questions)
            }
        } catch (error) {
            console.error("Error fetching placement questions:", error)
            setError("Failed to load questions. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleAnswerSelect = (option: string) => {
        setSelectedAnswer(option)
    }

    const handleNextQuestion = async () => {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
        setTotalTimeSpent(prev => prev + timeSpent)

        if (selectedAnswer) {
            const currentQuestion = questions[currentQuestionIndex]
            const newAnswer: Answer = {
                skill_name: currentQuestion.skill_name,
                question_id: currentQuestion.question.id,
                selected_answer: selectedAnswer,
                time_spent: timeSpent,
            }
            setAnswers(prev => [...prev, newAnswer])
        }

        // Move to next question or finish
        if (currentQuestionIndex < questions.length - 1) {
            setAnimateIn(false)
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1)
                setSelectedAnswer(null)
                setQuestionStartTime(Date.now())
                setCurrentQuestionTime(0)
                setAnimateIn(true)
            }, 150)
        } else {
            // Collect all answers including the current one
            const finalAnswers = selectedAnswer 
                ? [...answers, {
                    skill_name: questions[currentQuestionIndex].skill_name,
                    question_id: questions[currentQuestionIndex].question.id,
                    selected_answer: selectedAnswer,
                    time_spent: timeSpent,
                }]
                : answers
            await submitTest(finalAnswers)
        }
    }

    const handleSkipQuestion = () => {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
        setTotalTimeSpent(prev => prev + timeSpent)
        setSkippedQuestions(prev => [...prev, currentQuestionIndex])

        if (currentQuestionIndex < questions.length - 1) {
            setAnimateIn(false)
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1)
                setSelectedAnswer(null)
                setQuestionStartTime(Date.now())
                setCurrentQuestionTime(0)
                setAnimateIn(true)
            }, 150)
        } else {
            submitTest(answers)
        }
    }

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setAnimateIn(false)
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev - 1)
                setSelectedAnswer(null)
                setQuestionStartTime(Date.now())
                setCurrentQuestionTime(0)
                setAnimateIn(true)
            }, 150)
        }
    }

    const submitTest = async (finalAnswers: Answer[]) => {
        setSubmitting(true)
        setError(null)
        try {
            const response = await fetch("http://localhost:8002/api/v1/placement/test/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ answers: finalAnswers }),
            })

            if (response.ok) {
                const data = await response.json()
                setUnlockedSkills(data.unlocked_skills || [])
                setTestComplete(true)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
                setError(errorData.detail || 'Failed to submit test')
            }
        } catch (error) {
            console.error("Error submitting test:", error)
            setError(error instanceof Error ? error.message : 'Network error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const handleStartTest = () => {
        setShowIntro(false)
        setQuestionStartTime(Date.now())
    }

    const handleFinish = () => {
        router.push("/dashboard")
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Loading state
    if (loading) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
                            <Loader className="w-12 h-12 text-purple-400 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="mt-4 text-gray-400">Loading placement test...</p>
                    </div>
                </div>
            </Sidebar>
        )
    }

    // Intro screen
    if (showIntro && !testComplete) {
        const categoryCount = new Set(questions.map(q => q.category)).size
        
        return (
            <Sidebar>
                <div className="min-h-screen bg-black">
                    <div className="max-w-4xl mx-auto p-8">
                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-purple-500/25">
                                <Brain className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Welcome to Your Placement Test
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                This quick assessment helps us understand your current knowledge level 
                                and personalize your learning journey.
                            </p>
                        </div>

                        {/* Test Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mb-4">
                                    <BookOpen className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{questions.length}</h3>
                                <p className="text-gray-400">Questions</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4">
                                    <Target className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{categoryCount}</h3>
                                <p className="text-gray-400">Categories</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-4">
                                    <Clock className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">~{Math.ceil(questions.length * 1.5)}</h3>
                                <p className="text-gray-400">Minutes</p>
                            </div>
                        </div>

                        {/* Categories Preview */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                Topics Covered
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {Array.from(new Set(questions.map(q => q.category))).map(category => {
                                    const style = getCategoryStyle(category)
                                    return (
                                        <span
                                            key={category}
                                            className={`px-4 py-2 rounded-lg ${style.bg} ${style.border} ${style.text} border`}
                                        >
                                            {category}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                How It Works
                            </h2>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>Answer questions at your own pace - there&apos;s no time limit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>You can skip questions you&apos;re unsure about</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>Your results will unlock skills matching your knowledge level</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>Don&apos;t worry about wrong answers - they help us personalize your path</span>
                                </li>
                            </ul>
                        </div>

                        {/* Start Button */}
                        <div className="text-center">
                            <button
                                onClick={handleStartTest}
                                className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-3 mx-auto"
                            >
                                Start Placement Test
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="mt-4 text-sm text-gray-500">
                                You can always retake this test later from settings
                            </p>
                        </div>
                    </div>
                </div>
            </Sidebar>
        )
    }

    // Test complete screen
    if (testComplete) {
        const answeredCount = answers.length
        const skippedCount = skippedQuestions.length
        const score = unlockedSkills.length
        
        return (
            <Sidebar>
                <div className="min-h-screen bg-black">
                    <div className="max-w-4xl mx-auto p-8">
                        {/* Success Animation */}
                        <div className="text-center mb-12">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                                    <Trophy className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-white mt-6 mb-4">
                                Placement Test Complete!
                            </h1>
                            <p className="text-xl text-gray-400">
                                Great job! We&apos;ve analyzed your responses and customized your learning path.
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-white">{answeredCount}</p>
                                <p className="text-sm text-gray-400">Answered</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-white">{skippedCount}</p>
                                <p className="text-sm text-gray-400">Skipped</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-green-400">{score}</p>
                                <p className="text-sm text-gray-400">Skills Unlocked</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-purple-400">{formatTime(totalTimeSpent)}</p>
                                <p className="text-sm text-gray-400">Time Spent</p>
                            </div>
                        </div>

                        {/* Unlocked Skills */}
                        {unlockedSkills.length > 0 && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
                                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <Award className="w-6 h-6 text-yellow-400" />
                                    Skills You&apos;ve Unlocked
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {unlockedSkills.map((skill, index) => {
                                        const style = getCategoryStyle(skill.category)
                                        return (
                                            <div
                                                key={skill.id}
                                                className={`bg-zinc-800/50 border ${style.border} rounded-xl p-4 transform transition-all duration-300`}
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{skill.name}</h3>
                                                        <p className={`text-sm ${style.text}`}>{skill.category}</p>
                                                        <div className="flex items-center gap-1 mt-2">
                                                            {[1, 2, 3, 4, 5].map((level) => (
                                                                <Star
                                                                    key={level}
                                                                    className={`w-4 h-4 ${level <= skill.mastery_level ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* What's Next */}
                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                What&apos;s Next?
                            </h2>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs text-purple-400 font-bold">1</span>
                                    </div>
                                    <span>Explore your personalized learning dashboard</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs text-purple-400 font-bold">2</span>
                                    </div>
                                    <span>Start with recommended skills based on your level</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs text-purple-400 font-bold">3</span>
                                    </div>
                                    <span>Track your progress and unlock new skills as you learn</span>
                                </li>
                            </ul>
                        </div>

                        {/* Continue Button */}
                        <div className="text-center">
                            <button
                                onClick={handleFinish}
                                className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-3 mx-auto"
                            >
                                Go to Dashboard
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </Sidebar>
        )
    }

    // No questions available
    if (questions.length === 0) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black">
                    <div className="max-w-3xl mx-auto p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full mb-6">
                            <XCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">No Questions Available</h1>
                        <p className="text-gray-400 mb-6">
                            The placement test is not available at the moment. Please try again later.
                        </p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </Sidebar>
        )
    }

    // Main test view - Active question screen
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100
    const categoryStyle = getCategoryStyle(currentQuestion.category)
    const difficultyInfo = difficultyLabels[currentQuestion.question.difficulty] || { label: "Medium", color: "text-yellow-400" }

    return (
        <Sidebar>
            <div className="min-h-screen bg-black">
                <div className="max-w-4xl mx-auto p-8">
                    {/* Header with Progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center`}>
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Placement Test</h1>
                                    <p className="text-sm text-gray-400">{currentQuestion.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono">{formatTime(currentQuestionTime)}</span>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {currentQuestionIndex + 1} / {questions.length}
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${categoryStyle.gradient} transition-all duration-500 ease-out`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-red-200">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="ml-auto text-gray-400 hover:text-white"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Question Card */}
                    <div 
                        className={`bg-zinc-900/80 border ${categoryStyle.border} rounded-2xl p-8 backdrop-blur-sm transform transition-all duration-300 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    >
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} border`}>
                                    {currentQuestion.skill_name}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 ${difficultyInfo.color}`}>
                                    {difficultyInfo.label}
                                </span>
                            </div>
                            {skippedQuestions.includes(currentQuestionIndex) && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    Skipped
                                </span>
                            )}
                        </div>

                        {/* Question Text */}
                        <h2 className="text-xl font-semibold text-white mb-8 leading-relaxed">
                            {currentQuestion.question.question_text}
                        </h2>

                        {/* Answer Options */}
                        <div className="space-y-3 mb-8">
                            {currentQuestion.question.options.map((option, index) => {
                                const optionLetter = String.fromCharCode(65 + index)
                                const isSelected = selectedAnswer === option
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswerSelect(option)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                                            isSelected
                                                ? `border-purple-500 bg-purple-500/10`
                                                : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                                                isSelected 
                                                    ? 'bg-purple-500 text-white' 
                                                    : 'bg-zinc-700 text-gray-300 group-hover:bg-zinc-600'
                                            }`}>
                                                {optionLetter}
                                            </span>
                                            <span className="text-white flex-1">{option}</span>
                                            {isSelected && (
                                                <CheckCircle className="w-5 h-5 text-purple-400" />
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <button
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSkipQuestion}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-yellow-400 transition-colors"
                                >
                                    <SkipForward className="w-4 h-4" />
                                    Skip
                                </button>

                                <button
                                    onClick={handleNextQuestion}
                                    disabled={!selectedAnswer || submitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : currentQuestionIndex === questions.length - 1 ? (
                                        <>
                                            Complete Test
                                            <CheckCircle className="w-5 h-5" />
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question Overview */}
                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {questions.map((_, index) => {
                            const isAnswered = answers.some(a => questions.findIndex(q => q.question.id === a.question_id) === index)
                            const isSkipped = skippedQuestions.includes(index)
                            const isCurrent = index === currentQuestionIndex
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentQuestionIndex(index)
                                        setSelectedAnswer(null)
                                        setQuestionStartTime(Date.now())
                                        setCurrentQuestionTime(0)
                                    }}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                        isCurrent
                                            ? 'bg-purple-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-black'
                                            : isAnswered
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : isSkipped
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Sidebar>
    )
}
