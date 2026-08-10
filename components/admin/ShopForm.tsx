'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { slugify } from '@/lib/slug';
import { SHOP_TYPES, SHOP_TYPE_LABELS } from '@/lib/validators';

export type ShopFormValues = {
  name: string;
  slug: string;
  type: (typeof SHOP_TYPES)[number];
  phone: string;
  address: string;
  upiId: string;
  active: boolean;
};

const EMPTY: ShopFormValues = {
  name: '',
  slug: '',
  type: 'GROCERY',
  phone: '',
  address: '',
  upiId: '',
  active: true,
};

export function ShopForm({
  initial,
  editingSlug,
}: {
  initial?: ShopFormValues;
  editingSlug?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [values, setValues] = useState<ShopFormValues>(initial ?? EMPTY);
  // Once the admin edits the slug by hand we stop overwriting it from the name.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ShopFormValues>(key: K, value: ShopFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onNameChange(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    const url = editingSlug ? `/api/admin/shop/${editingSlug}` : '/api/admin/shop';
    try {
      const response = await fetch(url, {
        method: editingSlug ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        slug?: string;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        push(payload.error ?? 'Could not save the shop', 'error');
        return;
      }

      push(editingSlug ? 'Shop updated' : 'Shop created', 'success');
      router.push(editingSlug ? `/admin/shop/${payload.slug}` : `/admin/shop/${payload.slug}/items`);
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-4 shadow-card">
      <Input
        label="Shop name"
        required
        value={values.name}
        onChange={(event) => onNameChange(event.target.value)}
        error={errors.name}
        placeholder="Ramu Grocery"
      />

      <Input
        label="Slug"
        hint="the QR link"
        value={values.slug}
        onChange={(event) => {
          setSlugTouched(true);
          set('slug', slugify(event.target.value));
        }}
        error={errors.slug}
        placeholder="ramu-grocery"
      />
      {values.slug && (
        <p className="-mt-2 text-xs text-slate-500">
          Customers will scan to <span className="font-mono">/shop/{values.slug}</span>
        </p>
      )}

      <Select
        label="Type"
        value={values.type}
        onChange={(event) => set('type', event.target.value as ShopFormValues['type'])}
        error={errors.type}
      >
        {SHOP_TYPES.map((type) => (
          <option key={type} value={type}>
            {SHOP_TYPE_LABELS[type]}
          </option>
        ))}
      </Select>

      <Input
        label="WhatsApp number"
        hint="10 digits"
        inputMode="numeric"
        required
        value={values.phone}
        onChange={(event) => set('phone', event.target.value)}
        error={errors.phone}
        placeholder="9876543210"
      />

      <Textarea
        label="Address"
        rows={2}
        value={values.address}
        onChange={(event) => set('address', event.target.value)}
        error={errors.address}
        placeholder="Dum Dum Road, Kolkata"
      />

      <Input
        label="UPI ID"
        hint="optional, for the payment QR"
        value={values.upiId}
        onChange={(event) => set('upiId', event.target.value)}
        error={errors.upiId}
        placeholder="ramu@okaxis"
      />

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(event) => set('active', event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
        />
        Accepting orders
      </label>

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        {editingSlug ? 'Save changes' : 'Create shop'}
      </Button>
    </form>
  );
}
