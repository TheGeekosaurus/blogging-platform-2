# @blog/ui

Components rendered by **both** apps.

Nothing belongs here just because it is shared-looking. The bar is that the
public site and the admin must render the *same* component, not two that agree
today — which is true of exactly one thing so far: a CTA block, which readers
see on a post and an editor sees in the builder's live preview and inside the
editor itself. A preview that is a second implementation is a preview that
lies the first time a layout changes.

Ships TypeScript source, like `@blog/core`, so there is no build step between
editing and seeing it apply. Both apps list it in `transpilePackages`, and both
stylesheets need an `@source` line pointing here — Tailwind only scans its own
project root, and without that line every class in this package is missing from
the build with no error anywhere.
