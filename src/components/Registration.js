import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Registration = () => {

  return (
    <section id="registration" className="registration-section py-5">
      <Container>
        <Row className="justify-content-center">
          {/* Registration Completed Card */}
          <Col md={8} lg={6}>
            <Card 
              className="h-100 border-0 shadow-lg" 
              style={{ 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 30%, #17a2b8 70%, #007bff 100%)',
                border: '3px solid #28a745',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(40, 167, 69, 0.3)'
              }}
            >
              <Card.Body className="p-5 text-center position-relative">
                {/* Success pattern overlay */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
                      repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255, 255, 255, 0.05) 20px, rgba(255, 255, 255, 0.05) 40px)
                    `,
                    borderRadius: '12px',
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Success Icon */}
                <div 
                  className="mb-4"
                  style={{ 
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <div 
                    style={{
                      fontSize: '4rem',
                      color: '#ffffff',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    ✅
                  </div>
                </div>

                <h2 className="fw-bold display-5 mb-3" style={{ 
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  🏏 REGISTRATION COMPLETED
                </h2>
                
                <h4 className="mb-4" style={{ 
                  color: '#f8f9fa',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  Thank you for joining KHPL!
                </h4>
                
                <div className="completion-message mb-4" style={{ position: 'relative', zIndex: 1 }}>
                  <div 
                    className="p-4"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      border: '2px solid #ffffff',
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}
                  >
                    <p className="mb-2 h5">🎉 Registration Period Has Ended</p>
                    <p className="mb-0">
                      We have received an overwhelming response! <br/>
                      Stay tuned for match schedules and updates.
                    </p>
                  </div>
                </div>

                <div 
                  className="info-text"
                  style={{ 
                    position: 'relative',
                    zIndex: 1,
                    color: '#ffffff',
                    fontSize: '1rem'
                  }}
                >
                  <p className="mb-2">
                    📧 Check your email for confirmation details
                  </p>
                  <p className="mb-0">
                    📱 Follow us on social media for updates
                  </p>
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
                <h5 className="mb-0 text-success fw-bold">
                  🎯 Registration Period Completed - Thank You!
                </h5>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Registration;