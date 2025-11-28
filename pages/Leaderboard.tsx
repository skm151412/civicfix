import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/MainLayout';
import Card from '../components/Card';
import { getTopContributors, UserProfile } from '../services/userService';
import { badgeMap } from '../config/badges';

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaders = async () => {
      try {
        setLoading(true);
        setError(null);
        const users = await getTopContributors(20);
        setLeaders(users);
      } catch (err) {
        console.error(err);
        setError('Unable to load leaderboard right now.');
      } finally {
        setLoading(false);
      }
    };
    loadLeaders();
  }, []);

  const formattedLeaders = useMemo(() => {
    return leaders.map((user, index) => ({
      ...user,
      rank: index + 1,
      badges: user.badges ?? [],
    }));
  }, [leaders]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">Gamified impact</p>
          <h1 className="text-3xl font-semibold text-white">Civic leaderboard</h1>
          <p className="text-slate-400 mt-1">Recognizing the most active neighbors reporting and validating hazards.</p>
        </div>

        <Card className="bg-slate-900/60 border-white/10">
          <div className="grid grid-cols-[80px_1fr_140px_140px] text-xs uppercase tracking-[0.2em] text-slate-500 px-6 py-3">
            <span>Rank</span>
            <span>Citizen</span>
            <span>Karma Points</span>
            <span>Reports</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading leaderboard…</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : !formattedLeaders.length ? (
            <div className="p-8 text-center text-slate-400">No contributors yet. Encourage your community to report their first issue.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {formattedLeaders.map((leader) => (
                <div key={leader.uid} className="grid grid-cols-[80px_1fr_140px_140px] items-center px-6 py-4 text-slate-100">
                  <div className="text-2xl font-semibold text-white/80">#{leader.rank}</div>
                  <div>
                    <p className="text-lg font-semibold text-white">{leader.name || leader.email}</p>
                    {leader.badges.length ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {leader.badges.map((badgeId) => {
                          const badge = badgeMap[badgeId];
                          if (!badge) return null;
                          return (
                            <span
                              key={badgeId}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badge.color}`}
                              title={badge.description}
                            >
                              {badge.icon} {badge.label}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold mt-1 px-2.5 py-1 rounded-2xl border text-slate-300 bg-white/5 border-white/15">
                        No badges yet
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-emerald-300">{leader.karma} pts</div>
                  <div className="text-sm text-slate-300">{leader.reportsCount} issues</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
