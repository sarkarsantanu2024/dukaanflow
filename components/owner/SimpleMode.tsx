'use client';

/**
 * Who is in simple mode, and the switch that changes it.
 *
 * The reasoning for the mode itself is in `lib/simple-mode.ts`; this is only
 * the plumbing. A context rather than a prop threaded through nine components,
 * because the screens that need the answer — the item rows, the add sheet, the
 * folded-away cards — sit several layers below the shell that owns it.
 *
 * The provider lives in `OwnerShell`, so every owner screen is inside it and
 * `useSimpleMode` can never be called from a tree that has no answer.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readSimpleMode, writeSimpleMode } from '@/lib/simple-mode';

type SimpleModeValue = {
  simple: boolean;
  setSimple: (simple: boolean) => void;
  /**
   * False until the phone's stored answer has been read.
   *
   * The server has no idea which mode this owner is in, so the first paint is a
   * guess and something has to say so. Nothing uses this to render a spinner —
   * a flash of a loading state on every screen would be a worse trade than the
   * thing it hides. It exists so the *switch* can stay out of the way until it
   * would tell the truth: a control that says "Full app" for one frame and then
   * flips to "Simple" is a control nobody trusts.
   */
  ready: boolean;
};

const SimpleModeContext = createContext<SimpleModeValue>({
  simple: true,
  setSimple: () => {},
  ready: false,
});

export function SimpleModeProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  /**
   * Starts SIMPLE on every first paint, deliberately, and not merely because
   * that is the default for a new owner.
   *
   * `localStorage` cannot be read while rendering on the server, so the first
   * frame is always a guess, and the two ways of guessing wrong are not equal.
   * Guess simple and an owner who chose the full app watches four cards appear
   * — things arriving is how screens normally behave. Guess full and every
   * owner in simple mode is shown the busy screen and then has it snatched
   * away, which is both a jump and a glimpse of exactly the clutter they turned
   * off. Hide first, reveal second.
   */
  const [simple, setSimpleState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSimpleState(readSimpleMode(slug));
    setReady(true);
  }, [slug]);

  const setSimple = useCallback(
    (next: boolean) => {
      setSimpleState(next);
      writeSimpleMode(slug, next);
    },
    [slug],
  );

  return (
    <SimpleModeContext.Provider value={{ simple, setSimple, ready }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode(): SimpleModeValue {
  return useContext(SimpleModeContext);
}

/**
 * The way out, and the way back in.
 *
 * At the FOOT of the screen and set as a quiet line, which is the whole of its
 * design. A switch this size at the top would be one more option on a screen
 * whose complaint is that it has too many, and an owner who is happy does not
 * need to see it at all. An owner who wants more looks for it where you look
 * for more of anything: at the bottom, after everything else.
 *
 * It says what it will DO rather than what is currently on. "Simple mode ✓" is
 * a status, and a status invites the question "so what is the other one"; "Show
 * everything" is an offer, and the owner already knows whether they want it.
 */
export function SimpleModeToggle({ simpleLabel, fullLabel }: {
  /** Offered while the full app is showing: the way back to quiet. */
  simpleLabel: string;
  /** Offered while in simple mode: the way to the rest of it. */
  fullLabel: string;
}) {
  const { simple, setSimple, ready } = useSimpleMode();

  // Nothing at all until the stored answer is in. See `ready`.
  if (!ready) return null;

  return (
    <div className="pt-1 text-center">
      <button
        type="button"
        onClick={() => setSimple(!simple)}
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 underline decoration-dotted underline-offset-4 transition hover:text-slate-700"
      >
        {simple ? fullLabel : simpleLabel}
      </button>
    </div>
  );
}
