// Signup.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Container,
  Box
} from '@mui/material';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const navigate = useNavigate();

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleSignup = async () => {
    if (!username || !email || !password) {
      showAlert('Please fill all fields', 'warning');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      showAlert('Signup successful!', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Signup failed', 'error');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={10} display="flex" flexDirection="column" gap={2}>
        <Typography variant="h5" textAlign="center">Signup</Typography>

        <TextField
          label="Username"
          fullWidth
          variant="outlined"
          onChange={e => setUsername(e.target.value)}
        />
        <TextField
          label="Email"
          fullWidth
          variant="outlined"
          type="email"
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          fullWidth
          variant="outlined"
          type="password"
          onChange={e => setPassword(e.target.value)}
        />
        <Button variant="contained" onClick={handleSignup} fullWidth>
          Signup
        </Button>
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
