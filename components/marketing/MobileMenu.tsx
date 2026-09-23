'use client';

/**
 * The section links on a phone or tablet.
 *
 * Below `lg` the header drops its links to make room for the mark, which left
 * a small screen with no way to jump to a section or find the sign-in. This
 * puts them behind one round button in the bottom-right corner, where the
 * thumb already is. The button hides at `lg`, where the header shows the links
 * itself.
 *
 * On a phone it sits above the sticky WhatsApp bar, which owns the bottom
 * edge, and `BackToTop` stacks above it.
 */

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { CloseIcon, MenuIcon, WhatsAppIcon } from '@/components/ui/Icon';

type NavItem = { href: string; label: string };

export function MobileMenu({
  items,
  whatsapp,
}: {
  items: NavItem[];
  whatsapp: string | null;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40"
          aria-hidden="true"
          onClick={close}
        />
      )}

      <div
        ref={panelRef}
        id="mobile-menu"
        hidden={!open}
        className={clsx(
          'fixed bottom-40 right-4 z-50 w-64 rounded-2xl bg-black p-2 shadow-float sm:bottom-24 sm:right-6',
          'mb-[env(safe-area-inset-bottom)]',
        )}
      >
        <nav aria-label="Sections of this page" className="flex flex-col">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-xl px-4 py-3 text-base font-medium text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/admin"
            onClick={close}
            className="rounded-xl px-4 py-3 text-base font-medium text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Admin sign in
          </Link>
          {whatsapp && (
            <a
              href={whatsapp}
              onClick={close}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Get your shop
            </a>
          )}
        </nav>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className={clsx(
          'fixed bottom-24 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-float sm:bottom-6 sm:right-6',
          'mb-[env(safe-area-inset-bottom)] transition hover:bg-slate-800',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        )}
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}
