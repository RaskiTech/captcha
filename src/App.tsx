

import { useState } from 'react';
import './App.css';
import './App.css'
import Captcha from './Captcha'
import ReactConfetti from 'react-confetti';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnText, setBtnText] = useState('Sign In');
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaSuccess, setCaptchaSuccess] = useState(false);
  const [showSocial, setShowSocial] = useState([true, true, true]);

  const handlePasswordToggle = () => {
    setShowPassword((v) => !v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setShowCaptcha(true);
      setBtnLoading(true);
    }
  }

  const [tilted, setTilted] = useState(false);
  // Add the tilt after the slideUp animation ends
  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'slideUp') {
      setTilted(true);
    }
  };

  return (<>
    <div className="background-crack bg-crack-1"></div>
    <div className="background-crack bg-crack-2"></div>
    <div className="background-crack bg-crack-3"></div>
    <div
      className={`login-container${tilted ? ' tilted' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="crack crack-1"></div>
      <div className="crack crack-2"></div>
      <div className="crack crack-3"></div>
      <div className="logo">
        <div className={`logo-icon ${tilted ? ' tilted' : ''}`}></div>
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            placeholder="Enter your email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
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
        <button type="submit" className="login-btn" disabled={btnLoading}>{btnText}</button>
      </form>

      <div className="captcha-area">
        {showCaptcha && (
          <div className="captcha-reveal-anim">
            <Captcha onSuccess={() => {
              setCaptchaSuccess(true)
            }} />
          </div>
        )}
      </div>

        <div className="divider">
          <span>or continue with</span>
        </div>
        <div className="social-login">
          {showSocial[0]
            ? <button className="social-btn" type="button" onClick={() => setShowSocial([false, showSocial[1], showSocial[2]])}>🔵</button>
            : <span className="social-btn" style={{visibility: 'hidden'}}></span>}
          {showSocial[1]
            ? <button className="social-btn" type="button" onClick={() => setShowSocial([showSocial[0], false, showSocial[2]])}>📘</button>
            : <span className="social-btn" style={{visibility: 'hidden'}}></span>}
          {showSocial[2]
            ? <button className="social-btn" type="button" onClick={() => setShowSocial([showSocial[0], showSocial[1], false])}>🍎</button>
            : <span className="social-btn" style={{visibility: 'hidden'}}></span>}
        </div>
      </div>
      { captchaSuccess && (
        <ReactConfetti />
      )}
  );
}      

export default App;
