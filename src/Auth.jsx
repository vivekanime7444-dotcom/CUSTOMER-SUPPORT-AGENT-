import React, { useState } from 'react';
import { 
  Sparkles, Mail, Lock, User, Shield, ShieldCheck, 
  Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, LogIn, Key
} from 'lucide-react';

const DEFAULT_USERS = [
  {
    id: 'CUST-1',
    name: 'Alex Morgan',
    email: 'customer@vmart.com',
    password: 'password123',
    role: 'user'
  },
  {
    id: 'ADMIN-1',
    name: 'Administrator',
    email: 'admin@vmart.com',
    password: 'admin123',
    role: 'admin'
  }
];

const Auth = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [roleTab, setRoleTab] = useState('user'); // 'user' or 'admin'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Get all registered users from localStorage or default
  const getUsers = () => {
    try {
      const saved = localStorage.getItem('vmart_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  };

  const handleUserLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const email = loginEmail.trim().toLowerCase();
    const pass = loginPassword.trim();

    if (!email || !pass) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email && u.role === 'user');

    if (!found) {
      setErrorMsg('No customer account found with this email. Please check or sign up.');
      return;
    }

    if (found.password !== pass) {
      setErrorMsg('Incorrect password. Please try again.');
      return;
    }

    setSuccessMsg(`Welcome back, ${found.name}! Logging you in...`);
    setTimeout(() => {
      onLogin(found);
    }, 400);
  };

  const handleAdminLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const email = loginEmail.trim().toLowerCase();
    const pass = loginPassword.trim();

    if (!email || !pass) {
      setErrorMsg('Please enter Admin ID/Email and security key.');
      return;
    }

    const users = getUsers();
    const found = users.find(u => 
      (u.email.toLowerCase() === email || u.id.toLowerCase() === email) && 
      u.role === 'admin'
    );

    if (!found) {
      setErrorMsg('Admin credentials not recognized or insufficient privileges.');
      return;
    }

    if (found.password !== pass) {
      setErrorMsg('Invalid admin security key / password.');
      return;
    }

    setSuccessMsg(`Admin verified: Welcome, ${found.name}!`);
    setTimeout(() => {
      onLogin(found);
    }, 400);
  };

  const handleSignup = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const pass = signupPassword;
    const confirm = signupConfirm;

    if (!name || !email || !pass) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (pass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (pass !== confirm) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
      setErrorMsg('An account with this email address already exists.');
      return;
    }

    const newCustomerId = `CUST-${1000 + users.filter(u => u.role === 'user').length + 1}`;
    const newUser = {
      id: newCustomerId,
      name: name,
      email: email,
      password: pass,
      role: 'user'
    };

    const updatedList = [...users, newUser];
    localStorage.setItem('vmart_registered_users', JSON.stringify(updatedList));

    setSuccessMsg(`Account created for ${name}! Logging you in...`);
    setTimeout(() => {
      onLogin(newUser);
    }, 500);
  };

  // Quick demo login helpers
  const handleQuickDemoCustomer = () => {
    setErrorMsg('');
    setSuccessMsg('Authenticating Demo Customer...');
    setLoginEmail('customer@vmart.com');
    setLoginPassword('password123');
    const demoCust = getUsers().find(u => u.role === 'user') || DEFAULT_USERS[0];
    setTimeout(() => onLogin(demoCust), 300);
  };

  const handleQuickDemoAdmin = () => {
    setErrorMsg('');
    setSuccessMsg('Authenticating Demo Administrator...');
    setLoginEmail('admin@vmart.com');
    setLoginPassword('admin123');
    const demoAdmin = getUsers().find(u => u.role === 'admin') || DEFAULT_USERS[1];
    setTimeout(() => onLogin(demoAdmin), 300);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.15), transparent 40%), #0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '350px',
        height: '350px',
        background: 'rgba(99, 102, 241, 0.12)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '350px',
        height: '350px',
        background: roleTab === 'admin' && mode === 'login' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(168, 85, 247, 0.12)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        transition: 'background 0.3s ease'
      }} />

      {/* Main Glassmorphic Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(19, 20, 31, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: roleTab === 'admin' && mode === 'login' 
              ? 'linear-gradient(135deg, #10b981, #06b6d4)' 
              : 'var(--accent-gradient)',
            boxShadow: roleTab === 'admin' && mode === 'login'
              ? '0 8px 20px rgba(16, 185, 129, 0.3)'
              : '0 8px 20px rgba(99, 102, 241, 0.3)',
            marginBottom: '14px',
            transition: 'all 0.3s ease'
          }}>
            {roleTab === 'admin' && mode === 'login' ? (
              <ShieldCheck size={28} color="white" />
            ) : (
              <Sparkles size={28} color="white" />
            )}
          </div>
          <h1 style={{
            margin: '0 0 6px 0',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #ffffff, #cbd5e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            V MART
          </h1>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}>
            {mode === 'signup' 
              ? 'Create your customer account to start shopping'
              : roleTab === 'admin'
                ? 'Authorized Administrator Portal'
                : 'Intelligent Customer Support & Store Hub'}
          </p>
        </div>

        {/* Top Segmented Mode Control: Sign In vs Sign Up */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: mode === 'login' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
              borderRadius: '9px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: mode === 'signup' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : 'var(--text-muted)',
              borderRadius: '9px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* In Login Mode: User Login vs Admin Login Sub-Tabs */}
        {mode === 'login' && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px'
          }}>
            <button
              type="button"
              onClick={() => { 
                setRoleTab('user'); 
                setErrorMsg(''); 
                setSuccessMsg('');
                if (loginEmail === 'admin@vmart.com') setLoginEmail('');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: roleTab === 'user' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                background: roleTab === 'user' ? 'rgba(99, 102, 241, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                color: roleTab === 'user' ? '#a5b4fc' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={16} /> Customer Login
            </button>

            <button
              type="button"
              onClick={() => { 
                setRoleTab('admin'); 
                setErrorMsg(''); 
                setSuccessMsg('');
                if (loginEmail === 'customer@vmart.com') setLoginEmail('');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: roleTab === 'admin' ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
                background: roleTab === 'admin' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                color: roleTab === 'admin' ? '#6ee7b7' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Shield size={16} /> Admin Login
            </button>
          </div>
        )}

        {/* Notification alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            color: '#6ee7b7',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={roleTab === 'user' ? handleUserLogin : handleAdminLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {roleTab === 'admin' ? 'Admin Email / ID' : 'Email Address'}
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px',
                transition: 'border-color 0.2s ease'
              }}>
                {roleTab === 'admin' ? (
                  <Key size={18} color="#94a3b8" />
                ) : (
                  <Mail size={18} color="#94a3b8" />
                )}
                <input
                  type="text"
                  placeholder={roleTab === 'admin' ? 'admin@vmart.com or ADMIN-1' : 'customer@vmart.com'}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {roleTab === 'admin' ? 'Security Password' : 'Password'}
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Lock size={18} color="#94a3b8" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                border: 'none',
                borderRadius: '10px',
                background: roleTab === 'admin' 
                  ? 'linear-gradient(135deg, #10b981, #06b6d4)' 
                  : 'var(--accent-gradient)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: roleTab === 'admin'
                  ? '0 4px 16px rgba(16, 185, 129, 0.3)'
                  : '0 4px 16px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease',
                marginBottom: '16px'
              }}
            >
              <LogIn size={18} />
              {roleTab === 'admin' ? 'Access Admin Console' : 'Sign In to V Mart'}
            </button>

            {/* Quick Demo Login Option */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {roleTab === 'admin' ? 'Default: admin@vmart.com' : 'Default: customer@vmart.com'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                  {roleTab === 'admin' ? 'Pass: admin123' : 'Pass: password123'}
                </div>
              </div>
              <button
                type="button"
                onClick={roleTab === 'admin' ? handleQuickDemoAdmin : handleQuickDemoCustomer}
                style={{
                  background: roleTab === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid',
                  borderColor: roleTab === 'admin' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                  color: roleTab === 'admin' ? '#34d399' : '#818cf8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ⚡ 1-Click Login
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Full Name
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <User size={18} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Mail size={18} color="#94a3b8" />
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Create Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Lock size={18} color="#94a3b8" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Confirm Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px'
              }}>
                <Lock size={18} color="#94a3b8" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                border: 'none',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease',
                marginBottom: '16px'
              }}
            >
              <span>Create Customer Account</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Footer switch prompt */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {mode === 'login' ? (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px'
                }}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px'
                }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
