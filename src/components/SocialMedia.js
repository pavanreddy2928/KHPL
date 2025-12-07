import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';

const SocialMedia = () => {
  return (
    <section className="social-section py-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="g-3">
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <FaInstagram size={32} className="text-danger me-3" />
                  <span className="h5 mb-0 text-primary fw-semibold">
                    Follow us on Instagram
                  </span>
                </div>
                <Button variant="outline-primary" size="sm">
                  Follow
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <FaFacebookF size={32} className="text-primary me-3" />
                  <span className="h5 mb-0 text-primary fw-semibold">
                    Like & follow us on Facebook
                  </span>
                </div>
                <Button variant="outline-primary" size="sm">
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