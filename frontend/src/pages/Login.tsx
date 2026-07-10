import { FormEvent, useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import SquirrelLogo from '../components/SquirrelLogo';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        username,
        password,
      });

      localStorage.setItem('sn_token', res.data.accessToken);
      localStorage.setItem('sn_user', JSON.stringify(res.data.user));

      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page cyber-login">
      <div className="login-orb orb-a" />
      <div className="login-orb orb-b" />
      <div className="login-grid" />

      <div className="login-card cyber-login-card">
        <div className="door-logo">
          <div className="door door-left">
            <span />
          </div>

          <div className="door door-right">
            <span />
          </div>

          <div className="door-seam" />
          <div className="door-shockwave" />

          <div className="door-core">
            <SquirrelLogo size={54} compact />
          </div>
        </div>

        <p className="eyebrow">Squirrel Networks</p>
        <h1>ISP Command Login</h1>
        <p className="login-subtitle">
          Secure access to billing, PPPoE, MikroTik and GPON operations.
        </p>

        <form onSubmit={login}>
          <label>
            Username
            <div className="input-wrap cyber-input">
              <User size={18} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-wrap cyber-input">
              <Lock size={18} />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="admin123"
              />
            </div>
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="primary-btn cyber-login-btn" disabled={loading}>
            {loading ? 'Connecting...' : 'Enter Control Center'}
          </button>
        </form>
      </div>
    </div>
  );
}