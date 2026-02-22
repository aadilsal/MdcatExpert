# Deployment Guide: MDCAT Expert on Vercel

This document outlines the steps to deploy the MDCAT Expert application to Vercel.

## 📋 Prerequisites
- A [Vercel](https://vercel.com) account.
- A [Supabase](https://supabase.com) project.
- [Vercel CLI](https://vercel.com/download) installed locally (optional, but recommended for command-line deployment).

## 🚀 Deployment Steps

### 1. Prepare Environment Variables
You will need to provide the following environment variables to Vercel:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (used for admin actions) |

### 2. Configure Supabase
Before deploying, ensure your Supabase database is set up correctly:
1. Run all migrations in `supabase/migrations/` in the Supabase SQL Editor.
2. Ensure RLS (Row Level Security) is enabled on all tables.
3. Verify that the `is_admin()` helper function is installed (from `002_fix_rls_recursion.sql`).

### 3. Deploy via Vercel CLI (Recommended)
From the project root directory, run:
```bash
# Login to Vercel
vercel login

# Link your project
vercel link

# Push to production
vercel --prod
```
During the setup, Vercel will ask for the environment variables. Provide the values from your Supabase project.

### 4. Deploy via GitHub Integration
1. Push your code to a GitHub repository.
2. Import the project in the Vercel Dashboard.
3. In the **Environment Variables** section, add the keys listed in Step 1.
4. Click **Deploy**.

## 🛠️ Post-Deployment
- **Custom Domain**: Follow the [Domain Setup Guide](file:///d:/Projects/mdcat-expert/DOMAIN_SETUP.md) to connect your Hostinger domain.
- **Admin Access**: Manually set the `role` to `'admin'` for your primary user in the `users` table via the Supabase Dashboard to access admin features.
- **Monitoring**: Check the Vercel logs and Supabase API logs for any runtime errors.

## ⚠️ Troubleshooting
- **Recursion Error**: If you see "infinite recursion" in logs, ensure you have applied the `002_fix_rls_recursion.sql` migration.
- **Auth Redirects**: Ensure your Site URL and Redirect URIs in Supabase Auth settings match your Vercel deployment URL.
