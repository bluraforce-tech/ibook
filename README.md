# iBOK - Internet Banking Services..

A secure, fully responsive React web application for internet banking services with comprehensive security features and EmailJS integration.

## 🌟 Features

### 📱 Two Fully Responsive Pages
1. **Login Page (تسجيل الدخول)**
   - Account number validation (7+ digits)
   - Strong password validation
   - Password visibility toggle
   - Rate limiting (max 5 attempts)
   - Account lockout after failed attempts
   - Auto-logout on inactivity

2. **Profile Update Page (تحديث البيانات)**
   - Multiple form fields with validation
   - Service selection checkboxes
   - File upload for identity documents
   - Change detection and tracking
   - Real-time form validation

### 📧 EmailJS Integration

#### 1. Login Notification
Automatically sends email to admin when user logs in with:
- User email
- Account number
- Login timestamp
- IP address
- User agent

#### 2. Profile Update Notification
Sends detailed email when profile is updated with:
- List of all changed fields
- Old value → New value comparison
- Total number of changes
- Update timestamp

### 🔐 Security Features

#### Input Validation
- ✅ Email format validation
- ✅ Password strength requirements (min 8 chars, uppercase, lowercase, numbers, special chars)
- ✅ Account number format validation
- ✅ XSS prevention through input sanitization
- ✅ SQL injection pattern detection
- ✅ File upload validation (type, size)

#### Authentication Protection
- ✅ Rate limiting (5 max attempts before lockout)
- ✅ Account lockout with countdown timer
- ✅ Password strength validation
- ✅ Detailed error handling

#### Session Security
- ✅ Secure token generation using crypto API
- ✅ Session stored in sessionStorage (more secure than localStorage)
- ✅ Auto-logout after 30 minutes of inactivity
- ✅ Activity tracking (mouse, keyboard, click, scroll)
- ✅ Session expiration validation

#### API Security
- ✅ HTTPS enforcement via CSP headers
- ✅ Token validation before actions
- ✅ Unauthorized access rejection
- ✅ Secure data sanitization

#### EmailJS Security
- ✅ Private keys stored in environment variables
- ✅ Only public key exposed in frontend
- ✅ Rate limiting to prevent spam (5 emails/hour per user)
- ✅ Email send history tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- EmailJS account

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd c:\Users\Mekky\Desktop\IBOK\ibok-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure EmailJS:**
   
   a. Create an account at [EmailJS](https://www.emailjs.com/)
   
   b. Create a new service (e.g., Gmail, Outlook)
   
   c. Create two email templates:
   
   **Login Template:**
   ```
   Subject: New Login Detected
   
   A new login has been detected:
   
   User Email: {{user_email}}
   Account Number: {{account_number}}
   Login Time: {{timestamp}}
   IP Address: {{ip_address}}
   User Agent: {{user_agent}}
   ```
   
   **Profile Update Template:**
   ```
   Subject: Profile Update Notification
   
   Profile has been updated:
   
   User Email: {{user_email}}
   Account Number: {{account_number}}
   Update Time: {{timestamp}}
   
   Changes Made ({{total_changes}}):
   {{changes_list}}
   ```

4. **Update environment variables:**
   
   Edit `.env` file with your EmailJS credentials:
   ```env
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID_LOGIN=your_login_template_id_here
   VITE_EMAILJS_TEMPLATE_ID_UPDATE=your_update_template_id_here
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   VITE_ADMIN_EMAIL=admin@ibok.com
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   ```
   http://localhost:5173
   ```

## 🎨 Design

The application matches the exact design specifications:
- **Colors:** Red (#E84545), Yellow (#F5B942)
- **Typography:** Cairo font family (Arabic support)
- **Layout:** Fully responsive with mobile-first approach
- **RTL Support:** Complete right-to-left layout for Arabic
- **Animations:** Smooth transitions and micro-interactions

## 📁 Project Structure

```
ibok-app/
├── src/
│   ├── components/
│   │   └── Header.jsx          # Reusable header component
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   └── ProfileUpdate.jsx    # Profile update page
│   ├── utils/
│   │   ├── validation.js        # Input validation utilities
│   │   ├── auth.js              # Authentication & session management
│   │   └── emailService.js      # EmailJS integration
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── index.html                   # HTML template
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🔧 Configuration

### Security Settings (in `.env`)

```env
# Maximum login attempts before lockout
VITE_MAX_LOGIN_ATTEMPTS=5

# Lockout duration in milliseconds (5 minutes)
VITE_LOCKOUT_DURATION=300000

# Session timeout in milliseconds (30 minutes)
VITE_SESSION_TIMEOUT=1800000
```

## 🧪 Testing

### Login Page Testing

1. **Valid Login:**
   - Account: Any 7+ digit number
   - Password: Min 8 chars with uppercase, lowercase, number, special char
   - Example: `1234567` / `Password@123`

2. **Rate Limiting:**
   - Try logging in with wrong credentials 5 times
   - Account will be locked for 5 minutes

3. **Session Management:**
   - After login, remain inactive for 30 minutes
   - You'll be automatically logged out

### Profile Update Testing

1. **Update Fields:**
   - Change any form field
   - Click "تحديث البيانات"
   - Check console for email notification

2. **File Upload:**
   - Upload PDF or image (max 5MB)
   - Validation will check file type and size

3. **Change Detection:**
   - Only modified fields will be sent in email
   - Check email for old → new value comparison

## 📧 EmailJS Setup Guide

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Create a new Email Service
3. Create two Email Templates (Login & Update)
4. Copy Service ID, Template IDs, and Public Key
5. Paste them into `.env` file
6. Test by logging in or updating profile

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use HTTPS in production** - Enforced via CSP headers
3. **Rotate EmailJS keys regularly**
4. **Monitor email rate limits** - Prevent abuse
5. **Implement backend validation** - Never trust client-side only
6. **Use secure password hashing** - When implementing backend
7. **Enable CORS properly** - Restrict to your domain

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Responsive Breakpoints

- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: > 768px

## 🎯 Production Build

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 🐛 Troubleshooting

### EmailJS not sending emails?
1. Check `.env` configuration
2. Verify EmailJS service is active
3. Check browser console for errors
4. Ensure you're not rate-limited

### Session not persisting?
1. Check browser's sessionStorage
2. Ensure you're not in incognito mode
3. Check session timeout settings

### Styles not loading?
1. Clear browser cache
2. Restart dev server
3. Check console for CSS errors

## 📄 License

This project is for educational and demonstration purposes.

## 👨‍💻 Developer Notes

- All form inputs are sanitized to prevent XSS
- SQL injection patterns are detected and blocked
- Rate limiting prevents brute force attacks
- Session tokens are cryptographically secure
- EmailJS rate limiting prevents spam
- Auto-logout ensures session security

## 🔄 Future Enhancements

- [ ] Backend API integration
- [ ] Real database authentication
- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication
- [ ] Transaction history
- [ ] Account balance display
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Push notifications

---

**Built with ❤️ using React, EmailJS, and modern security practices**
