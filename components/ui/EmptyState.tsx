import { ShopArt, VoiceArt } from './ShopArt';

/**
 * An empty state is the first thing a new operator sees, so it carries the
 * illustration rather than being a dashed box with a sentence in it. `art`
 * is opt-out: lists that empty out mid-session (a search with no matches) get
 * no picture, because there the message is the whole point.
 */
export function EmptyState({
  title,
  hint,
  action,
  art,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  art?: 'shop' | 'voice';
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      {art === 'shop' && <ShopArt className="mx-auto mb-4 h-32 w-auto max-w-[18rem]" />}
      {art === 'voice' && <VoiceArt className="mx-auto mb-4 h-28 w-auto max-w-[18rem]" />}
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
