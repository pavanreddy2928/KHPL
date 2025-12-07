import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import RegistrationModal from './RegistrationModal';

const Registration = () => {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <section id="registration" className="registration-section py-5" style={{ background: 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)' }}>
      <Container>
        <Row className="g-4">
          {/* Grand Finals Card */}
          <Col md={6}>
            <Card className="h-100 border-0 shadow-lg" style={{ background: 'linear-gradient(45deg, #FFE066 0%, #FF6B6B 100%)' }}>
              <Card.Body className="p-4 text-center">
                <Badge bg="success" className="mb-3 px-3 py-2">
                  #streetheroestostadiumsuperstars
                </Badge>
                <h3 className="fw-bold text-dark mb-3">Matches at Gunjur Bengaluru</h3>
                
                <div className="india-map">
                  <img
                    src="/api/placeholder/100/120"
                    alt="India Map"
                    className="img-fluid"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Sign Up Card */}
          <Col md={6}>
            <Card className="h-100 border-0 shadow-lg" style={{ background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' }}>
              <Card.Body className="p-4 text-center text-white">
                <h2 className="fw-bold display-6 mb-3" style={{ color: '#FFE066' }}>
                  SIGN UP FOR
                  <br />
                  KHPL NOW
                </h2>
                <h4 className="mb-4">Early bird Registration</h4>
                <div className="price-section mb-4">
                  <span className="h3 fw-bold">at ₹499 + GST*</span>
                </div>
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="fw-bold px-4 py-3 mb-3"
                  style={{ fontSize: '1.2rem' }}
                  onClick={handleShowModal}
                >
                  REGISTER NOW
                </Button>
                <div className="text-light">
                  <small>*T&C APPLY</small>
                </div>
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