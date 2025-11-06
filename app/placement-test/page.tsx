"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import Sidebar from "../components/Sidebar"
import { Brain, CheckCircle, XCircle, Loader } from "lucide-react"

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

export default function PlacementTest() {
    const router = useRouter()
    const { user, token } = useAuth()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [questions, setQuestions] = useState<PlacementQuestion[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Answer[]>([])
    const [startTime, setStartTime] = useState<number>(Date.now())
    const [testComplete, setTestComplete] = useState(false)
    const [unlockedSkills, setUnlockedSkills] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            router.push("/login")
            return
        }
        fetchPlacementQuestions()
    }, [token])

    const fetchPlacementQuestions = async () => {
        try {
            const response = await fetch("http://localhost:8001/api/v1/placement/test/questions", {
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
        } finally {
            setLoading(false)
        }
    }

    const handleAnswerSelect = (option: string) => {
        setSelectedAnswer(option)
    }

    const handleNextQuestion = async () => {
        if (!selectedAnswer) return

        const currentQuestion = questions[currentQuestionIndex]
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)

        // Send the selected answer to backend for validation
        const newAnswer: Answer = {
            skill_name: currentQuestion.skill_name,
            question_id: currentQuestion.question.id,
            selected_answer: selectedAnswer,
            time_spent: timeSpent,
        }

        const updatedAnswers = [...answers, newAnswer]
        setAnswers(updatedAnswers)

        // Move to next question or finish
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            setSelectedAnswer(null)
            setStartTime(Date.now())
        } else {
            // Submit test
            await submitTest(updatedAnswers)
        }
    }

    const submitTest = async (finalAnswers: Answer[]) => {
        setSubmitting(true)
        setError(null)
        try {
            console.log("Submitting answers:", finalAnswers)

            const response = await fetch("http://localhost:8001/api/v1/placement/test/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ answers: finalAnswers }),
            })

            console.log("Response status:", response.status)

            if (response.ok) {
                const data = await response.json()
                console.log("Response data:", data)
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

    const handleFinish = () => {
        router.push("/dashboard")
    }

    if (loading) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <Loader className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
            </Sidebar>
        )
    }

    if (testComplete) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black">
                    <div className="max-w-3xl mx-auto p-8">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-white mb-4">
                                Placement Test Complete!
                            </h1>
                            <p className="text-gray-400 mb-8">
                                Based on your performance, we've unlocked {unlockedSkills.length} skills for you.
                            </p>

                            {unlockedSkills.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-white mb-4">Unlocked Skills:</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {unlockedSkills.map((skill) => (
                                            <div
                                                key={skill.id}
                                                className="bg-zinc-800 border border-green-500/30 rounded-lg p-4"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                                    <h3 className="font-semibold text-white">{skill.name}</h3>
                                                </div>
                                                <p className="text-sm text-gray-400">{skill.category}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleFinish}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </Sidebar>
        )
    }

    if (questions.length === 0) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black">
                    <div className="max-w-3xl mx-auto p-8 text-center">
                        <p className="text-gray-400">No placement questions available.</p>
                    </div>
                </div>
            </Sidebar>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
        <Sidebar>
            <div className="min-h-screen bg-black p-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-8 h-8 text-purple-400" />
                            <h1 className="text-3xl font-bold text-white">Placement Test</h1>
                        </div>
                        <p className="text-gray-400">
                            Answer these questions to determine your starting skill levels
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

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
                                    <h3 className="text-lg font-semibold text-red-300 mb-1">Submission Failed</h3>
                                    <p className="text-red-200/80 mb-4">{error}</p>
                                    <button
                                        onClick={() => setError(null)}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Question Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                        <div className="mb-6">
                            <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm mb-4">
                                {currentQuestion.category} - {currentQuestion.skill_name}
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-4">
                                {currentQuestion.question.question_text}
                            </h2>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 mb-8">
                            {currentQuestion.question.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(option)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswer === option
                                            ? "border-purple-500 bg-purple-500/10"
                                            : "border-zinc-700 hover:border-zinc-600 bg-zinc-800"
                                        }`}
                                >
                                    <span className="text-white">{option}</span>
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => {
                                    if (currentQuestionIndex > 0) {
                                        setCurrentQuestionIndex(currentQuestionIndex - 1)
                                        setSelectedAnswer(null)
                                    }
                                }}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            <button
                                onClick={handleNextQuestion}
                                disabled={!selectedAnswer || submitting}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </span>
                                ) : currentQuestionIndex === questions.length - 1 ? (
                                    "Finish Test"
                                ) : (
                                    "Next Question"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    )
}
