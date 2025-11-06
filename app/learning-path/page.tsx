'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import { Loader, BookOpen, Target } from 'lucide-react';

export default function LearningPathPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Extract skill information from query params
        const skillId = searchParams.get('skillId');
        const skillName = searchParams.get('skillName');

        // Redirect to learning page with skill context
        // For now, we'll go to the general learn page
        // In the future, this can be extended to create a personalized learning path
        router.push(`/learn?skill=${skillName || 'Mathematics'}`);
    }, [isAuthenticated, router, searchParams]);

    return (
        <Sidebar>
            <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-pulse">
                            <BookOpen className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Preparing Your Learning Path</h1>
                    <p className="text-zinc-400 mb-6">Loading your personalized learning session...</p>
                    <div className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-purple-500" />
                        <span className="text-zinc-400">Initializing</span>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
