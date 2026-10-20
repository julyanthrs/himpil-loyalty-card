import { Gift } from 'lucide-react';
import { drinkImage } from '../../lib/drinks';
import { formatDateTime, formatDateTimeShort } from '../../lib/format';
import type { ActivityItem } from '../../lib/types';
import { TakeawayCupIcon } from '../brand/TakeawayCupIcon';
import { Panel } from '../ui/primitives';

export function ActivityList({ items, compact = false, empty }: { items: ActivityItem[]; compact?: boolean; empty?: string }) {
  if (items.length === 0) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p className="font-serif text-lg text-espresso">No activity yet</p>
        <p className="mt-1 text-sm text-subtle">{empty ?? 'Your stamps will appear here after your first coffee.'}</p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <ul className="divide-y divide-latte/60">
        {items.map((item) => (
          <li key={item.id} className={`flex items-center gap-4 ${compact ? 'px-3 py-2.5' : 'px-3 py-3 md:px-5'}`}>
            <img
              src={drinkImage(item.drink)}
              alt=""
              loading="lazy"
              width={60}
              height={60}
              className="size-[3.75rem] shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[1.08rem] text-espresso">
                {item.kind === 'redemption' ? `Free ${item.drink}` : item.drink}
              </p>
              <p className="mt-0.5 text-[0.82rem] text-subtle">
                {compact ? formatDateTimeShort(item.createdAt) : formatDateTime(item.createdAt)}
              </p>
            </div>
            {item.kind === 'redemption' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-espresso px-3 py-1 text-xs font-medium text-ivory">
                <Gift className="size-3.5" aria-hidden /> Redeemed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 pr-1 font-serif text-[1.05rem] text-espresso">
                +{item.stamps}
                <span className="sr-only">{item.stamps === 1 ? 'stamp' : 'stamps'}</span>
                <TakeawayCupIcon className="size-6 text-espresso" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
