import { ActivityList } from '../components/loyalty/ActivityList';
import { PageHeader, Skeleton } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';
import { formatMonthYear } from '../lib/format';
import type { ActivityItem } from '../lib/types';

export default function Activity() {
  const { activity, loading } = useLoyalty();

  const groups: { month: string; items: ActivityItem[] }[] = [];
  for (const item of activity) {
    const month = formatMonthYear(item.createdAt);
    const last = groups[groups.length - 1];
    if (last?.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <PageHeader title="Recent Activity" />
      {loading ? (
        <Skeleton className="h-96" />
      ) : groups.length === 0 ? (
        <ActivityList items={[]} />
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <section key={g.month}>
              <h2 className="label-caps mb-2.5 px-1 font-sans">{g.month}</h2>
              <ActivityList items={g.items} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
