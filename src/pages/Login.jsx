// Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Container,
  Box
} from '@mui/material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      showAlert('Please fill all fields', 'warning');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      showAlert('Please enter a valid email', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: normalizedEmail,
        password,
      });

      localStorage.setItem('token', res.data.token);
      showAlert('Login successful!', 'success');

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      if (error.response) {
        showAlert(error.response.data.message || 'Login failed', 'error');
      } else {
        showAlert('Server not responding', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={10} display="flex" flexDirection="column" gap={2}>
        <Typography variant="h5" textAlign="center">Login</Typography>

        <TextField
          label="Email"
          fullWidth
          variant="outlined"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          fullWidth
          variant="outlined"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <Typography variant="body2" align="center">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </Typography>
      </Box>

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity} variant="filled">
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
