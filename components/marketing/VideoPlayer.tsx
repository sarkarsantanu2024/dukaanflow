'use client';

/**
 * A YouTube video that costs nothing until somebody wants it.
 *
 * A real YouTube embed loads about a megabyte of player script the moment the
 * page opens, whether or not anyone presses play — on the landing page's first
 * screen that is the difference between a fast page and a slow one, and speed
 * is part of how search ranks it. So this shows the thumbnail and a play
 * button, and swaps in the player (the privacy-enhanced youtube-nocookie one)
 * only on a tap.
 *
 * With no video yet it is a branded "coming soon" frame of the same shape, so
 * the layout does not move when the video arrives.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Say } from './Say';
import type { Words } from '@/lib/marketing-copy';

const SOON: Words = {
  en: 'Video coming soon',
  bn: 'ভিডিও শীঘ্রই আসছে',
  hi: 'वीडियो जल्द आ रहा है',
};

export function VideoPlayer({
  videoId,
  thumb,
  title,
  size = 'card',
  priority = false,
}: {
  /** The bare YouTube id, or '' when the video is not recorded yet. */
  videoId: string;
  /** A custom thumbnail that exists in `public/`, or null for YouTube's own. */
  thumb: string | null;
  title: Words;
  /** `hero` is the big one beside the headline; `card` sits in the gallery. */
  size?: 'hero' | 'card';
  priority?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const picture = thumb ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);
  const hero = size === 'hero';

  return (
    <div
      className={clsx(
        'relative aspect-video w-full overflow-hidden bg-brand-900',
        hero ? 'rounded-3xl shadow-float ring-1 ring-black/5' : 'rounded-2xl',
      )}
    >
      {playing && videoId ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title.en}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          disabled={!videoId}
          onClick={() => setPlaying(true)}
          aria-label={title.en}
          className="group absolute inset-0 flex h-full w-full items-center justify-center text-white disabled:cursor-default"
        >
          {picture ? (
            // A plain <img>: the thumbnail may be YouTube's, and next/image would
            // need the domain allow-listed for no gain on a one-off picture.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picture}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900"
            />
          )}
          {/* Darkens the picture enough for the button and words to read. */}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <span className="relative flex flex-col items-center gap-3 px-4 text-center">
            <span
              className={clsx(
                'flex items-center justify-center rounded-full bg-white text-brand-700 shadow-float transition group-enabled:group-hover:scale-105',
                hero ? 'h-20 w-20' : 'h-14 w-14',
              )}
            >
              <svg viewBox="0 0 24 24" aria-hidden className={clsx('translate-x-0.5 fill-current', hero ? 'h-9 w-9' : 'h-6 w-6')}>
                <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.01-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
              </svg>
            </span>
            {hero && (
              <span className="text-lg font-semibold drop-shadow">
                <Say t={title} />
              </span>
            )}
            {!videoId && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Say t={SOON} />
              </span>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
