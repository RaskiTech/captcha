

import { useState } from 'react';
import './App.css';
import './App.css'
import { Captcha } from './Captcha'

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnText, setBtnText] = useState('Sign In');

  const handlePasswordToggle = () => {
    setShowPassword((v) => !v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setBtnLoading(true);
    }
  }

  return (
    <>
      <div className="background-crack bg-crack-1"></div>
      <div className="background-crack bg-crack-2"></div>
      <div className="background-crack bg-crack-3"></div>
      <div className="login-container">
        <div className="crack crack-1"></div>
        <div className="crack crack-2"></div>
        <div className="crack crack-3"></div>
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="forgot-password">
            <a href="#" onClick={e => { e.preventDefault(); alert('Forgot password functionality would redirect to password reset page'); }}>Forgot your password?</a>
          </div>
          <button type="submit" className="login-btn" disabled={btnLoading}>{btnText}</button>
        </form>
        <div className="divider">
          <span>or continue with</span>
        </div>
        <div className="social-login">
          <button className="social-btn" type="button" onClick={() => alert('Google login integration would go here')}>🔵</button>
          <button className="social-btn" type="button" onClick={() => alert('Facebook login integration would go here')}>📘</button>
          <button className="social-btn" type="button" onClick={() => alert('Apple login integration would go here')}>🍎</button>
        </div>
        <div className="signup-link">
          Don't have an account?{' '}
          <a href="#" onClick={e => { e.preventDefault(); alert('Sign up page would open here'); }}>Sign up</a>
        </div>
      </div>
      <Captcha></Captcha>
    </>
  );
}      

export default App;
