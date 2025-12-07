import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaInstagram, FaYoutube, FaFacebookF } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const Hero = () => {
  return (
    <section className="hero-section bg-primary text-white py-5">
      <Container>
        <Row className="text-center">
          <Col>
            <div className="mb-4">
              <img
                src="https://khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com/images/khpl.jpeg"
                alt="KHPL Logo"
                className="rounded-circle border border-white border-3"
                style={{ width: '150px', height: '150px' }}
                crossOrigin="anonymous"
              />
            </div>
            <h1 className="display-4 fw-bold mb-3">
              Karnataka Hardball Premier League
            </h1>
            <h2 className="h3 mb-4">
              🏏 Karnataka's Premier
              <br />
              Hardball Cricket League
            </h2>
            
            {/* Social Media Icons */}
            <div className="social-icons mb-4">
              <Button variant="outline-light" className="rounded-circle me-3 p-3">
                <FaInstagram size={24} />
              </Button>
              <Button variant="outline-light" className="rounded-circle me-3 p-3">
                <FaYoutube size={24} />
              </Button>
              <Button variant="outline-light" className="rounded-circle me-3 p-3">
                <FaFacebookF size={24} />
              </Button>
              <Button variant="outline-light" className="rounded-circle p-3">
                <FaXTwitter size={24} />
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Hero;