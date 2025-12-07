import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const AdminLogin = ({ show, handleClose, onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Admin users database
  const adminUsers = [
    { username: 'khpluser1', password: 'pavanreddy.g2928', role: 'Super Admin' },
    { username: 'khpluser2', password: 'khpl@2025', role: 'Admin' },
    { username: 'khpluser3', password: 'cricket@khpl', role: 'Moderator' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find matching user
    const user = adminUsers.find(u => 
      u.username === credentials.username && 
      u.password === credentials.password
    );

    if (user) {
      // Store login session
      sessionStorage.setItem('khplAdminUser', JSON.stringify({
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString()
      }));
      
      // Success callback
      onLoginSuccess(user);
      
      // Reset form and close
      setCredentials({ username: '', password: '' });
      setShowAlert(false);
      handleClose();
    } else {
      setAlertMessage('Invalid username or password. Please try again.');
      setShowAlert(true);
    }
  };

  const handleModalClose = () => {
    setCredentials({ username: '', password: '' });
    setShowAlert(false);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="md" centered backdrop="static">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          <i className="fas fa-shield-alt me-2"></i>
          KHPL Admin Login
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        {showAlert && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {alertMessage}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-user me-2"></i>
              Username
            </Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter admin username"
              required
              autoComplete="username"
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>
              <i className="fas fa-lock me-2"></i>
              Password
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </Form.Group>
          
          <div className="d-grid">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              className="mb-3"
              style={{ background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
            >
              <i className="fas fa-sign-in-alt me-2"></i>
              Login to Admin Panel
            </Button>
          </div>
        </Form>
        
        <div className="text-center">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Contact system administrator for access
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AdminLogin;