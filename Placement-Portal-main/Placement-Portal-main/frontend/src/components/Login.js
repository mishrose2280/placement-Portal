import React, { useState,useContext } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { toast, Toaster } from 'react-hot-toast';
import './LoginForm.css';
import axios from 'axios';
import {  useNavigate } from 'react-router-dom';
import { useUser } from "../user-context";
import Navbar from './Navbar';

const Login = () => {
    // Access the environment variable
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const { login } = useUser();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.email.trim()) {
            toast.error('Please enter your email.');
            return;
        }
        if (isOtpSent) {
            handleOtpSubmit();
        } else if (isOtpVerified) {
            handlePasswordChange();
        } else if (isResetPassword) {
            handleResetPasswordRequest();
        } else {
            handleLoginRequest();
        }
    };

    const handleLoginRequest = () => {
        if (!formData.password.trim()) {
            toast.error('Please enter your password.');
            return;
        }
        const LoginEndpoint = `${apiBaseUrl}/user/login`;
        axios.post(LoginEndpoint, { email: formData.email, password: formData.password }, { withCredentials: true })
            .then((result) => {
                if (result.data.success === true) {
                    toast.success('Login successful!', { duration: 2000 });
                    // Handle successful login
                    console.log(result);
                if(result.data.success === true) {
                    const role=result.data.user.role;
                    const loggedInUser={
                        _id:result.data.user._id,
                        name:result.data.user.name,
                        email:result.data.user.email,
                        role:result.data.user.role,
                        token:result.data.user.token
                    }
                    login(loggedInUser);

                    setTimeout(() => {
                        if (role === "Student") {
                            // Go to student home page
                            console.log("Student logged in successfully");
                            navigate('/studentHome');
                        } else {
                            // Go to admin home page
                            console.log("Admin logged in successfully");
                            navigate('/adminHome');
                        }
                    }, 1000); // Adjust the delay (in milliseconds) as needed

                } else {
                    toast.error("Incorrect credentials", { duration: 2000 });
                }
                } else {
                    toast.error('Incorrect credentials. Please try again.', { duration: 2000 });
                }
            })
            .catch(error => {
                toast.error('Wrong credentials. Please try again.', { duration: 2000 });
                console.error('Error:', error.message);
            });
    };

    const handleResetPasswordRequest = () => {
        const ResetPswdEndpoint = `${apiBaseUrl}/user/sendOtpForResetPswd`;
        axios.post(ResetPswdEndpoint, { email: formData.email })
            .then((response) => {
                if (response.data.success) {
                    toast.success('Password reset link sent to your email', { duration: 3000 });
                    setIsOtpSent(true);
                } else {
                    toast.error('Error sending reset link. Please try again.', { duration: 3000 });
                }
            })
            .catch((error) => {
                toast.error('Error sending reset link. Please try again.', { duration: 3000 });
                console.error('Error:', error.message);
            });
    };

    const handleOtpSubmit = () => {
        const { email, otp } = formData;
        const verifyOtpEndpoint = `${apiBaseUrl}/user/verifyOtp`;
        axios.post(verifyOtpEndpoint, { email, otp })
            .then((response) => {
                if (response.data.success) {
                    toast.success('OTP verified successfully. Please enter your new password.', { duration: 3000 });
                    setIsOtpVerified(true);
                    setIsResetPassword(true);
                    setIsOtpSent(false);
                } else {
                    toast.error('Invalid OTP. Please try again.', { duration: 3000 });
                }
            })
            .catch((error) => {
                toast.error('Error verifying OTP. Please try again.', { duration: 3000 });
                console.error('Error:', error.message);
            });
    };

    const handlePasswordChange = () => {
        const { email, newPassword, confirmPassword } = formData;
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match. Please try again.', { duration: 3000 });
            return;
        }
        const changePswdEndpoint = `${apiBaseUrl}/user/changePassword`;
        axios.post(changePswdEndpoint, { email, newPassword })
            .then((response) => {
                if (response.data.success) {
                    toast.success('Password changed successfully. Please log in with your new password.', { duration: 3000 });
                    setIsOtpVerified(false);
                    setFormData({ email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
                    setPasswordChanged(false); // Set passwordChanged to true
                    setIsResetPassword(false)
                } else {
                    toast.error('Error changing password. Please try again.', { duration: 3000 });
                }
            })
            .catch((error) => {
                toast.error('Error changing password. Please try again.', { duration: 3000 });
                console.error('Error:', error.message);
            });
    };

    return (
        <div><Navbar/>
        <div className="login-container">
            <Toaster />
            
            <form onSubmit={handleSubmit} className="login-form">
                <h2>{isOtpSent ? 'Enter OTP' : isOtpVerified ? 'Enter New Password' : isResetPassword ? 'Reset Password' : 'Login'}</h2>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                    />
                </div>
                {!isResetPassword && !isOtpSent && (
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                        />
                        <span
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword
                                ? (
                                    <AiOutlineEyeInvisible />
                                ) : (
                                    <AiOutlineEye />
                                )}
                        </span>
                    </div>
                )}
                {isOtpSent && (
                    <div className="input-group">
                        <label htmlFor="otp">OTP</label>
                        <input
                            type="text"
                            id="otp"
                            name="otp"
                            value={formData.otp}
                            onChange={handleInputChange}
                            placeholder="Enter OTP"
                        />
                    </div>
                )}
                {isOtpVerified && (
                    <div>
                        <div className="input-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? (
                                    <AiOutlineEyeInvisible />
                                ) : (
                                    <AiOutlineEye />
                                )}
                            </span>
                        </div>
                        <div className="input-group">
                            <                            label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm new password"
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <AiOutlineEyeInvisible />
                                ) : (
                                    <AiOutlineEye />
                                )}
                            </span>
                        </div>
                    </div>
                )}
                {isOtpVerified && (
                    <div className="button-group">
                        <button type="submit">Apply Changes</button>
                    </div>
                )}
                {!isOtpVerified && (
                    <div className="button-group">
                        <button type="submit">{isOtpSent ? 'Submit OTP' : isResetPassword ? 'Send Reset Link' : 'Login'}</button>
                        {!isOtpSent && !isResetPassword && (
                            <button type="button" className="reset-password-button" onClick={() => setIsResetPassword(true)}>
                                Reset Password
                            </button>
                        )}
                        {(isResetPassword || isOtpSent) && (
                            <button type="button" className="reset-password-button" onClick={() => { setIsResetPassword(false); setIsOtpSent(false); }}>
                                Back to Login
                            </button>
                        )}
                    </div>
                )}
            </form>
            {passwordChanged && (
                <div className="login-form">
                    <h2>Login</h2>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                        />
                        <span
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword
                                ? (
                                    <AiOutlineEyeInvisible />
                                ) : (
                                    <AiOutlineEye />
                                )}
                        </span>
                    </div>
                    <div className="button-group">
                        <button type="submit">Login</button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default Login;
