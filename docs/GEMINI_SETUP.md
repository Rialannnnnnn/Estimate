# Menyiapkan Gemini API untuk EstiMate

EstiMate uses Google's Gemini Interactions API with the `gemini-3.6-flash` model.

## 1. Create an API key

1. Open https://aistudio.google.com/api-keys and sign in to your Google account.
2. Create or select a Google AI Studio project.
3. Create an API key and copy it once.

Do not paste the key into source code, GitHub, a public issue, or a chat.

## 2. Add it to Vercel

1. Open the Vercel dashboard and select the `v0-estimate` project.
2. Open **Settings → Environment Variables**.
3. Add a variable named `GEMINI_API_KEY` and paste the key as its value.
4. Enable the environments you use: **Preview** for testing, and **Production** only when you intentionally roll this feature out.
5. Save, then redeploy the Preview deployment so the function receives the new variable.

The key is read only by the server-side API route. It must not be named `NEXT_PUBLIC_GEMINI_API_KEY`.

## 3. Free-tier notes

The Gemini 3.6 Flash Free tier currently lists free input/output tokens, but project-specific RPM, TPM, and daily request quotas apply. When quota is exhausted, EstiMate reports that the quota was reached without changing the user's current needs list.

Google's Free tier terms say submitted content may be used to improve Google products. EstiMate therefore does not send actual purchase prices or personal price-history records to Gemini, but it does send the user's prompt, conversation context, item names, categories, quantities, and planning budget so the model can reason about the plan. Do not use the Free tier for sensitive financial notes.

## AI price estimates

For new items and existing unpriced items, Gemini can suggest an average unit-price estimate plus a minimum–maximum range in Indonesian rupiah. EstiMate writes the estimate directly into the editable unit-price field and labels it as an AI estimate. These are general estimates, not live store quotes or verified market prices. The user can change an estimate at any time.

Personal purchase history remains private from Gemini. When at least three recent exact matches exist for the same item and category/unit, EstiMate uses the personal median instead of an AI estimate. An explicitly supplied unit price takes priority. Estimated prices never populate the actual purchase-price field and do not mark an item as purchased.

## Local development

Copy `.env.example` to `.env.local`, then replace the placeholder with your key. Keep `.env.local` out of Git.
