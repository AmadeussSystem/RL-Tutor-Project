'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Spotlight } from '@/components/ui/spotlight';
import { Brain } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { register, error, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        fullName: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await register(
                formData.email,
                formData.username,
                formData.password,
                formData.fullName || undefined
            );
            
            // New users always need to take placement test
            router.push('/placement-test');
        } catch (err) {
            // Error is handled by AuthContext
        }
    };

    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

            <div className="max-w-md w-full mx-auto p-8 relative z-10">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Brain className="w-10 h-10 text-purple-400" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            RL Tutor
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
                    <p className="text-gray-400 mb-8 text-center">Start your personalized learning journey</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Choose a username"
                            />
                        </div>

                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name (Optional)
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Create a password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
