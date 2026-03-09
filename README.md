<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sgHXbpeea5xooUxPKZ608yXPwMZTUyFO

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment to Railway

This app is optimized for deployment on [Railway](https://railway.app) using the included `railway.json` and a PostgreSQL database.

### Automated Setup

1. Push this repository to your GitHub: `https://github.com/KLC-sudo/klcMSys`
2. Log in to [Railway](https://railway.app).
3. Click **"New Project"** and select **"Deploy from GitHub repo"**.
4. Connect your GitHub repository.
5. Railway will automatically detect the settings and configure:
   - A **Node.js service** for the backend/frontend.
   - You must manually add a **PostgreSQL** database service to the project.
6. Set the following environment variables in the Railway dashboard:
   - `DATABASE_URL`: Link this to your PostgreSQL service.
   - `JWT_SECRET`: A long random string for authentication.
   - `PORT`: 3001 (or as provided by Railway).

### Local Database Setup

To initialize the database locally, ensure you have PostgreSQL running and update the `DATABASE_URL` in your `.env` file. Then run:
`psql $DATABASE_URL -f server/schema.sql`
