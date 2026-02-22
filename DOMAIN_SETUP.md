# Domain Configuration: Hostinger to Vercel

Follow these steps to connect your custom domain bought from Hostinger to your MDCAT Expert project on Vercel.

## 1. Add Domain to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your project.
3. Go to **Settings** > **Domains**.
4. Type your domain (e.g., `yourdomain.com`) and click **Add**.
5. Vercel will show you the DNS records you need to add to Hostinger.

## 2. Configure DNS on Hostinger
1. Log in to your [Hostinger hPanel](https://hpanel.hostinger.com/).
2. Go to **Domains** and select your domain.
3. Click on **DNS / Nameservers** in the sidebar.
4. **Important**: Ensure you are using Hostinger's default nameservers to manage DNS records here.

### A Record (For the Root Domain)
If you are connecting `yourdomain.com`:
- **Type**: `A`
- **Name**: `@` (or leave empty)
- **Points to**: `76.76.21.21` (Vercel's IP)
- **TTL**: `Default`

### CNAME Record (For the WWW Subdomain)
If you want to use `www.yourdomain.com`:
- **Type**: `CNAME`
- **Name**: `www`
- **Points to**: `cname.vercel-dns.com`
- **TTL**: `Default`

## 3. Verify on Vercel
1. Go back to the **Domains** tab in your Vercel project settings.
2. Vercel will automatically check the DNS records.
3. Once verified, a green **"Valid Configuration"** checkmark will appear.
4. SSL certificates will be generated automatically by Vercel.

## ⏳ Propagation Time
DNS changes can take anywhere from **a few minutes to 24-48 hours** to fully propagate across the internet, though Vercel usually detects them within minutes.

---

> [!TIP]
> If you have existing A or CNAME records for `@` or `www` pointing to another service, you must **delete** them before adding the Vercel records to avoid conflicts.
