import Link from 'next/link';

import { CTA_HREF } from './brand';

/**
 * The brand call-to-action. Gold on white at weight 700 with 20px/60px padding,
 * matching the `.cbutton-*` rules on the live site.
 */
export function CtaButton({
  children = 'Get Funded',
  href = CTA_HREF,
  variant = 'gold',
  className = '',
}: {
  children?: React.ReactNode;
  href?: string;
  variant?: 'gold' | 'outline';
  className?: string;
}) {
  const base =
    'inline-block rounded-md px-10 py-4 text-center text-base font-bold tracking-wide no-underline transition-colors sm:px-15';

  const styles =
    variant === 'gold'
      ? 'bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-hover)]'
      : 'border-2 border-white text-white hover:bg-white hover:text-[var(--color-brand)]';

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
