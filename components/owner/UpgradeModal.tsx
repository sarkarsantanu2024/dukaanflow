'use client';

/**
 * The Upgrade button, and the dialog behind it.
 *
 * A dialog rather than a page for one reason: paying is something an owner does
 * in the middle of doing something else — they are on the items screen, they
 * see they are nearly full, they pay, they carry on. A navigation loses their
 * place and makes a two-minute errand feel like leaving the app.
 *
 * The flow inside is the same component the /renew screen renders, so there is
 * one implementation of paying and it cannot drift between the two entrances.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ownerDict } from '@/lib/owner-i18n';
import { UpgradeFlow } from './UpgradeFlow';
import type { Plan } from '@/lib/plans';
import type { Locale } from '@/lib/i18n';

export function UpgradeModal({
  slug,
  locale,
  itemCount,
  suggested,
  helpUrl,
  label,
  className,
  variant = 'primary',
  size = 'sm',
}: {
  slug: string;
  locale: Locale;
  itemCount: number;
  suggested: Plan;
  helpUrl: string;
  label: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
}) {
  const [open, setOpen] = useState(false);
  const t = ownerDict(locale);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={clsx('shrink-0', className)}
      >
        {label}
      </Button>

      <Modal
        open={open}
        title={t.upgradeTitle}
        // Full screen, bar a 10px margin. Paying is a task, not an
        // interruption — a centred card left the flow scrolling inside a window
        // inside a page, with the shop's own screen showing round the edges.
        size="full"
        onClose={() => setOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t.close}
          </Button>
        }
      >
        {/* Remounted on each open, so a dialog reopened after the operator has
            issued a code re-reads the server rather than showing the form the
            owner left behind. */}
        {open && (
          <UpgradeFlow
            key={String(open)}
            slug={slug}
            locale={locale}
            itemCount={itemCount}
            suggested={suggested}
            helpUrl={helpUrl}
          />
        )}
      </Modal>
    </>
  );
}
