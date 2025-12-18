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
    <Navbar 
      expand="lg" 
      sticky="top"
      style={{
        background: 'linear-gradient(135deg, #FF4500 0%, #DC143C 50%, #B22222 100%)',
        borderBottom: 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        minHeight: '70px',
        padding: '10px 0'
      }}
    >
      <Container>
        <Navbar.Brand 
          href="#home" 
          className="fw-bold d-flex align-items-center"
          style={{
            color: 'white',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            fontSize: '1.8rem',
            letterSpacing: '2px'
          }}
        >
          <img
            src="https://khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com/images/khpl.jpeg"
            width="50"
            height="50"
            className="d-inline-block align-top me-3 rounded-circle"
            alt="KHPL Logo"
            crossOrigin="anonymous"
            style={{
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
            }}
          />
          KHPL
        </Navbar.Brand>
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav"
          style={{
            borderColor: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              href="#home"
              style={{
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.target.style.color = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              🏠 Home
            </Nav.Link>
            <Nav.Link 
              onClick={handleRegistrationClick} 
              style={{
                cursor: 'pointer',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.target.style.color = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              🏏 Register
            </Nav.Link>
            <Nav.Link 
              href="#status"
              style={{
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.target.style.color = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              📊 Check Status
            </Nav.Link>
            <Nav.Link 
              href="#about"
              style={{
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.target.style.color = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              ℹ️ About
            </Nav.Link>
            <Nav.Link 
              href="#contact"
              style={{
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.target.style.color = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              📞 Contact Us
            </Nav.Link>
            <Nav.Link 
              onClick={handleShowAdmin} 
              style={{
                cursor: 'pointer',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.target.style.color = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              <i className={`fas ${isAdminLoggedIn ? 'fa-users-cog' : 'fa-sign-in-alt'} me-1`}></i>
              {isAdminLoggedIn ? `👨‍💼 Admin (${adminUser?.role})` : '🔐 Admin Login'}
            </Nav.Link>
            
            {isAdminLoggedIn && (
              <Nav.Link 
                onClick={handleLogout} 
                style={{
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '600',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 69, 0, 0.3)';
                  e.target.style.color = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'white';
                }}
              >
                <i className="fas fa-sign-out-alt me-1"></i>
                🚪 Logout
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