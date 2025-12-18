import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaInstagram } from 'react-icons/fa';

const SocialMedia = () => {
  return (
    <section 
      className="social-section py-5" 
      style={{ 
        background: `
          linear-gradient(135deg, 
            rgba(218, 165, 32, 0.9) 0%, 
            rgba(184, 134, 11, 0.8) 25%, 
            rgba(139, 69, 19, 0.7) 50%, 
            rgba(160, 82, 45, 0.8) 75%, 
            rgba(205, 133, 63, 0.9) 100%
          ),
          url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><pattern id="cultural" patternUnits="userSpaceOnUse" width="20" height="20"><rect width="20" height="20" fill="none"/><circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.1)"/></pattern><rect width="100" height="100" fill="url(%23cultural)"/></svg>')
        `,
        backgroundSize: 'cover, 50px 50px',
        position: 'relative'
      }}
    >
      {/* Cultural Pattern Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><defs><pattern id="temple" patternUnits="userSpaceOnUse" width="30" height="30"><path d="M15,5 L25,15 L20,20 L15,15 L10,20 L5,15 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="60" height="60" fill="url(%23temple)"/></svg>')`,
          opacity: 0.3,
          pointerEvents: 'none'
        }}
      />
      
      <Container style={{ position: 'relative', zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card 
              className="border-0 shadow-lg"
              style={{
                background: 'rgba(255, 248, 220, 0.95)',
                border: '2px solid rgba(218, 165, 32, 0.3)',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Card.Body className="d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <FaInstagram 
                    size={36} 
                    style={{
                      color: '#E4405F',
                      marginRight: '15px',
                      filter: 'drop-shadow(2px 2px 4px rgba(139, 69, 19, 0.3))'
                    }}
                  />
                  <span 
                    className="h5 mb-0 fw-bold"
                    style={{
                      color: '#654321',
                      textShadow: '1px 1px 2px rgba(218, 165, 32, 0.3)',
                      fontFamily: 'serif'
                    }}
                  >
                    📱 Follow us on Instagram
                  </span>
                </div>
                <Button 
                  size="sm"
                  as="a"
                  href="https://www.instagram.com/khpl_s1?igsh=MXc2cDM2NmRnZHR0dw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(45deg, #DAA520, #B8860B)',
                    border: '2px solid #8B4513',
                    color: 'white',
                    fontWeight: '600',
                    padding: '8px 20px',
                    borderRadius: '25px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 8px rgba(139, 69, 19, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(139, 69, 19, 0.4)';
                    e.target.style.background = 'linear-gradient(45deg, #FFD700, #DAA520)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 8px rgba(139, 69, 19, 0.3)';
                    e.target.style.background = 'linear-gradient(45deg, #DAA520, #B8860B)';
                  }}
                >
                  Follow
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default SocialMedia;