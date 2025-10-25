'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Award, Lock, Trophy, Star, TrendingUp } from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  color: string;
  points: number;
}

interface StudentBadge {
  id: number;
  badge_id: number;
  earned_at: string;
  verification_code: string;
  badge: Badge;
}

export default function AchievementsPage() {
  const [earnedBadges, setEarnedBadges] = useState<StudentBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({ total_badges: 0, total_points: 0, by_tier: {} });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8002';

      // Fetch earned badges
      const earnedResponse = await fetch(`${API_BASE}/api/v1/mastery/students/badges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (earnedResponse.ok) {
        const earnedData = await earnedResponse.json();
        setEarnedBadges(earnedData.badges);
        setStats(earnedData);
      }

      // Fetch all available badges
      const allResponse = await fetch(`${API_BASE}/api/v1/mastery/badges`);

      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllBadges(allData.badges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2'
    };
    return colors[tier as keyof typeof colors] || '#9CA3AF';
  };

  const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badge_id));

  const filteredBadges = allBadges.filter(badge => {
    if (filter === 'all') return true;
    if (filter === 'earned') return earnedBadgeIds.has(badge.id);
    if (filter === 'locked') return !earnedBadgeIds.has(badge.id);
    return badge.tier === filter || badge.category === filter;
  });

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Achievements...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Achievements</h1>
            <p className="text-gray-600">Earn badges and collect points for your accomplishments</p>
          </div>

          {/* Stats Dashboard */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto mb-2" />
                <p className="text-3xl font-bold">{stats.total_badges}</p>
                <p className="text-sm opacity-90">Total Badges</p>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 mx-auto mb-2" />
                <p className="text-3xl font-bold">{stats.total_points}</p>
                <p className="text-sm opacity-90">Total Points</p>
              </div>
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-2" />
                <p className="text-3xl font-bold">{(stats.by_tier as any)?.gold || 0}</p>
                <p className="text-sm opacity-90">Gold Badges</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p className="text-3xl font-bold">{(stats.by_tier as any)?.platinum || 0}</p>
                <p className="text-sm opacity-90">Platinum Badges</p>
              </div>
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {['bronze', 'silver', 'gold', 'platinum'].map(tier => (
              <div key={tier} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTierColor(tier) }}
                  />
                  <p className="font-semibold capitalize">{tier}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.by_tier as any)?.[tier] || 0}
                </p>
                <p className="text-xs text-gray-500">badges earned</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Badges
              </button>
              <button
                onClick={() => setFilter('earned')}
                className={`px-4 py-2 rounded-lg ${filter === 'earned' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilter('locked')}
                className={`px-4 py-2 rounded-lg ${filter === 'locked' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Locked
              </button>
              {['mastery', 'streak', 'achievement', 'social'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg capitalize ${filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBadges.map(badge => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const earnedBadge = earnedBadges.find(eb => eb.badge_id === badge.id);

              return (
                <div
                  key={badge.id}
                  className={`bg-white p-6 rounded-lg shadow transition-all hover:shadow-lg ${!isEarned ? 'opacity-60' : ''
                    }`}
                >
                  <div className="text-center">
                    {/* Badge Icon */}
                    <div
                      className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-4xl"
                      style={{
                        backgroundColor: isEarned ? badge.color + '20' : '#F3F4F6',
                        border: `3px solid ${isEarned ? badge.color : '#D1D5DB'}`
                      }}
                    >
                      {isEarned ? badge.icon : <Lock className="w-8 h-8 text-gray-400" />}
                    </div>

                    {/* Badge Name */}
                    <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>

                    {/* Tier Badge */}
                    <div className="mb-2">
                      <span
                        className="inline-block px-2 py-1 text-xs font-semibold rounded-full capitalize"
                        style={{
                          backgroundColor: badge.color + '20',
                          color: badge.color
                        }}
                      >
                        {badge.tier}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>

                    {/* Points */}
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{badge.points} pts</span>
                    </div>

                    {/* Earned Date */}
                    {isEarned && earnedBadge && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Earned {new Date(earnedBadge.earned_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {earnedBadge.verification_code}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No badges found matching your filter</p>
            </div>
          )}

          {/* Recent Achievements */}
          {earnedBadges.length > 0 && filter === 'all' && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">🎉 Recent Achievements</h2>
              <div className="space-y-3">
                {earnedBadges.slice(-5).reverse().map(eb => (
                  <div key={eb.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: eb.badge.color + '20',
                        border: `2px solid ${eb.badge.color}`
                      }}
                    >
                      {eb.badge.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{eb.badge.name}</p>
                      <p className="text-sm text-gray-600">{eb.badge.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(eb.earned_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-semibold text-yellow-600">
                        +{eb.badge.points} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
