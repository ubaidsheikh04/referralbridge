# **App Name**: ReferralConnect

## Core Features:

- Referral Form: Referral Request Form: Users enter their details (name, email, target company, job role, LinkedIn URL) and upload their resume.
- OTP Verification: Email Validation: Verify requesters through OTP sent to their email.
- Referrer Signup: Referrer Signup: Referrers sign up using their company email; verification email is sent.
- Referral Dashboard: Referrer Dashboard: Lists pending referral requests with options to Accept, Reject.
- Resume Auto-fill: Resume Parsing: Use an AI tool to parse the resume and automatically fill in relevant fields in the referral form.

## Style Guidelines:

- Primary color: Teal (#008080) to convey professionalism and trust.
- Secondary color: Light gray (#F0F0F0) for backgrounds and subtle contrasts.
- Accent: Orange (#FFA500) for call-to-action buttons and highlights.
- Clean and readable sans-serif fonts for all text elements.
- Use modern and professional icons from Material Design.
- Responsive design with clear sections and intuitive navigation, particularly for the dashboard sidebar.

## Original User Request:
Create an Angular web app called ReferralBridge. It should include:

1. Referral Request Page: A form for users to enter name, email, target company, job role, LinkedIn URL, and upload resume (PDF/DOCX). Store data in Firestore, and resume in Firebase Storage.

2. OTP Verification: After form submission, verify requesters with an OTP sent via email or phone using Firebase Authentication. Only allow verified users to submit referrals.

3. Referrer Signup and Dashboard:
   - Referrers must sign up using their company email (e.g., @accenture.com, @tcs.com).
   - Firebase should send a verification email to the referrer's company email.
   - Only verified referrers can access the dashboard.
   - The dashboard lists pending referral requests, with options to Accept, Reject, or Mark as Contacted.

4. Authentication:
   - Use Firebase Authentication.
   - Restrict referrer access to verified company domains only.
   - Allow requesters to use Gmail or any public email with OTP validation.

5. Routing:
   - /request-referral (referral form)
   - /verify-otp
   - /referrer-signup
   - /dashboard

6. Use Angular Material for a modern UI. Dashboard should have a sidebar layout. Ensure the app is responsive.

7. Use clean Angular structure with services, models, and components separated logically.
  