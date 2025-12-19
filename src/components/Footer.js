import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4">
      <Container>
        <Row>
          <Col md={6}>
            <h5 className="fw-bold mb-3">Karnataka Hardball Premier League</h5>
            <p className="mb-2">Karnataka Biggest Hardball Cricket League</p>
            <p className="text-muted">From local talent to professional cricket</p>
          </Col>
          <Col md={6} className="text-md-end">
            <h6 className="mb-3">Follow Us</h6>
            <div className="social-links">
              <a href="https://www.instagram.com/khpl_s1?igsh=MXc2cDM2NmRnZHR0dw==" className="text-light" aria-label="Follow us on Instagram" target="_blank" rel="noopener noreferrer">
                <FaInstagram size={24} />
              </a>
            </div>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row>
          <Col className="text-center">
            <p className="mb-0 text-muted">
              &copy; 2026 Karnataka Hardball Premier League. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;