# Privacy Note

_Last updated: 3 August 2026_

## Your files

Files are opened and renamed inside your browser. Previewing names, applying
patterns, adding owner labels, and downloading all happen locally — the
downloaded file is built from the copy already on your computer and is never
uploaded.

**AI suggest names is the one exception.** When you use it, the file is sent to
our server and passed to Anthropic's Claude API, which reads it to identify the
document and propose a name.

PDFs and images (JPEG, PNG, GIF, WebP) up to 3 MB are uploaded as they are.
Word documents (`.docx`) and plain-text files are opened in your browser first,
and only the text found inside is uploaded — at most the first 20,000
characters, never the file itself. Anything larger, or in another format, is not
sent at all; we ask for a name based on the filename alone.

We do not keep your files. They exist in memory only for the length of the
request and are never written to our database or to disk. We record only that a
rename happened, as a monthly counter, so we can enforce plan limits. We do not
store filenames or document contents.

Anthropic processes these files as our service provider. Under its commercial
API terms, your content is not used to train models and is deleted within
30 days, retained in the meantime only for automated abuse monitoring. See
[Anthropic's retention policy](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data).

Because AI suggest transmits the document itself, please consider whether the
material is something you are willing to share with a third-party processor.
Renaming without AI never leaves your device.

## Your account

When you register we store your email address, a bcrypt hash of your password
(never the password itself), and an optional display name. If you subscribe, we
also store your Stripe customer and subscription IDs, subscription status, and
plan tier. Usage records hold only your user ID, a month, and a count.

Payments are handled entirely by Stripe's hosted checkout. Card numbers never
reach our servers; we send Stripe only your user ID, email, and the plan you
selected.

Password reset links are sent through Resend and expire after one hour. Using a
link, or requesting a new one, invalidates any earlier link.

## Stored in your browser

- `authToken` — your sign-in token, valid for 7 days. Contains your user ID and
  email. Signing out removes it.
- `ai-renamer-recent-owners` — the last 10 owner names you typed, so they can be
  reused. These stay on your device and are never sent to us.
- `ai-renamer-preferred-pattern` — your chosen naming pattern.

We do not use cookies, analytics, or advertising or tracking scripts.

## Who else is involved

- **Anthropic** — receives documents you submit to AI suggest, as described above.
- **Stripe** — payment processing and billing.
- **Resend** — delivery of password reset emails.
- **Vercel** — hosting for the site and its API.
- **Neon** — the PostgreSQL database holding account data.
- **Google Fonts** — the site loads two typefaces from Google's servers, so
  Google receives your IP address and browser details when a page loads.

## Your choices

You can use the app without AI suggest and no file will ever leave your device.

You can delete your account at any time from **Account & more options → Delete
account**. This permanently removes your email, password hash, usage history,
and any pending reset links, and cancels an active subscription. It cannot be
undone.

To ask what data we hold about you, contact
[curvedspaceservices@gmail.com](mailto:curvedspaceservices@gmail.com).
