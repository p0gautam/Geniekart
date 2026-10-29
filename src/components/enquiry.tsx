'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { leadSchema } from '@/lib/validation';
import type { IncludedProduct } from '@/lib/combo';
type Context = {
  selectedOccasion?: string;
  productId?: string;
  packageId?: string;
  name?: string;
  quantity?: number;
  packaging?: string;
  isCombo?: boolean;
  includedProducts?: IncludedProduct[];
};
const EnquiryContext = createContext<(c?: Context) => void>(() => {});
export function track(event: string, data: Record<string, string | number> = {}) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...data });
}
export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [context, setContext] = useState<Context>({});
  const [key, setKey] = useState(0);
  const opener = useRef<HTMLElement | null>(null);
  function open(c: Context = {}) {
    opener.current = document.activeElement as HTMLElement;
    setContext(c);
    setKey((k) => k + 1);
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
  }
  function close() {
    dialog.current?.close();
    document.body.style.overflow = '';
    opener.current?.focus();
  }
  return (
    <EnquiryContext.Provider value={open}>
      {children}
      <dialog
        aria-labelledby="enquiry-title"
        ref={dialog}
        className="enquiry-dialog"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <button className="close" aria-label="Close enquiry" onClick={close}>
          ×
        </button>
        <span className="eyebrow">LET’S PLAN YOUR GIFTS</span>
        <h2 id="enquiry-title">Request a bulk quote</h2>
        {context.name && <p className="context">Enquiring about: {context.name}</p>}

        <EnquiryForm key={key} context={context} />
      </dialog>
    </EnquiryContext.Provider>
  );
}
export function QuoteButton({
  children = 'Enquire Now',
  context,
  className = 'button',
  ariaLabel,
}: {
  children?: React.ReactNode;
  context?: Context;
  className?: string;
  ariaLabel?: string;
}) {
  const open = useContext(EnquiryContext);
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={() => open(context)}
    >
      {children}
    </button>
  );
}
type Fields = z.infer<typeof leadSchema>;
export function EnquiryForm({ context = {} }: { context?: Context }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const started = useRef(false);
  const submitting = useRef(false);
  const requestId = useRef('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError: setFieldError,
  } = useForm<Fields>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      quantity: context.quantity || undefined,
      website: '',
      source: '/',
      utm: {},
      message: '',
      selectedOccasion: context.selectedOccasion || '',
      comboName: context.name || '',
      productId: context.productId,
      packageId: context.packageId,
    },
  });
  useEffect(() => {
    requestId.current = crypto.randomUUID();
    setValue('requestId', requestId.current);
    setValue('source', location.pathname + location.search);
    const params = new URLSearchParams(location.search);
    setValue(
      'utm',
      Object.fromEntries(
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].flatMap((k) =>
          params.has(k) ? [[k, params.get(k)!]] : [],
        ),
      ),
    );
  }, [setValue]);
  async function submit(data: Fields) {
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.fields) {
        for (const [field, messages] of Object.entries(result.fields)) {
          if (Array.isArray(messages) && messages[0])
            setFieldError(field as keyof Fields, { type: 'server', message: String(messages[0]) });
        }
      }
      if (!response.ok || result.ok !== true)
        throw new Error(result.error || 'Unable to save your enquiry. Please try again.');
      setSuccess(true);
      track('generate_lead', { item_id: context.productId || context.packageId || 'general' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send. Please try again.');
      submitting.current = false;
    }
  }
  if (success)
    return (
      <div className="success" role="status">
        <span>✓</span>
        <h3>Thank you for your enquiry.</h3>
        <p>Your requirements have been saved. Our team will review them and get in touch.</p>
      </div>
    );
  const fields: [keyof Fields, string, string][] = [
    ['name', 'Contact Person Name', 'text'],
    ['company', 'Organization / Company', 'text'],
    ['email', 'Email Address', 'email'],
    ['phone', 'Phone / WhatsApp', 'tel'],
    ['quantity', 'Gifts Required', 'number'],
    ['city', 'Delivery City (optional)', 'text'],
    ['budget', 'Budget Per Gift (optional)', 'text'],
    ['occasion', 'Occasion (optional)', 'text'],
  ];
  return (
    <form
      className="enquiry-form"
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      onFocus={() => {
        if (!started.current) {
          track('form_start');
          started.current = true;
        }
      }}
      noValidate
    >
      <div className="form-grid">
        {fields.map(([name, label, type]) => (
          <label key={name}>
            {label}
            <input
              type={type}
              min={type === 'number' ? 1 : undefined}
              autoComplete={
                name === 'name'
                  ? 'name'
                  : name === 'company'
                    ? 'organization'
                    : name === 'email'
                      ? 'email'
                      : name === 'phone'
                        ? 'tel'
                        : undefined
              }
              {...register(name, { valueAsNumber: type === 'number' })}
              aria-invalid={Boolean(errors[name])}
            />
            {errors[name] && <small className="error">{String(errors[name]?.message)}</small>}
          </label>
        ))}
      </div>
      <label>
        Message / Requirements (optional)
        <textarea rows={3} {...register('message')} />
        {errors.message && <small className="error">{errors.message.message}</small>}
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input {...register('website')} tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input type="checkbox" {...register('consent')} />{' '}
        <span>
          I agree to be contacted about this enquiry and to the{' '}
          <a href="/privacy-policy" target="_blank" rel="noreferrer">
            privacy policy
          </a>
          .
        </span>
      </label>
      {errors.consent && <small className="error">Please confirm your consent.</small>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button lavender full" disabled={isSubmitting}>
        {isSubmitting
          ? 'Saving enquiry…'
          : context.productId || context.packageId
            ? 'Get Quote'
            : 'Enquire Now'}
      </button>
      <p className="form-foot">Personalised gifting starts with a conversation.</p>
    </form>
  );
}
