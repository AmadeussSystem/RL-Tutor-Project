'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import { API_BASE } from '@/app/config/api';
import { Target, TrendingUp, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface SkillGap {
    id: number;
    skill_name: string;
    current_level: number;
    target_level: number;
    severity: string;
    priority: number;
    estimated_time_hours: number;
    recommendations: string[];
    progress: number;
    created_at: string;
}

export default function SkillGapsPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [gaps, setGaps] = useState<SkillGap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadGaps();
    }, [isAuthenticated]);

    const loadGaps = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to view skill gaps');
            }

            const response = await fetch(`${API_BASE}/skill-gaps/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load skill gaps');
            }

            const data = await response.json();
            setGaps(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeGaps = async () => {
        try {
            setIsAnalyzing(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to analyze gaps');
            }

            const response = await fetch(`${API_BASE}/skill-gaps/analyze`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to analyze gaps');
            }

            await loadGaps();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
            case 'high':
                return <AlertTriangle className="w-5 h-5" />;
            case 'medium':
                return <Target className="w-5 h-5" />;
            case 'low':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <Target className="w-5 h-5" />;
        }
    };

    if (isLoading) {
        return (
            <Sidebar>
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                        <p className="text-xl">Loading skill gaps...</p>
                    </div>
                </div>
            </Sidebar>
        );
    }

    return (
        <Sidebar>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                    <Target className="w-8 h-8 text-purple-400" />
                                    Skill Gap Analysis
                                </h1>
                                <p className="text-gray-400">Identify and track your learning gaps with AI-powered insights</p>
                            </div>
                            <button
                                onClick={analyzeGaps}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Gaps'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {gaps.length === 0 ? (
                        <div className="text-center py-16">
                            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No skill gaps detected</h3>
                            <p className="text-gray-400 mb-6">
                                {isAnalyzing ? 'Analyzing your performance...' : 'Click "Analyze Gaps" to identify areas for improvement'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Target className="w-6 h-6 text-purple-400" />
                                        <h3 className="text-gray-400 text-sm">Total Gaps</h3>
                                    </div>
                                    <p className="text-3xl font-bold">{gaps.length}</p>
                                </div>

                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle className="w-6 h-6 text-red-400" />
                                        <h3 className="text-gray-400 text-sm">Critical</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-red-400">
                                        {gaps.filter(g => g.severity.toLowerCase() === 'critical').length}
                                    </p>
                                </div>

                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="w-6 h-6 text-blue-400" />
                                        <h3 className="text-gray-400 text-sm">Est. Time</h3>
                                    </div>
                                    <p className="text-3xl font-bold">
                                        {gaps.reduce((sum, g) => sum + g.estimated_time_hours, 0)}h
                                    </p>
                                </div>

                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="w-6 h-6 text-green-400" />
                                        <h3 className="text-gray-400 text-sm">Avg Progress</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-green-400">
                                        {Math.round(gaps.reduce((sum, g) => sum + g.progress, 0) / gaps.length)}%
                                    </p>
                                </div>
                            </div>

                            {/* Skill Gaps List */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold mb-4">Your Skill Gaps</h2>
                                {gaps.sort((a, b) => b.priority - a.priority).map((gap) => (
                                    <div
                                        key={gap.id}
                                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold">{gap.skill_name}</h3>
                                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getSeverityColor(gap.severity)}`}>
                                                        {getSeverityIcon(gap.severity)}
                                                        {gap.severity}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                                    <span>Priority: {gap.priority}/10</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {gap.estimated_time_hours}h estimated
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Current: {gap.current_level}/10</span>
                                                <span className="text-gray-400">Target: {gap.target_level}/10</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                                                    style={{ width: `${gap.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">{gap.progress}% complete</p>
                                        </div>

                                        {/* Recommendations */}
                                        {gap.recommendations && gap.recommendations.length > 0 && (
                                            <div className="bg-zinc-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold mb-2 text-purple-400">Recommendations:</h4>
                                                <ul className="space-y-1">
                                                    {gap.recommendations.map((rec, idx) => (
                                                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                                            <span className="text-purple-400 mt-1">•</span>
                                                            <span>{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
