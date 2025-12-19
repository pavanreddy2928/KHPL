import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { verifyPayment } from '../utils/phonePeConfig';

const PaymentSuccess = () => {
  const [paymentStatus, setPaymentStatus] = useState('verifying');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get transaction ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transactionId');
    const status = urlParams.get('code');

    if (transactionId) {
      verifyPaymentStatus(transactionId, status);
    } else {
      setError('Transaction ID not found');
      setPaymentStatus('error');
    }
  }, []);

  const verifyPaymentStatus = async (transactionId, status) => {
    try {
      // For demo purposes, simulate verification
      // In production, use actual PhonePe verification API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (status === 'PAYMENT_SUCCESS') {
        setPaymentDetails({
          transactionId,
          amount: 2999,
          status: 'SUCCESS',
          timestamp: new Date().toLocaleString()
        });
        setPaymentStatus('success');
        
        // Update registration status in DynamoDB
        updateRegistrationStatus(transactionId, 'SUCCESS');
      } else {
        setPaymentStatus('failed');
        updateRegistrationStatus(transactionId, 'FAILED');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error.message);
      setPaymentStatus('error');
    }
  };

  const updateRegistrationStatus = async (transactionId, status) => {
    try {
      const { updateRegistrationStatus } = await import('../utils/dynamoDBStorage');
      await updateRegistrationStatus(transactionId, {
        paymentStatus: status,
        status: status === 'SUCCESS' ? 'Active' : 'Payment Failed'
      });
      console.log('Payment status updated in DynamoDB');
    } catch (error) {
      console.error('Failed to update payment status in DynamoDB:', error);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (paymentStatus === 'verifying') {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="text-center">
              <Card.Body className="py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h4>Verifying Payment...</h4>
                <p className="text-muted">Please wait while we verify your payment with PhonePe.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="border-success">
              <Card.Header className="bg-success text-white text-center">
                <h3 className="mb-0">
                  <i className="fas fa-check-circle me-2"></i>
                  Payment Successful!
                </h3>
              </Card.Header>
              <Card.Body className="text-center py-4">
                <Alert variant="success" className="mb-4">
                  <h5>Welcome to Karnataka Hardball Premier League!</h5>
                  <p className="mb-0">Your registration has been confirmed and payment processed successfully.</p>
                </Alert>
                
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h6 className="text-primary">Transaction Details</h6>
                        <p className="mb-1"><strong>Transaction ID:</strong> {paymentDetails?.transactionId}</p>
                        <p className="mb-1"><strong>Amount Paid:</strong> ₹{paymentDetails?.amount}</p>
                        <p className="mb-0"><strong>Date:</strong> {paymentDetails?.timestamp}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h6 className="text-primary">Next Steps</h6>
                        <ul className="text-start small mb-0">
                          <li>Check your email for confirmation</li>
                          <li>Tournament schedule will be shared soon</li>
                          <li>Join our WhatsApp group for updates</li>
                          <li>Report to venue on match day</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleBackToHome}
                  className="px-4"
                >
                  <i className="fas fa-home me-2"></i>
                  Back to Home
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="border-danger">
              <Card.Header className="bg-danger text-white text-center">
                <h3 className="mb-0">
                  <i className="fas fa-times-circle me-2"></i>
                  Payment Failed
                </h3>
              </Card.Header>
              <Card.Body className="text-center py-4">
                <Alert variant="danger">
                  <h5>Payment could not be processed</h5>
                  <p className="mb-0">Your registration is saved but payment is pending. Please try again.</p>
                </Alert>
                
                <div className="mb-4">
                  <p className="text-muted">Common reasons for payment failure:</p>
                  <ul className="text-start text-muted small">
                    <li>Insufficient balance in account</li>
                    <li>Network connectivity issues</li>
                    <li>Transaction timeout</li>
                    <li>Bank server maintenance</li>
                  </ul>
                </div>
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <Button 
                    variant="primary" 
                    onClick={handleBackToHome}
                    className="me-md-2"
                  >
                    <i className="fas fa-redo me-2"></i>
                    Try Again
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleBackToHome}
                  >
                    Back to Home
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="border-warning">
            <Card.Header className="bg-warning text-center">
              <h3 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Payment Error
              </h3>
            </Card.Header>
            <Card.Body className="text-center py-4">
              <Alert variant="warning">
                <p className="mb-0">{error || 'An unexpected error occurred during payment processing.'}</p>
              </Alert>
              <Button 
                variant="primary" 
                onClick={handleBackToHome}
              >
                Back to Home
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentSuccess;