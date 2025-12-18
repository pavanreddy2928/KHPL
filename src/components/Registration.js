import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import RegistrationModal from './RegistrationModal';

const Registration = () => {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <section id="registration" className="registration-section py-5">
      <Container>
        <Row className="justify-content-center">
          {/* Sign Up Card */}
          <Col md={6}>
            <Card 
              className="h-100 border-0 shadow-lg" 
              style={{ 
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 30%, #FF8C00 70%, #B8860B 100%)',
                border: '3px solid #DAA520',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(139, 69, 19, 0.3)'
              }}
            >
              <Card.Body className="p-4 text-center position-relative">
                {/* Karnataka pattern overlay */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 80% 80%, rgba(178, 34, 34, 0.1) 0%, transparent 40%),
                      repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(139, 69, 19, 0.05) 20px, rgba(139, 69, 19, 0.05) 40px)
                    `,
                    borderRadius: '12px',
                    pointerEvents: 'none'
                  }}
                />
                <h2 className="fw-bold display-6 mb-3" style={{ 
                  color: '#654321',
                  textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 215, 0, 0.3)',
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  🏏 SIGN UP FOR KHPL NOW
                </h2>
                <h4 className="mb-4" style={{ 
                  color: '#8B4513',
                  textShadow: '1px 1px 3px rgba(255, 255, 255, 0.7)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  Early bird Registration
                </h4>
                <div className="price-section mb-4" style={{ position: 'relative', zIndex: 1 }}>
                  <span 
                    className="h3 fw-bold" 
                    style={{ 
                      color: '#654321',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '2px solid #DAA520',
                      textShadow: '1px 1px 2px rgba(139, 69, 19, 0.3)'
                    }}
                  >
                    at ₹999*
                  </span>
                </div>
                <Button 
                  size="lg" 
                  className="fw-bold px-4 py-3 mb-3"
                  style={{ 
                    fontSize: '1.2rem',
                    background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #654321 100%)',
                    border: '2px solid #DAA520',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    boxShadow: '0 4px 15px rgba(139, 69, 19, 0.4)',
                    position: 'relative',
                    zIndex: 1,
                    borderRadius: '10px'
                  }}
                  onClick={handleShowModal}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #DAA520 0%, #B8860B 50%, #8B4513 100%)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #654321 100%)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  REGISTER NOW
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Registration Status */}
        <Row className="mt-4">
          <Col className="text-center">
            <Card className="bg-white shadow">
              <Card.Body className="py-3">
                <h5 className="mb-0 text-primary fw-bold">
                  🎯 Registrations are opened
                </h5>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Registration Modal */}
      <RegistrationModal 
        show={showModal} 
        handleClose={handleCloseModal} 
      />
    </section>
  );
};

export default Registration;