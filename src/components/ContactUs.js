import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [showAlert, setShowAlert] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create mailto link
    const subject = encodeURIComponent(formData.subject || 'KHPL Contact Form Submission');
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`
    );
    const mailtoLink = `mailto:Pavanreddy.g2928@gmail.com?subject=${subject}&body=${body}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    // Show success message
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold text-primary">Contact Us</h2>
            <p className="lead text-muted">
              Get in touch with Karnataka Hardball Premier League
            </p>
          </div>

          {showAlert && (
            <Alert variant="success" className="mb-4">
              <i className="fas fa-check-circle me-2"></i>
              Your default email client should open with the message. If it doesn't, please copy the contact information below.
            </Alert>
          )}

          <Row>
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <div className="bg-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                         style={{ width: '60px', height: '60px' }}>
                      <i className="fas fa-envelope text-white fs-4"></i>
                    </div>
                    <h5 className="fw-bold">Email Us</h5>
                    <p className="text-muted mb-3">Send us your queries and we'll get back to you</p>
                    <a 
                      href="mailto:Pavanreddy.g2928@gmail.com" 
                      className="text-primary text-decoration-none fw-semibold"
                    >
                      Pavanreddy.g2928@gmail.com
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <div className="bg-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                         style={{ width: '60px', height: '60px' }}>
                      <i className="fas fa-phone text-white fs-4"></i>
                    </div>
                    <h5 className="fw-bold">Call Us</h5>
                    <p className="text-muted mb-3">Speak directly with our team</p>
                    <a 
                      href="tel:+918123277797" 
                      className="text-success text-decoration-none fw-semibold"
                    >
                      +91 81232 77797
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm mt-4">
            <Card.Body className="p-4">
              <h4 className="fw-bold mb-4 text-center">Send us a Message</h4>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                        className="border-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        required
                        className="border-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="border-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Subject</Form.Label>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Enter message subject"
                        className="border-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Message *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message here..."
                    required
                    className="border-2"
                  />
                </Form.Group>

                <div className="text-center">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    className="px-5 py-2 fw-semibold"
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    Send Message
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center mt-5">
            <Card className="border-0 bg-light">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Karnataka Hardball Premier League</h5>
                <p className="text-muted mb-0">
                  Join Karnataka's premier hardball cricket league and be part of the excitement!
                </p>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ContactUs;