import Link from 'next/link';

import { CTA_HREF } from './brand';

/**
 * The brand call-to-action. Gold on white at weight 700 with 20px/60px padding,
 * matching the `.cbutton-*` rules on the live site.
 *
 * `nc-cta` carries no styles here. It is a marker for one rule in globals.css:
 * the gold variant is WHITE text on #E0A840, which measures 2.13:1 and fails
 * AA — and fails it on the dark site too, this is not a light-theme problem.
 * Rather than restyle a button that is on every live page, the Daylight build
 * re-points the label to ink through that marker and leaves this one alone.
 * Worth porting here once Denis has looked at it.
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
    'nc-cta inline-block rounded-md px-10 py-4 text-center text-base font-bold tracking-wide no-underline transition-colors sm:px-15';

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
