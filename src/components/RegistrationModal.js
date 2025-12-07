import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { saveRegistrationData, loadRegistrationData } from '../utils/awsS3Storage';

const RegistrationModal = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    aadhaarNumber: '',
    playerType: '',
    jerseySize: '',
    image: null
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

  const handleModalClose = () => {
    setShowPaymentScreen(false);
    setShowAlert(false);
    setPaymentScreenshot(null);
    handleClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handlePaymentScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentScreenshot(file);
    }
  };

  const addToInternalSheet = async (data, paymentInfo = {}) => {
    try {
      // Get existing data from S3 or create new array
      const existingData = await loadRegistrationData() || [];
      
      // Add new registration with timestamp and ID
      const newRegistration = {
        id: existingData.length + 1,
        ...data,
        registrationDate: new Date().toLocaleString(),
        imageName: data.image ? data.image.name : 'No image',
        paymentScreenshotName: data.paymentScreenshot ? data.paymentScreenshot.name : null,
        status: paymentInfo.status || 'Payment Pending',
        paymentId: paymentInfo.transactionId || null,
        amount: 500,
        paymentStatus: paymentInfo.paymentStatus || 'PENDING'
      };
      
      existingData.push(newRegistration);
      
      // Try to save to S3 (with localStorage fallback)
      try {
        const result = await saveRegistrationData(newRegistration);
        if (result.success) {
          console.log(`Registration data saved to ${result.storage} successfully`);
          return result.data;
        } else {
          console.log('S3 save failed:', result.error);
        }
      } catch (error) {
        console.warn('S3 save failed, using localStorage fallback:', error.message);
      }
      
      // Save to localStorage (primary storage)
      localStorage.setItem('khplRegistrations', JSON.stringify(existingData));
      
      return newRegistration;
    } catch (error) {
      console.error('GitHub save error, falling back to localStorage:', error);
      
      // Fallback to localStorage if GitHub fails
      const existingData = JSON.parse(localStorage.getItem('khplRegistrations') || '[]');
      const newRegistration = {
        id: existingData.length + 1,
        ...data,
        registrationDate: new Date().toLocaleString(),
        imageName: data.image ? data.image.name : 'No image',
        paymentScreenshotName: data.paymentScreenshot ? data.paymentScreenshot.name : null,
        status: paymentInfo.status || 'Payment Pending',
        paymentId: paymentInfo.transactionId || null,
        amount: 500,
        paymentStatus: paymentInfo.paymentStatus || 'PENDING'
      };
      
      existingData.push(newRegistration);
      localStorage.setItem('khplRegistrations', JSON.stringify(existingData));
      
      return newRegistration;
    }
  };

  const processUPIPayment = async (registrationData) => {
    setIsProcessingPayment(true);
    
    try {
      const transactionId = `KHPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentData = {
        amount: 500, // ₹500
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phoneNumber,
        transactionId: transactionId
      };
      
      // For demo purposes, we'll simulate a successful payment
      // In production, use the actual UPI Gateway API
      const paymentResult = await simulateUPIPayment(paymentData);
      
      if (paymentResult.success) {
        // Add registration with payment success
        const newRecord = await addToInternalSheet(registrationData, {
          status: 'Active',
          transactionId: paymentResult.transactionId,
          paymentStatus: 'SUCCESS'
        });
        
        setAlertMessage(`Payment successful! Registration #${newRecord.id} completed and saved to GitHub. Transaction ID: ${paymentResult.transactionId}`);
        setAlertVariant('success');
        setShowAlert(true);
        
        // Reset form after delay
        setTimeout(() => {
          setFormData({ name: '', email: '', phoneNumber: '', aadhaarNumber: '', playerType: '', jerseySize: '', image: null });
          setPaymentScreenshot(null);
          setShowAlert(false);
          setShowPaymentScreen(false);
          handleClose();
        }, 3000);
        
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      
      // Add registration with payment failure
      await addToInternalSheet(formData, {
        status: 'Payment Failed',
        transactionId: null,
        paymentStatus: 'FAILED'
      });
      
      setAlertMessage(`Payment failed: ${error.message}. Registration saved to GitHub with pending payment status.`);
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentComplete = async () => {
    // Validate payment screenshot upload
    if (!paymentScreenshot) {
      setAlertMessage('Please upload payment screenshot before proceeding.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    try {
      // Add payment screenshot to form data
      const paymentData = {
        ...formData,
        paymentScreenshot: paymentScreenshot
      };
      await processUPIPayment(paymentData);
    } catch (error) {
      setAlertMessage('Error processing payment. Please try again.');
      setAlertVariant('danger');
      setShowAlert(true);
      setShowPaymentScreen(false);
    }
  };

  const goBackToForm = () => {
    setShowPaymentScreen(false);
    setShowAlert(false);
    setPaymentScreenshot(null);
  };

  // Simulate UPI Gateway payment for demo (replace with actual integration)
  const simulateUPIPayment = async (paymentData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return {
        success: true,
        transactionId: paymentData.transactionId,
        paymentId: `PAY_${Date.now()}`,
        amount: paymentData.amount
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by bank'
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.aadhaarNumber || !formData.playerType || !formData.jerseySize || !formData.image) {
      setAlertMessage('Please fill in all required fields including Aadhaar number, player type, jersey size, and upload an image.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlertMessage('Please enter a valid email address.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
      setAlertMessage('Please enter a valid 10-digit phone number.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    // Aadhaar validation (12 digits)
    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(formData.aadhaarNumber.replace(/\D/g, ''))) {
      setAlertMessage('Please enter a valid 12-digit Aadhaar number.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    // Show payment screen instead of processing payment immediately
    setShowPaymentScreen(true);
    setShowAlert(false);
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-cricket-ball me-2"></i>
          KHPL Registration Form
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        {showAlert && (
          <Alert variant={alertVariant} className="mb-3">
            {alertMessage}
          </Alert>
        )}
        
        {!showPaymentScreen ? (
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Full Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Email Address <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Phone Number <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Aadhaar Card Number <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleInputChange}
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength="12"
                  pattern="[0-9]{12}"
                  required
                />
                <Form.Text className="text-muted">
                  Enter your 12-digit Aadhaar number (without spaces)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Player Type <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="playerType"
                  value={formData.playerType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Player Type</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="Allrounder">Allrounder</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Jersey Size <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="jerseySize"
                  value={formData.jerseySize}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Jersey Size</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="3XL">3XL</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Profile Photo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                <Form.Text className="text-muted">
                  Upload your photo (JPG, PNG, GIF - Max 5MB)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="bg-light p-3 rounded mb-3">
            <h6 className="text-primary mb-2">Registration Details:</h6>
            <ul className="mb-0 small">
              <li><strong>Registration Fee: ₹500 (including GST)</strong></li>
              <li>Payment Method: UPI Gateway</li>
              <li>Tournament Location: Karnataka</li>
              <li>Venue: Gunjuru, Bengaluru</li>
              <li>Registration Status: Open</li>
            </ul>
            <div className="mt-2 p-2 bg-warning bg-opacity-25 rounded">
              <small className="text-dark">
                <i className="fas fa-info-circle me-1"></i>
                <strong>Payment Note:</strong> You will be redirected to UPI Gateway for secure payment processing.
              </small>
            </div>
          </div>
        </Form>
        ) : (
        <div className="payment-screen text-center">
          <div className="mb-4">
            <i className="fas fa-mobile-alt fa-3x text-primary mb-3"></i>
            <h4 className="text-primary mb-3">Complete Payment</h4>
            <div className="bg-light p-3 rounded mb-4">
              <h6 className="text-dark mb-2">Registration Summary</h6>
              <div className="row text-start">
                <div className="col-6"><strong>Name:</strong></div>
                <div className="col-6">{formData.name}</div>
                <div className="col-6"><strong>Email:</strong></div>
                <div className="col-6">{formData.email}</div>
                <div className="col-6"><strong>Phone:</strong></div>
                <div className="col-6">{formData.phoneNumber}</div>
                <div className="col-6"><strong>Aadhaar:</strong></div>
                <div className="col-6">{formData.aadhaarNumber}</div>
                <div className="col-6"><strong>Player Type:</strong></div>
                <div className="col-6">{formData.playerType}</div>
                <div className="col-6"><strong>Jersey Size:</strong></div>
                <div className="col-6">{formData.jerseySize}</div>
                <div className="col-12 mt-2 pt-2 border-top">
                  <strong className="text-success fs-5">Total Amount: ₹500</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div className="payment-options mb-4">
            <h5 className="mb-3">Choose Payment Method</h5>
            
            {/* UPI Scanner Section */}
            <div className="border rounded p-4 mb-3 bg-light">
              <h6 className="text-primary mb-3">
                <i className="fas fa-qrcode me-2"></i>
                Scan QR Code to Pay
              </h6>
              <div className="qr-code-container bg-white border rounded p-3 mb-3 mx-auto" style={{width: '220px'}}>
                <img 
                  src="/KHPL-QR-CODE.jpeg" 
                  alt="KHPL QR Code for Payment" 
                  className="img-fluid rounded"
                  style={{width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain'}}
                />
                <div className="qr-placeholder bg-light border rounded align-items-center justify-content-center" style={{height: '180px', display: 'none'}}>
                  <div className="text-center">
                    <i className="fas fa-qrcode fa-4x text-muted mb-2"></i>
                    <div className="small text-muted">QR Code Image</div>
                    <div className="small text-muted">Not Found</div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div className="small text-muted">Scan to Pay</div>
                  <div className="small fw-bold text-primary">₹500</div>
                </div>
              </div>
              <div className="small text-muted mb-3">
                Open any UPI app (GPay, PhonePe, Paytm, etc.) and scan this QR code
              </div>
            </div>
            
            {/* UPI ID Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-2">
                <i className="fas fa-at me-2"></i>
                Pay using UPI ID
              </h6>
              <div className="bg-light p-2 rounded font-monospace">
                8105739293@kotak811
              </div>
              <div className="small text-muted mt-1">
                Copy this UPI ID and use in your UPI app
              </div>
            </div>
            
            {/* Phone Number Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-2">
                <i className="fas fa-phone me-2"></i>
                Pay using Phone Number
              </h6>
              <div className="bg-light p-2 rounded font-monospace">
                +91 8105739293
              </div>
              <div className="small text-muted mt-1">
                Use this number in your UPI app to send payment
              </div>
            </div>
          </div>
          
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            After completing payment, upload screenshot and click "I have paid" button below
          </div>
          
          {/* Payment Screenshot Upload */}
          <div className="border rounded p-3 mb-3 bg-light">
            <h6 className="text-primary mb-3">
              <i className="fas fa-camera me-2"></i>
              Upload Payment Screenshot <span className="text-danger">*</span>
            </h6>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handlePaymentScreenshotChange}
              className="mb-2"
              required
            />
            {paymentScreenshot && (
              <div className="mt-2 p-2 bg-success bg-opacity-25 rounded">
                <small className="text-success">
                  <i className="fas fa-check me-1"></i>
                  Screenshot uploaded: {paymentScreenshot.name}
                </small>
              </div>
            )}
            <Form.Text className="text-muted">
              Please upload a clear screenshot of your payment confirmation (JPG, PNG - Max 5MB)
            </Form.Text>
          </div>
          
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-secondary" onClick={goBackToForm}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to Form
            </Button>
            <Button 
              variant="success" 
              onClick={handlePaymentComplete}
              disabled={isProcessingPayment || !paymentScreenshot}
              className="px-4"
            >
              {isProcessingPayment ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Verifying Payment...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  I have paid ₹500
                </>
              )}
            </Button>
          </div>
        </div>
        )}
      </Modal.Body>
      
      {!showPaymentScreen && (
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={isProcessingPayment}
            className="px-4"
            style={{ background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
          >
            <i className="fas fa-arrow-right me-2"></i>
            Next
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default RegistrationModal;