import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

const Header = () => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  // Check if admin is already logged in on component mount
  useEffect(() => {
    const storedAdmin = sessionStorage.getItem('khplAdminUser');
    if (storedAdmin) {
      const adminData = JSON.parse(storedAdmin);
      setIsAdminLoggedIn(true);
      setAdminUser(adminData);
    }
  }, []);

  const handleCloseAdminLogin = () => setShowAdminLogin(false);
  
  const handleShowAdmin = () => {
    if (isAdminLoggedIn) {
      setShowAdminPanel(true);
    } else {
      setShowAdminLogin(true);
    }
  };
  
  const handleCloseAdmin = () => setShowAdminPanel(false);
  
  const handleLoginSuccess = (user) => {
    setIsAdminLoggedIn(true);
    setAdminUser(user);
    setShowAdminPanel(true);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('khplAdminUser');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    setShowAdminPanel(false);
  };

  const handleRegistrationClick = () => {
    // If not on home page, navigate to home first
    if (window.location.hash !== '#home' && window.location.hash !== '') {
      window.location.hash = '#home';
      // Wait for page to load then scroll
      setTimeout(() => {
        const registrationElement = document.getElementById('registration');
        if (registrationElement) {
          registrationElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll to registration
      const registrationElement = document.getElementById('registration');
      if (registrationElement) {
        registrationElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="#home" className="fw-bold">
          <img
            src={`${process.env.PUBLIC_URL}/khpl.jpeg`}
            width="40"
            height="40"
            className="d-inline-block align-top me-2 rounded-circle"
            alt="KHPL Logo"
          />
          KHPL
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link onClick={handleRegistrationClick} style={{cursor: 'pointer'}}>Register</Nav.Link>
            <Nav.Link href="#status">Check Status</Nav.Link>
            <Nav.Link href="#about">About</Nav.Link>
            <Nav.Link href="#contact">Contact Us</Nav.Link>
            <Nav.Link onClick={handleShowAdmin} style={{cursor: 'pointer'}}>
              <i className={`fas ${isAdminLoggedIn ? 'fa-users-cog' : 'fa-sign-in-alt'} me-1`}></i>
              {isAdminLoggedIn ? `Admin (${adminUser?.role})` : 'Admin Login'}
            </Nav.Link>
            
            {isAdminLoggedIn && (
              <Nav.Link onClick={handleLogout} style={{cursor: 'pointer'}} className="text-warning">
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
      
      {/* Admin Login Modal */}
      <AdminLogin 
        show={showAdminLogin} 
        handleClose={handleCloseAdminLogin}
        onLoginSuccess={handleLoginSuccess}
      />
      
      {/* Admin Panel Modal */}
      <AdminPanel 
        show={showAdminPanel} 
        handleClose={handleCloseAdmin} 
      />
    </Navbar>
  );
};

export default Header;