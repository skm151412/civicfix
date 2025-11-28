export interface BadgeStats {
  reportsCount: number;
  karma: number;
  upvoteImpact: number;
}

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  criteria: (stats: BadgeStats) => boolean;
}

export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'reporter',
    label: 'Reporter',
    description: 'Logged at least one issue.',
    icon: 'R',
    color: 'bg-blue-500/10 text-blue-200 border-blue-400/30',
    criteria: (stats) => stats.reportsCount >= 1,
  },
  {
    id: 'guardian',
    label: 'Guardian',
    description: 'Helped close ten or more issues.',
    icon: 'G',
    color: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
    criteria: (stats) => stats.reportsCount >= 10,
  },
  {
    id: 'influencer',
    label: 'Influencer',
    description: 'Issues gathered 50+ upvotes total.',
    icon: 'I',
    color: 'bg-amber-500/10 text-amber-200 border-amber-400/40',
    criteria: (stats) => stats.upvoteImpact >= 50,
  },
];

export const evaluateBadges = (stats: Partial<BadgeStats> = {}): string[] => {
  const safeStats: BadgeStats = {
    reportsCount: stats.reportsCount ?? 0,
    karma: stats.karma ?? 0,
    upvoteImpact: stats.upvoteImpact ?? 0,
  };
  return badgeDefinitions
    .filter((badge) => badge.criteria(safeStats))
    .map((badge) => badge.id);
};

export const badgeMap = badgeDefinitions.reduce<Record<string, BadgeDefinition>>((acc, badge) => {
  acc[badge.id] = badge;
  return acc;
}, {});
