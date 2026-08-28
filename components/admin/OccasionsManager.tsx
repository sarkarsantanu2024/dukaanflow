'use client';

/**
 * The occasion calendar the Super Admin keeps.
 *
 * There is no date entry on this screen, and that is the point.
 *
 * An earlier version put two date boxes on every moving festival and asked
 * somebody to fill them in once a year. It was a row of empty fields standing
 * between the operator and the only thing they actually wanted — sales per
 * occasion — and the report stayed empty until the chore was done. The dates
 * now ship with the software (`lib/occasion-dates.ts`), so the calendar works
 * the moment it is loaded and this screen is a list, not a form.
 *
 * Correcting a date is still possible, because published dates are good to
 * about a day and regional practice varies. It sits behind a link on the row
 * that needs it, where somebody who cares can find it and nobody else has to
 * look at it.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { TrashIcon } from '@/components/ui/Icon';
import { STATES, stateName } from '@/lib/states';
import type { ResolvedOccasion } from '@/lib/occasions';

const SOURCE_LABEL: Record<ResolvedOccasion['source'], string> = {
  fixed: 'Same date every year',
  shipped: 'Published date',
  entered: 'Corrected by you',
  missing: 'No date on file for this year',
};

export function OccasionsManager({
  occasions,
  year,
  years,
  catalogueSize,
}: {
  occasions: ResolvedOccasion[];
  year: number;
  years: number[];
  catalogueSize: number;
}) {
  const router = useRouter();
  const { push } = useToast();

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const placed = useMemo(
    () => occasions.filter((occasion) => occasion.source !== 'missing'),
    [occasions],
  );
  const undated = useMemo(
    () => occasions.filter((occasion) => occasion.source === 'missing'),
    [occasions],
  );

  async function call(method: string, path: string, body: unknown) {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      errors?: Record<string, string>;
      added?: number;
    };
    return { ok: response.ok, payload };
  }

  async function addOccasion() {
    setBusy(true);
    setErrors({});
    const { ok, payload } = await call('POST', '/api/admin/occasions', { name, state });
    setBusy(false);

    if (!ok) {
      setErrors(payload.errors ?? {});
      push(payload.error ?? 'Could not add it', 'error');
      return;
    }
    push(`${name} added`);
    setName('');
    router.refresh();
  }

  async function loadCatalogue() {
    setBusy(true);
    const { ok, payload } = await call('POST', '/api/admin/occasions', { seed: true });
    setBusy(false);

    if (!ok) {
      push(payload.error ?? 'Could not load them', 'error');
      return;
    }
    push(
      payload.added === 0
        ? 'All of them were already on the calendar'
        : `${payload.added} occasion${payload.added === 1 ? '' : 's'} added`,
    );
    router.refresh();
  }

  async function remove(occasion: ResolvedOccasion) {
    if (!window.confirm(`Remove ${occasion.name} from the calendar?`)) return;
    const { ok } = await call('DELETE', '/api/admin/occasions', { id: occasion.id });
    if (!ok) {
      push('Could not remove it', 'error');
      return;
    }
    push('Removed');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------ add ------------- */}
      <section className="rounded-2xl bg-white px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Input
              label="Occasion"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && name.trim().length > 1) addOccasion();
              }}
              error={errors.name}
              placeholder="Poila Boishakh"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              label="Where"
              value={state}
              onChange={(event) => setState(event.target.value)}
              error={errors.state}
            >
              <option value="">All India</option>
              {STATES.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name}
                </option>
              ))}
            </Select>
          </div>

          <Button onClick={addOccasion} loading={busy} disabled={name.trim().length < 2}>
            Add
          </Button>

          <Button variant="secondary" onClick={loadCatalogue} disabled={busy} className="ml-auto">
            Load the {catalogueSize} common Indian occasions
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Just the name. Loading the common list is safe to press twice — anything already here is
          left untouched.
        </p>
      </section>

      {/* ------------------------------------------- year switcher -------- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">Showing</span>
        {years.map((option) => (
          <a
            key={option}
            href={`/admin/occasions?year=${option}`}
            className={
              option === year
                ? 'rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white'
                : 'rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-card hover:text-slate-900'
            }
          >
            {option}
          </a>
        ))}
      </div>

      {/* ------------------------------------------------ the list -------- */}
      <section className="rounded-2xl bg-white px-5 py-4 shadow-card">
        {occasions.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Nothing on the calendar yet. Press{' '}
            <strong>Load the {catalogueSize} common Indian occasions</strong> above — they arrive
            with their dates and need nothing else.
          </p>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Occasion</th>
                  <th className="py-2 pr-3">Where</th>
                  <th className="py-2 pr-3">{year}</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {placed.map((occasion) => (
                  <OccasionRow
                    key={occasion.id}
                    occasion={occasion}
                    year={year}
                    onRemove={() => remove(occasion)}
                    onChanged={() => router.refresh()}
                  />
                ))}
                {undated.map((occasion) => (
                  <OccasionRow
                    key={occasion.id}
                    occasion={occasion}
                    year={year}
                    onRemove={() => remove(occasion)}
                    onChanged={() => router.refresh()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OccasionRow({
  occasion,
  year,
  onRemove,
  onChanged,
}: {
  occasion: ResolvedOccasion;
  year: number;
  onRemove: () => void;
  onChanged: () => void;
}) {
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [startsOn, setStartsOn] = useState(occasion.startsOn ?? '');
  const [endsOn, setEndsOn] = useState(occasion.endsOn ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    const response = await fetch('/api/admin/occasions/dates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasionId: occasion.id, startsOn, endsOn: endsOn || startsOn }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      errors?: Record<string, string>;
    };
    setSaving(false);

    if (!response.ok) {
      setError(payload.errors?.endsOn ?? payload.errors?.startsOn ?? payload.error ?? 'Not saved');
      return;
    }
    push(`${occasion.name} updated — run the rollup to apply it`);
    setEditing(false);
    onChanged();
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-3 font-medium text-slate-900">
        {occasion.name}
        {occasion.note && (
          <span className="block text-xs font-normal text-slate-400">{occasion.note}</span>
        )}
      </td>
      <td className="py-2 pr-3 text-slate-600">{stateName(occasion.state)}</td>

      <td className="py-2 pr-3 tabular-nums text-slate-600">
        {editing ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              aria-label={`First day of ${occasion.name}`}
              min={`${year}-01-01`}
              max={`${year}-12-31`}
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              aria-label={`Last day of ${occasion.name}`}
              min={startsOn || `${year}-01-01`}
              max={`${year}-12-31`}
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
            />
            <Button size="sm" onClick={save} loading={saving} disabled={!startsOn}>
              Save
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            {error && <span className="text-xs font-medium text-red-600">{error}</span>}
          </span>
        ) : occasion.startsOn ? (
          occasion.startsOn === occasion.endsOn ? (
            occasion.startsOn
          ) : (
            `${occasion.startsOn} → ${occasion.endsOn}`
          )
        ) : (
          <span className="text-amber-700">not known for {year}</span>
        )}
      </td>

      <td className="py-2 pr-3 text-xs text-slate-500">
        {SOURCE_LABEL[occasion.source]}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-2 font-medium text-brand-700 underline hover:text-brand-800"
          >
            {occasion.source === 'missing' ? 'Set' : 'Adjust'}
          </button>
        )}
      </td>

      <td className="py-2 pr-3">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={`Remove ${occasion.name}`}
            onClick={onRemove}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
