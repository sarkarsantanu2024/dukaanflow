'use client';

/**
 * Create or edit one shop.
 *
 * Laid out as four labelled groups across two columns rather than one tall
 * stack of fourteen fields. The stack was technically fine and practically
 * miserable: nothing told you how far you had to go, related fields sat a
 * scroll apart, and the whole thing read as a form to endure rather than a
 * shop to set up. Grouping also means the eye can skip straight to Payment
 * when that is the only thing being changed.
 *
 * Photos are part of the same save. They are stored on a separate endpoint —
 * their payloads are two orders of magnitude larger than the rest — but that
 * is a detail of ours, not something to make a person do twice.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ImagePicker } from './ImagePicker';
import { slugify } from '@/lib/slug';
import { SHOP_TYPES, SHOP_TYPE_LABELS } from '@/lib/validators';

export type ShopFormValues = {
  name: string;
  ownerName: string;
  locale: 'en' | 'bn' | 'hi';
  slug: string;
  type: (typeof SHOP_TYPES)[number];
  phone: string;
  address: string;
  upiId: string;
  active: boolean;
};

export type ShopFormImages = {
  imageData: string;
  ownerImageData: string;
  upiQrData: string;
};

const EMPTY: ShopFormValues = {
  name: '',
  ownerName: '',
  locale: 'bn',
  slug: '',
  type: 'GROCERY',
  phone: '',
  address: '',
  upiId: '',
  active: true,
};

const NO_IMAGES: ShopFormImages = { imageData: '', ownerImageData: '', upiQrData: '' };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 pt-5 first:border-0 first:pt-0">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function ShopForm({
  initial,
  initialImages,
  editingSlug,
}: {
  initial?: ShopFormValues;
  initialImages?: ShopFormImages;
  editingSlug?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [values, setValues] = useState<ShopFormValues>(initial ?? EMPTY);
  const [images, setImages] = useState<ShopFormImages>(initialImages ?? NO_IMAGES);
  // Once the admin edits the slug by hand we stop overwriting it from the name.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ShopFormValues>(key: K, value: ShopFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setImage<K extends keyof ShopFormImages>(key: K, value: string) {
    setImages((current) => ({ ...current, [key]: value }));
  }

  function onNameChange(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  }

  /** Only sends photos that actually changed — they are large. */
  async function saveImages(slug: string) {
    const before = initialImages ?? NO_IMAGES;
    const changed: Partial<ShopFormImages> = {};
    for (const key of ['imageData', 'ownerImageData', 'upiQrData'] as const) {
      if (images[key] !== before[key]) changed[key] = images[key];
    }
    if (Object.keys(changed).length === 0) return true;

    const response = await fetch(`/api/admin/shop/${slug}/images`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changed),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      push(payload.error ?? 'The shop was saved, but a photo was not', 'error');
      return false;
    }
    return true;
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

      if (!response.ok || !payload.slug) {
        setErrors(payload.errors ?? {});
        push(payload.error ?? 'Could not save the shop', 'error');
        return;
      }

      await saveImages(payload.slug);

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
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <div className="space-y-6">
        <Section title="The shop" description="What customers see when they scan the QR.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Shop name"
              required
              value={values.name}
              onChange={(event) => onNameChange(event.target.value)}
              error={errors.name}
              placeholder="Ramu Grocery"
            />

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

            <div className="sm:col-span-2">
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
                <p className="mt-1.5 text-xs text-slate-500">
                  Customers scan to <span className="font-mono">/shop/{values.slug}</span>
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Address"
                rows={2}
                value={values.address}
                onChange={(event) => set('address', event.target.value)}
                error={errors.address}
                placeholder="Dum Dum Road, Kolkata"
              />
            </div>

            <div className="sm:col-span-2">
              <ImagePicker
                label="Storefront photo"
                hint="how the shop looks from the street"
                value={images.imageData}
                shape="wide"
                busy={submitting}
                onChange={(data) => setImage('imageData', data)}
                onError={(message) => push(message, 'error')}
              />
            </div>
          </div>
        </Section>

        <Section title="The owner" description="Who runs it, and the language their app opens in.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Owner name"
              value={values.ownerName}
              onChange={(event) => set('ownerName', event.target.value)}
              error={errors.ownerName}
              placeholder="Ramu Das"
            />

            <Select
              label="Owner's language"
              value={values.locale}
              onChange={(event) => set('locale', event.target.value as ShopFormValues['locale'])}
              error={errors.locale}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="hi">हिंदी</option>
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

            <ImagePicker
              label="Owner photo"
              hint="optional"
              value={images.ownerImageData}
              shape="circle"
              busy={submitting}
              onChange={(data) => setImage('ownerImageData', data)}
              onError={(message) => push(message, 'error')}
            />
          </div>
        </Section>

        <Section
          title="Taking payment"
          description="Either works. A photographed QR is easier for the shopkeeper than typing an ID."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="UPI ID"
              hint="optional"
              value={values.upiId}
              onChange={(event) => set('upiId', event.target.value)}
              error={errors.upiId}
              placeholder="ramu@okaxis"
            />

            <ImagePicker
              label="Their own UPI QR"
              hint="from PhonePe, GPay, Paytm"
              value={images.upiQrData}
              shape="square"
              busy={submitting}
              onChange={(data) => setImage('upiQrData', data)}
              onError={(message) => push(message, 'error')}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            An uploaded QR is shown to customers in place of the generated one — a PhonePe or Paytm
            code carries merchant details a plain <span className="font-mono">upi://pay</span> link
            cannot reproduce. QR images are kept as lossless PNG so scanners never struggle.
          </p>
        </Section>

        <Section title="Status" description="Turn a shop off without deleting anything.">
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(event) => set('active', event.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            />
            <span>
              <span className="block font-medium text-slate-800">Accepting orders</span>
              <span className="block text-sm text-slate-500">
                Unticked, the shop page shows &ldquo;closed&rdquo; and takes no orders. Items and
                order history are kept.
              </span>
            </span>
          </label>
        </Section>
      </div>

      {/* Sticky, because on a phone the save button was three scrolls below
          whatever the admin was actually editing. */}
      <div className="sticky bottom-0 -mx-5 mt-6 flex items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Button type="submit" loading={submitting}>
          {editingSlug ? 'Save changes' : 'Create shop'}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
