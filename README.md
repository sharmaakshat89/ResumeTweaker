# ResumeTweaker

A SvelteKit application for generating job-specific resumes using AI. Leverages free Gemini models to tailor an existing resume to highlight keywords that a specific job requires.

## Tech Stack

- **Framework:** SvelteKit 2.x
- **Language:** TypeScript
- **Runtime:** Vite
- **AI:** Google Gemini API
- **Database:** MongoDB (authentication)
- **PDF:** Puppeteer + Browserless

## Project Structure

```
/src/lib           - Shared libraries and utilities
/src/routes        - SvelteKit routes (pages)
/src/routes/api    - API endpoints
.env               - Environment variables
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   MONGO_URI=your_mongodb_uri
   BROWSERLESS_TOKEN=your_browserless_token
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
