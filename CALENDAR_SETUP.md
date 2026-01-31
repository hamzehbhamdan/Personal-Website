# Google Calendar Integration Setup Guide

To enable Google Calendar synchronization for your Personal OS, you need to configure Google OAuth in your Supabase project.

## Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for **"Google Calendar API"** and enable it.
4. Go to **APIs & Services > OAuth consent screen**.
   - Select **External**.
   - Fill in the required app information.
   - Add the specific scope: `https://www.googleapis.com/auth/calendar.readonly`.
   - Add your email as a test user.
5. Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name it (e.g., "Personal OS").
   - **Authorized redirect URIs**: You need your Supabase Project URL.
     - Go to your Supabase Dashboard > Authentication > Providers > Google.
     - Copy the **Callback URL (for OAuth)**.
     - Paste it into Google Cloud Console.
6. Click **Create** and copy your **Client ID** and **Client Secret**.

## Step 2: Supabase Dashboard
1. Go to your Supabase Project.
2. Navigate to **Authentication > Providers**.
3. Enable **Google**.
4. Paste the **Client ID** and **Client Secret** from the previous step.
5. In the **Scopes** field (if available), or just ensure your Google Cloud Console config has it, make sure `https://www.googleapis.com/auth/calendar.readonly` is requested.
   - *Note: In this app, we specifically request this scope during the client-side login trigger.*
6. Click **Save**.

## Step 3: Connect in App
1. Open your Personal OS Dashboard.
2. Click the **Settings** icon.
3. Go to the **Integrations** tab.
4. Click **Link Account** under Google Calendar Sync.
5. Log in with your Google Account and approve the permissions.

Once connected, your upcoming events will start appearing in the "Schedule Node" section of the home screen.
