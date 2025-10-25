import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg font-semibold">Loading...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait</p>
            </div>
        </div>
    );
}
