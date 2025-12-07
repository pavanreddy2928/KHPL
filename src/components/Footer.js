import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaInstagram, FaYoutube, FaFacebookF } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4">
      <Container>
        <Row>
          <Col md={6}>
            <h5 className="fw-bold mb-3">Karnataka Hardball Premier League</h5>
            <p className="mb-2">Karnataka's Premier Hardball Cricket League</p>
            <p className="text-muted">From local talent to professional cricket</p>
          </Col>
          <Col md={6} className="text-md-end">
            <h6 className="mb-3">Follow Us</h6>
            <div className="social-links">
              <a href="https://instagram.com/khpl" className="text-light me-3" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <FaInstagram size={24} />
              </a>
              <a href="https://youtube.com/@khpl" className="text-light me-3" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                <FaYoutube size={24} />
              </a>
              <a href="https://facebook.com/khpl" className="text-light me-3" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <FaFacebookF size={24} />
              </a>
              <a href="https://twitter.com/khpl" className="text-light" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <FaXTwitter size={24} />
              </a>
            </div>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row>
          <Col className="text-center">
            <p className="mb-0 text-muted">
              &copy; 2024 Karnataka Hardball Premier League. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;