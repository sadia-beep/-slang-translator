# brainrot.exe — Slang ⇄ Formal Translator

Translates Gen-Z slang into polished formal English, and back again. Built with
React (Vite) + a Netlify serverless function that calls the free Groq API.

## Run it locally

1. Install dependencies:
   ```
   npm install
   ```
2. Install the Netlify CLI (used to run the serverless function locally):
   ```
   npm install -g netlify-cli
   ```
3. Copy `.env.example` to `.env` and paste in your free Groq API key
   (get one at https://console.groq.com → API Keys):
   ```
   cp .env.example .env
   ```
4. Run the dev server:
   ```
   netlify dev
   ```
5. Open the URL it prints (usually http://localhost:8888).

## Deploy to Netlify (free)

1. Push this folder to a GitHub repo.
2. On https://app.netlify.com, click "Add new site" → "Import an existing project"
   and connect your repo.
3. Build command: `npm run build`, publish directory: `dist` (already set in
   `netlify.toml`, so Netlify should detect it automatically).
4. In Site settings → Environment variables, add:
   - `GROQ_API_KEY` = your Groq API key
5. Deploy. Your live URL will be ready in about a minute.

## How it works

- The frontend (`src/App.jsx`) sends whatever you type to
  `/.netlify/functions/translate`.
- That serverless function (`netlify/functions/translate.js`) calls Groq's
  free LLM API with your key (kept server-side, never exposed to the browser)
  and asks it to translate in the chosen direction, returning JSON.
- The frontend displays the translated text and a "chaos meter" showing how
  many slang terms were detected.

## Notes

- Groq's free tier is generous but rate-limited — if you hit a limit, wait a
  minute and try again.
- Model used: `llama-3.1-8b-instant` (fast + free). You can swap this for
  another Groq-hosted model in `netlify/functions/translate.js` if you want.
