import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { register } from '../../services/api';
import Logo from '../../components/common/Logo';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'RESIDENT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <Logo size={36} showWordmark={true} />
          <h2 style={styles.title}>Create BariLog Account</h2>
          <p style={styles.subtitle}>
            Register your profile to manage apartments, residents, and building operations.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="text"
                required
                placeholder="Ibrahim Karim"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="email"
                required
                placeholder="ibrahim@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <div style={styles.inputWrapper}>
              <Phone size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="text"
                placeholder="+8801711223344"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password (Min 6 Characters)</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            <span>{loading ? 'Creating Account...' : 'Register Profile'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account?</span>{' '}
          <Link to="/login" style={styles.link}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-canvas)',
    padding: '30px 20px',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    border: '1px solid var(--border-hairline)',
    padding: '36px 32px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
  },
  brandHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '22px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    marginTop: '16px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    outline: 'none',
    fontSize: '13.5px',
    backgroundColor: 'var(--bg-surface)',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px',
    borderRadius: '8px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '13.5px',
    marginTop: '6px',
  },
  footer: {
    marginTop: '22px',
    textAlign: 'center',
    fontSize: '13px',
  },
  link: {
    color: 'var(--brand-primary)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  errorBox: {
    marginBottom: '16px',
    padding: '10px 14px',
    backgroundColor: 'var(--status-vacant-bg)',
    color: 'var(--status-vacant-text)',
    border: '1px solid var(--status-vacant-border)',
    borderRadius: '8px',
    fontSize: '13px',
  },
};

export default Register;
