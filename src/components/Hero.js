import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaInstagram, FaYoutube, FaFacebookF } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { loadImageFromS3 } from '../utils/s3ImageLoader';

const Hero = () => {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const loadLogo = async () => {
      const url = await loadImageFromS3('khpl.jpeg');
      setLogoUrl(url);
    };
    loadLogo();
  }, []);
  return (
    <section className="hero-section bg-primary text-white py-5">
      <Container>
        <Row className="text-center">
          <Col>
            <div className="mb-4">
              <img
                src={logoUrl || "/khpl.jpeg"}
                alt="KHPL Logo"
                className="rounded-circle border border-white border-3"
                style={{ width: '150px', height: '150px' }}
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23667eea'/%3E%3Ctext x='75' y='85' text-anchor='middle' fill='white' font-size='20' font-weight='bold'%3EKHPL%3C/text%3E%3C/svg%3E";
                }}
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