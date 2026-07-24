// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axiosInstance from '../axiosInstance';
import './LoginPage.css';
import PageLoader from "../components/PageLoader"; // adjust path if needed

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(false);
const [loaderText, setLoaderText] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
     localStorage.setItem('token', res.data.token);
localStorage.setItem('user', JSON.stringify(res.data.user));

setLoaderText("Login Successful\nWelcome to Cuztory");
setShowLoader(true);

setTimeout(() => {
  navigate("/");
}, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axiosInstance.post('/auth/google-login', {
        tokenId: credentialResponse.credential,
      });
      localStorage.setItem('token', res.data.token);
localStorage.setItem('user', JSON.stringify(res.data.user));

setLoaderText("Login Successful\nWelcome to Cuztory");
setShowLoader(true);

setTimeout(() => {
  navigate("/");
}, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Google login failed');
    }
  };
if (showLoader) {
  return (
    <PageLoader
      message={loaderText}
    />
  );
}
  return (

    
    <div className="auth-container">
      
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit">Login</button>
      </form>

      <div className="google-login">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google login failed')}
        />
      </div>

      <p className="auth-redirect">
        Don't have an account? <a href="/register">Register now</a>
      </p>
    </div>
  );
};

export default LoginPage;
