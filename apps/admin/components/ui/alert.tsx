/**
 * The message a form shows after you submit it.
 *
 * Eleven files each wrote their own, and all eleven reached past the design
 * tokens into Tailwind's raw palette — `border-red-300 bg-red-50 text-red-900`,
 * `border-amber-300 bg-amber-50 text-amber-900`, `border-emerald-200 ...`. So
 * the admin had two unrelated sets of status colours: the token-backed chips,
 * whose pairs were chosen and measured against 4.5:1, and these, which were
 * whatever Tailwind ships. They did not match each other on the same screen.
 *
 * This uses the chip pairs, which are the measured ones.
 *
 * `role="alert"` ONLY for the error tone. An alert role interrupts a screen
 * reader mid-sentence, which is right for "that did not save" and wrong for
 * "saved" — the success message is confirmation of something the user just
 * did deliberately, and barging in to repeat it back is noise. Success is a
 * polite `status` instead, which is announced at the next pause.
 */
export type AlertTone = 'error' | 'warning' | 'success';

const TONE_CLASS: Record<AlertTone, string> = {
  error: 'alert-danger',
  warning: 'alert-warning',
  success: 'alert-success',
};

export function Alert({
  tone,
  children,
}: {
  tone: AlertTone;
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`alert ${TONE_CLASS[tone]}`}
    >
      {children}
    </p>
  );
}
