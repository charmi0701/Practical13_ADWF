# Practical 13: AI API Integration for a Student Study Planner

This React and Express application helps students organize assignments, revision sessions, exams, and project milestones. Students can ask a backend AI endpoint for an editable description and priority suggestion. The app also works without a third-party AI key by returning a local fallback suggestion.

## Run locally

1. In `backend`, copy `.env.example` to `.env`. Set `MONGO_URI` to a MongoDB local or Atlas connection string. Add an AI key only if you want external AI suggestions. Keep `.env` private.
2. Start the backend:

   ```powershell
   cd practical-13/backend
   npm install
   npm run dev
   ```

   The API listens on `http://localhost:5004` and connects to MongoDB before it starts accepting requests.

3. In another terminal, start the frontend:

   ```powershell
   cd practical-13/frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5176`.

## Student planner features

- Create, view, edit, complete, and delete study tasks.
- Generate an optional AI description and priority from an assignment or study-task title.
- Review and edit suggestions before saving. The page labels AI-assisted content and warns students not to submit private or sensitive information.
- If the AI provider is unavailable or no API key is configured, the backend returns a local fallback and the task manager remains usable.
- AI credentials stay on the backend in `.env`; the browser calls only this application's API.

## Routes

- `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- `POST /api/ai/generate-description` with `{ "title": "Revise database normalization" }`

For a controlled failure-path demonstration, send `?simulateFailure=true` to the AI route. The backend has a simple per-IP rate limit; wait if it returns HTTP 429.

## Responsible AI note

Suggestions are optional, may be inaccurate, and should be reviewed by the student. Send only a short task title; do not include passwords, grades, personal records, or other sensitive details.
