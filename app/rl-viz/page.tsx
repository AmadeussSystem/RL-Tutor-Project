'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { Brain, Activity, Target, Zap, TrendingUp } from 'lucide-react';

interface QValue {
    state: string;
    action: string;
    value: number;
}

export default function RLVisualizationPage() {
    const [qValues, setQValues] = useState<QValue[]>([]);
    const [currentState, setCurrentState] = useState({
        algebra: 0.5,
        calculus: 0.3,
        geometry: 0.7,
        statistics: 0.4,
    });
    const [explorationRate, setExplorationRate] = useState(0.1);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);

    useEffect(() => {
        // Simulate Q-values for demonstration
        const mockQValues: QValue[] = [
            { state: 'Low-Low-Low-Low', action: 'Algebra-Easy', value: 0.85 },
            { state: 'Low-Low-Low-Low', action: 'Calculus-Easy', value: 0.72 },
            { state: 'Mid-Low-Mid-Low', action: 'Geometry-Medium', value: 0.91 },
            { state: 'Mid-Low-Mid-Low', action: 'Algebra-Medium', value: 0.78 },
            { state: 'High-Mid-High-Mid', action: 'Calculus-Hard', value: 0.88 },
            { state: 'High-Mid-High-Mid', action: 'Statistics-Hard', value: 0.82 },
        ];
        setQValues(mockQValues);
    }, []);

    const makeDecision = () => {
        // Simulate epsilon-greedy decision
        const isExploring = Math.random() < explorationRate;
        if (isExploring) {
            const actions = ['Algebra', 'Calculus', 'Geometry', 'Statistics'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setSelectedAction(`${randomAction} (Exploring)`);
        } else {
            setSelectedAction('Geometry (Exploiting - Best Q-value)');
        }
    };

    return (
        <Sidebar>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-purple-400" />
                            <h1 className="text-2xl font-bold">RL Agent Visualization</h1>
                        </div>
                        <Link href="/" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Current State */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-purple-400" />
                            Current Knowledge State
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(currentState).map(([topic, value]) => (
                                <div key={topic} className="bg-zinc-900 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="capitalize font-semibold">{topic}</span>
                                        <span className="text-purple-400">{(value * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
                                            style={{ width: `${value * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Q-Table Visualization */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Target className="w-6 h-6 text-green-400" />
                            Q-Table (State-Action Values)
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-700">
                                        <th className="text-left p-3 text-gray-400">State</th>
                                        <th className="text-left p-3 text-gray-400">Action</th>
                                        <th className="text-right p-3 text-gray-400">Q-Value</th>
                                        <th className="text-right p-3 text-gray-400">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qValues.map((qv, idx) => (
                                        <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-3 font-mono text-xs">{qv.state}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                                    {qv.action}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-semibold">{qv.value.toFixed(2)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-full"
                                                            style={{ width: `${qv.value * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{(qv.value * 100).toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Decision Making Process */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-amber-400" />
                            Epsilon-Greedy Decision Making
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-zinc-900 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-2">Exploration Rate (ε)</div>
                                <div className="text-3xl font-bold text-amber-400 mb-2">{explorationRate * 100}%</div>
                                <div className="text-xs text-gray-500">
                                    {explorationRate * 100}% chance to explore, {(1 - explorationRate) * 100}% to exploit
                                </div>
                            </div>

                            <div className="bg-zinc-900 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-2">Current Decision</div>
                                <div className="text-xl font-bold text-purple-400 mb-2">
                                    {selectedAction || 'Click "Make Decision" below'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Based on current knowledge state
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={makeDecision}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            Make Decision (Simulate Agent)
                        </button>
                    </div>

                    {/* Learning Process */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                            Q-Learning Update Formula
                        </h2>

                        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
                            <div className="text-center font-mono text-lg mb-4">
                                <span className="text-purple-400">Q(s,a)</span> ← <span className="text-purple-400">Q(s,a)</span> +
                                <span className="text-green-400"> α</span>[
                                <span className="text-amber-400">r</span> +
                                <span className="text-blue-400"> γ</span>·max <span className="text-purple-400">Q(s',a')</span> -
                                <span className="text-purple-400"> Q(s,a)</span>]
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-zinc-900 rounded-lg p-4">
                                <div className="text-purple-400 font-semibold mb-2">Q(s,a)</div>
                                <div className="text-xs text-gray-400">Current Q-value for state-action pair</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-4">
                                <div className="text-green-400 font-semibold mb-2">α = 0.1</div>
                                <div className="text-xs text-gray-400">Learning rate (how fast we update)</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-4">
                                <div className="text-amber-400 font-semibold mb-2">r</div>
                                <div className="text-xs text-gray-400">Reward received from environment</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-4">
                                <div className="text-blue-400 font-semibold mb-2">γ = 0.9</div>
                                <div className="text-xs text-gray-400">Discount factor (future rewards)</div>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">How It Works</h3>
                        <p className="text-gray-300 text-sm">
                            The RL agent maintains a Q-table that maps state-action pairs to expected rewards.
                            Using epsilon-greedy exploration, it balances trying new content (exploration) with
                            recommending known effective content (exploitation). After each student interaction,
                            the Q-values are updated based on the reward received, gradually improving recommendations.
                        </p>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
