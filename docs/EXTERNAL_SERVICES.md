# External Services Integration

Yapakit relies on several external services to provide high-quality features like image management and transactional emails.

## ☁️ Cloudinary (Image Management)

We use [Cloudinary](https://cloudinary.com/) for hosting and transforming images (Restaurant logos, Menu items).

### Setup

1. Create a Cloudinary account.
2. Obtain your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.
3. Add these to your `server/.env` file.
4. Ensure you have an upload preset named `yapakit` (configured in `server/src/services/cloudinary.ts`).

### Usage in Code
The `cloudinary.ts` service exports a `multer` storage instance that automatically handles uploads and applies transformations (resizing, quality optimization).

---

## 📧 Brevo (Transactional Emails)

We use [Brevo](https://www.brevo.com/) (formerly Sendinblue) as our SMTP provider for sending OTPs and reservation notifications.

### Setup

1. Create a Brevo account and verify your sender identity.
2. Navigate to **SMTP & API** settings to generate an **SMTP Key**.
3. Configure the following variables in `server/.env`:
   - `BREVO_SMTP_HOST`: `smtp-relay.brevo.com`
   - `BREVO_SMTP_PORT`: `587`
   - `BREVO_SMTP_USER`: Your Brevo account email.
   - `BREVO_SMTP_API_KEY`: Your generated SMTP key.
   - `BREVO_FROM_EMAIL`: Your verified sender email.
   - `BREVO_FROM_NAME`: `Yapakit` (or your preferred alias).

### Usage in Code
The `emailService.ts` handles all email operations using `nodemailer`. It includes templates for:
- 🔑 Password Reset OTPs.
- 📝 Registration Verification OTPs.
- 📅 Reservation Status Updates.

---
*Company Confidential - Kodffe / Yapakit Technology Group*
