import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaInstagram } from 'react-icons/fa';

const SocialMedia = () => {
  return (
    <section className="social-section py-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <FaInstagram size={32} className="text-danger me-3" />
                  <span className="h5 mb-0 text-primary fw-semibold">
                    Follow us on Instagram
                  </span>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  as="a"
                  href="https://www.instagram.com/khpl_s1?igsh=MXc2cDM2NmRnZHR0dw=="
                  target="_blank"
                  rel="noopener noreferrer"
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