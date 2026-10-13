# Email sign-up without confirmation emails

This app checks the email address format, then creates the Supabase account and signs the user in immediately. It does not require a confirmation email. Format validation does not verify ownership of the inbox.

## Required dashboard setting

1. Open [your project's Authentication providers](https://supabase.com/dashboard/project/hwpqpvmbhryhhjbmvujl/auth/providers).
2. Open the **Email** provider.
3. Keep **Enable Email provider** on and ensure new user sign-ups are allowed.
4. Turn **Confirm email** off and click **Save**.
5. Return to the app, open **Create Account**, and submit a new email address and password.

Supabase documents this setting in its [password authentication guide](https://supabase.com/docs/guides/auth/passwords#enabling-email-and-password-based-authentication).

The app checks the public Auth settings before submitting a new registration. If confirmation emails are still required, it displays the setup instructions and does not submit the sign-up request or send a confirmation email. Changing a local SQL migration or React file cannot change this hosted Auth setting. The publishable key cannot update the project's Auth configuration.

## Local connection

`.env.local` contains the project URL (`https://hwpqpvmbhryhhjbmvujl.supabase.co`) and the existing publishable key. The project URL should not include `/rest/v1/`. Restart Vite after editing this file.

Run `npm run check:supabase` to check the live connection and registration settings. This command reads settings only; it does not create users or send emails.

## Existing accounts

Turning off email confirmation configures new sign-ups. If an existing account still receives `email_not_confirmed` when signing in, inspect that account under **Authentication > Users** and confirm it in the dashboard. Use **Log In** for an already registered address; creating another account with that same address will not replace it.
