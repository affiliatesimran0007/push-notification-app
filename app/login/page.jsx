'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody, MDBInput, MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Fixed credentials check
    if (formData.email === 'admin@gmail.com' && formData.password === 'Babaji@123') {
      // Store auth state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', formData.email);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <MDBContainer fluid className={styles.loginContainer}>
      <div className="d-flex justify-content-center align-items-center h-100">
        <MDBCard className={styles.loginCard}>
          <MDBCardBody className="p-5">
            <div className="text-center mb-4">
              <MDBIcon fas icon="bell" size="3x" className="text-primary mb-3" />
              <h2 className="fw-bold mb-2">Push Notification App</h2>
              <p className="text-muted">Please login to your account</p>
            </div>
            <form onSubmit={handleSubmit}>
              <MDBInput
                wrapperClass="mb-4"
                label="Email address"
                id="email"
                name="email"
                type="email"
                size="lg"
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <MDBInput
                wrapperClass="mb-4"
                label="Password"
                id="password"
                name="password"
                type="password"
                size="lg"
                value={formData.password}
                onChange={handleChange}
                required
              />

              {error && (
                <div className="alert alert-danger py-2 mb-4" role="alert">
                  {error}
                </div>
              )}

              <MDBBtn
                className="w-100 mb-4"
                size="lg"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </MDBBtn>
            </form>
          </MDBCardBody>
        </MDBCard>
      </div>
    </MDBContainer>
  );
}