"use client";

import { useState, useEffect } from "react";
import { Brain, CheckCircle, XCircle, Calendar, TrendingUp, Clock, Plus, Trash2 } from "lucide-react";
import Sidebar from "@/app/components/Sidebar";

interface FlashCard {
  id: number;
  concept_name: string;
  question: string;
  answer: string;
  difficulty: number;
  interval: number;
  repetitions: number;
  ease_factor: number;
  streak: number;
  retention_rate: number;
  next_review_date: string;
  overdue_days?: number;
}

interface FlashCardStats {
  total_cards: number;
  due_cards: number;
  upcoming_cards: number;
  total_reviews: number;
  overall_accuracy: number;
  average_retention_rate: number;
  longest_streak: number;
  mastered_cards: number;
}

export default function FlashcardsPage() {
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [currentCard, setCurrentCard] = useState<FlashCard | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState<FlashCardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newCard, setNewCard] = useState({
    concept_name: "",
    question: "",
    answer: "",
    difficulty: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to access flashcards");
      setIsLoading(false);
      return;
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

      // Load due cards
      const dueResponse = await fetch(
        `${API_BASE}/api/v1/smart-recommendations/flashcards/due`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (dueResponse.ok) {
        const dueData = await dueResponse.json();
        setDueCards(dueData.flashcards || []);
        if (dueData.flashcards && dueData.flashcards.length > 0) {
          setCurrentCard(dueData.flashcards[0]);
        }
      }

      // Load stats
      const statsResponse = await fetch(
        `${API_BASE}/api/v1/smart-recommendations/flashcards/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      setError("Failed to load flashcards");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const reviewCard = async (quality: number) => {
    if (!currentCard) return;

    setIsReviewing(true);
    const token = localStorage.getItem("token");
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/smart-recommendations/flashcards/${currentCard.id}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quality }),
        }
      );

      if (response.ok) {
        // Move to next card
        const nextIndex = currentIndex + 1;
        if (nextIndex < dueCards.length) {
          setCurrentIndex(nextIndex);
          setCurrentCard(dueCards[nextIndex]);
          setShowAnswer(false);
        } else {
          // All cards reviewed
          setCurrentCard(null);
          await loadData(); // Reload data
        }
      } else {
        setError("Failed to record review");
      }
    } catch (err) {
      setError("Failed to submit review");
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  };

  const createFlashcard = async () => {
    if (!newCard.concept_name || !newCard.question || !newCard.answer) {
      setError("Please fill in all fields");
      return;
    }

    const token = localStorage.getItem("token");
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/smart-recommendations/flashcards/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newCard,
            tags: [],
          }),
        }
      );

      if (response.ok) {
        setShowCreateForm(false);
        setNewCard({
          concept_name: "",
          question: "",
          answer: "",
          difficulty: 3,
        });
        await loadData();
      } else {
        setError("Failed to create flashcard");
      }
    } catch (err) {
      setError("Failed to create flashcard");
      console.error(err);
    }
  };

  const getQualityLabel = (quality: number) => {
    const labels = [
      "Complete Blackout",
      "Incorrect, Familiar",
      "Incorrect, Easy Recall",
      "Correct with Difficulty",
      "Correct with Hesitation",
      "Perfect Response",
    ];
    return labels[quality] || "";
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "text-green-400";
    if (difficulty <= 3) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading flashcards...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Spaced Repetition
                  </h1>
                  <p className="text-zinc-400 mt-1">Master concepts with intelligent review scheduling</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                New Card
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-8 p-6 bg-zinc-950 rounded-xl border border-zinc-800">
              <h2 className="text-xl font-bold mb-4">Create New Flashcard</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Concept Name</label>
                  <input
                    type="text"
                    value={newCard.concept_name}
                    onChange={(e) => setNewCard({ ...newCard, concept_name: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Pythagorean Theorem"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Question</label>
                  <textarea
                    value={newCard.question}
                    onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                    placeholder="What is the question?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Answer</label>
                  <textarea
                    value={newCard.answer}
                    onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                    placeholder="What is the answer?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Difficulty (1-5): {newCard.difficulty}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newCard.difficulty}
                    onChange={(e) => setNewCard({ ...newCard, difficulty: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createFlashcard}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-medium transition-all"
                  >
                    Create Flashcard
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Due Cards</span>
                  <Calendar className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-400">{stats.due_cards}</div>
                <div className="text-sm text-zinc-500 mt-1">Ready to review</div>
              </div>

              <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Total Cards</span>
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400">{stats.total_cards}</div>
                <div className="text-sm text-zinc-500 mt-1">
                  {stats.mastered_cards} mastered
                </div>
              </div>

              <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Accuracy</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400">{stats.overall_accuracy}%</div>
                <div className="text-sm text-zinc-500 mt-1">Avg retention: {stats.average_retention_rate}%</div>
              </div>

              <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Streak</span>
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400">{stats.longest_streak}</div>
                <div className="text-sm text-zinc-500 mt-1">Longest streak</div>
              </div>
            </div>
          )}

          {/* Review Card */}
          {currentCard ? (
            <div className="bg-zinc-950 rounded-xl p-8 border border-zinc-800 mb-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-zinc-400">
                    Card {currentIndex + 1} of {dueCards.length}
                  </span>
                  <span className={`text-sm font-mono ${getDifficultyColor(currentCard.difficulty)}`}>
                    Difficulty: {currentCard.difficulty}/5
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentCard.concept_name}</h2>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>Streak: {currentCard.streak}</span>
                  <span>•</span>
                  <span>Retention: {currentCard.retention_rate}%</span>
                  <span>•</span>
                  <span>Interval: {currentCard.interval} days</span>
                </div>
              </div>

              <div className="min-h-[200px] mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">Question:</h3>
                  <p className="text-lg leading-relaxed">{currentCard.question}</p>
                </div>

                {showAnswer && (
                  <div className="mt-6 p-4 bg-zinc-900 rounded-lg border-l-4 border-green-500">
                    <h3 className="text-lg font-bold text-green-400 mb-3">Answer:</h3>
                    <p className="text-lg leading-relaxed">{currentCard.answer}</p>
                  </div>
                )}
              </div>

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-bold text-lg transition-all"
                >
                  Show Answer
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-zinc-400 mb-4">How well did you remember?</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[0, 1, 2, 3, 4, 5].map((quality) => (
                      <button
                        key={quality}
                        onClick={() => reviewCard(quality)}
                        disabled={isReviewing}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${quality < 3
                          ? "border-red-500 hover:bg-red-500/10"
                          : quality === 3
                            ? "border-yellow-500 hover:bg-yellow-500/10"
                            : "border-green-500 hover:bg-green-500/10"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="font-bold mb-1">{quality}</div>
                        <div className="text-xs text-zinc-400">{getQualityLabel(quality)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : dueCards.length === 0 && stats && stats.total_cards > 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
              <p className="text-zinc-400 mb-6">No cards due for review right now.</p>
              <p className="text-sm text-zinc-500">
                Come back later or create more flashcards to study.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Flashcards Yet</h2>
              <p className="text-zinc-400 mb-6">Create your first flashcard to start learning with spaced repetition.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg font-medium transition-all"
              >
                Create Your First Card
              </button>
            </div>
          )}

          {/* SM-2 Info */}
          <div className="mt-8 p-6 bg-zinc-950 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-3">About Spaced Repetition</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              This system uses the SM-2 algorithm (SuperMemo 2) for optimal review scheduling. Cards you remember well are
              shown less frequently, while challenging cards are reviewed more often. Rate each card honestly to maximize
              your retention!
            </p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
