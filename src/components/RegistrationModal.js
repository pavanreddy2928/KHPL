import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { saveRegistrationToDynamoDB } from '../utils/dynamoDBStorage';
import { uploadMultipleRegistrationImages } from '../utils/registrationImageUpload';
import { performHealthCheck, logHealthStatus } from '../utils/systemHealthCheck';

// Utility function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const RegistrationModal = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    district: '',
    aadhaarCopy: null,
    playerType: '',
    image: null,
    userPhoto: null,
    paymentScreenshot: null,
    // File objects for S3 upload
    aadhaarCopyFile: null,
    imageFile: null,
    paymentScreenshotFile: null
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleModalClose = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phoneNumber: '', 
      district: '',
      aadhaarCopy: null, 
      playerType: '', 
      image: null, 
      userPhoto: null, 
      paymentScreenshot: null,
      aadhaarCopyFile: null,
      imageFile: null,
      paymentScreenshotFile: null
    });
    setShowPaymentScreen(false);
    setShowSuccessScreen(false);
    setSuccessData(null);
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Convert to base64 for preview display
        const base64 = await fileToBase64(file);
        setFormData(prev => ({
          ...prev,
          image: file,
          imageFile: file, // Store file object for S3 upload
          userPhoto: base64 // Store base64 for preview display
        }));
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  };

  const handlePaymentScreenshotChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Convert to base64 for preview display
        const base64 = await fileToBase64(file);
        setPaymentScreenshot(file);
        setFormData(prev => ({
          ...prev,
          paymentScreenshot: base64, // Store base64 for preview display
          paymentScreenshotFile: file // Store file object for S3 upload
        }));
      } catch (error) {
        throw error;
      }
    }
  };

  const handleAadhaarCopyChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Convert to base64 for preview display
        const base64 = await fileToBase64(file);
        setFormData(prev => ({
          ...prev,
          aadhaarCopy: base64,
          aadhaarCopyFile: file // Store file object for S3 upload
        }));
      } catch (error) {
        throw error;
      }
    }
  };

  // Helper function to update registration image status
  const updateRegistrationImageStatus = async (registrationId, updateData) => {
    try {
      const { updateRegistrationStatus } = await import('../utils/dynamoDBStorage');
      await updateRegistrationStatus(registrationId, updateData);
    } catch (error) {
      console.error('Error updating image status:', error);
    }
  };

  const addToInternalSheet = async (data, paymentInfo = {}) => {
    try {
      // Generate unique registration ID
      const registrationId = `KHPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔄 Starting registration save process for ID:', registrationId);
      
      // Create registration data without File objects for DynamoDB
      const registrationData = {
        id: registrationId,
        // Only include serializable string/number/boolean data
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        district: data.district || '',
        playerType: data.playerType || '',
        aadhaarNumber: data.aadhaarNumber || '',
        city: data.city || '',
        team: data.team || '',
        registrationDate: new Date().toLocaleString(),
        imageName: data.image ? data.image.name : 'No image',
        paymentScreenshotName: paymentScreenshot ? paymentScreenshot.name : null,
        status: paymentInfo.status || 'Payment Pending',
        paymentId: paymentInfo.transactionId || null,
        amount: 999,
        paymentStatus: paymentInfo.paymentStatus || 'PENDING',
        // Initialize image status
        imageUploadStatus: 'pending',
        hasImages: !!(data.aadhaarCopyFile || data.imageFile || data.paymentScreenshotFile),
        uploadedImageCount: 0,
        totalImageCount: [data.aadhaarCopyFile, data.imageFile, data.paymentScreenshotFile].filter(Boolean).length
      };
      
      // Save to DynamoDB first (without waiting for images)
      console.log('💾 Saving registration to DynamoDB...');
      let result = await saveRegistrationToDynamoDB(registrationData);
      
      if (result.success) {
        console.log('✅ Registration saved to DynamoDB successfully');
        
        // Upload images to S3 in parallel (don't wait for completion)
        const imageFiles = {};
        console.log('🔍 Checking for image files:', {
          aadhaarCopyFile: !!data.aadhaarCopyFile,
          imageFile: !!data.imageFile,
          paymentScreenshotFile: !!data.paymentScreenshotFile
        });
        
        if (data.aadhaarCopyFile) {
          console.log('📎 Adding Aadhaar file:', data.aadhaarCopyFile.name, data.aadhaarCopyFile.size);
          imageFiles.aadhaar = data.aadhaarCopyFile;
        }
        if (data.imageFile) {
          console.log('📎 Adding user photo:', data.imageFile.name, data.imageFile.size);
          imageFiles.userPhoto = data.imageFile;
        }
        if (data.paymentScreenshotFile) {
          console.log('📎 Adding payment screenshot:', data.paymentScreenshotFile.name, data.paymentScreenshotFile.size);
          imageFiles.paymentScreenshot = data.paymentScreenshotFile;
        }
        
        if (Object.keys(imageFiles).length > 0) {
          console.log('🚀 Starting parallel image upload to S3 for', Object.keys(imageFiles).length, 'files:', Object.keys(imageFiles));
          
          // Start image upload in background (don't await)
          uploadMultipleRegistrationImages(registrationId, imageFiles)
            .then(async (imageUploadResults) => {
              console.log('📊 Image upload completed:', imageUploadResults);
              
              // Update DynamoDB with image upload status
              try {
                const updateData = {
                  imageUploadStatus: imageUploadResults.success ? 'completed' : 'failed',
                  uploadedImageCount: imageUploadResults.summary?.successful || 0,
                  imageUploadResults: imageUploadResults.results
                };
                
                await updateRegistrationImageStatus(registrationId, updateData);
                console.log('✅ Updated registration with image status');
              } catch (updateError) {
                console.error('❌ Failed to update image status:', updateError);
              }
            })
            .catch(error => {
              console.error('❌ Image upload failed:', error);
              // Update status to failed
              updateRegistrationImageStatus(registrationId, {
                imageUploadStatus: 'failed',
                uploadError: error.message
              }).catch(console.error);
            });
        }
        
        return result.data;
      } else {
        console.error('❌ DynamoDB save failed:', result.error);
        throw new Error(`Registration failed: ${result.error || 'Database not available'}`);
      }
    } catch (error) {
      console.error('❌ Registration process failed:', error);
      // No fallback mechanism - fail if DynamoDB is not available
      throw new Error(`Registration failed: ${error.message || 'Database service unavailable'}`);
    }
  };

  const processUPIPayment = async (registrationData, retryCount = 0) => {
    setIsProcessingPayment(true);
    const maxRetries = 2;
    
    try {
      const transactionId = `KHPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentData = {
        amount: 999, // ₹999
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phoneNumber,
        transactionId: transactionId
      };
      
      console.log(`🔄 Processing payment attempt ${retryCount + 1}/${maxRetries + 1}`);
      
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
        
        // Set success data and show success screen
        setSuccessData({
          registrationId: newRecord.id,
          transactionId: paymentResult.transactionId,
          playerName: registrationData.name,
          phoneNumber: registrationData.phoneNumber,
          amount: 999,
          registrationDate: new Date().toLocaleDateString()
        });
        setShowPaymentScreen(false);
        setShowSuccessScreen(true);
        
        console.log('✅ Payment processed successfully');
        
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error(`❌ Payment attempt ${retryCount + 1} failed:`, error.message);
      
      // Retry logic for network-related failures
      const retryableErrors = ['Network timeout', 'UPI service temporarily unavailable', 'timeout'];
      const isRetryable = retryableErrors.some(err => error.message.toLowerCase().includes(err.toLowerCase()));
      
      if (isRetryable && retryCount < maxRetries) {
        console.log(`🔄 Retrying payment in 3 seconds... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        setAlertMessage(`Payment failed: ${error.message}. Retrying automatically...`);
        setAlertVariant('warning');
        setShowAlert(true);
        
        // Wait 3 seconds before retry
        setTimeout(() => {
          processUPIPayment(registrationData, retryCount + 1);
        }, 3000);
        return;
      }
      
      // Final failure - save registration with payment failure status
      try {
        await addToInternalSheet(formData, {
          status: 'Payment Failed',
          transactionId: null,
          paymentStatus: 'FAILED',
          failureReason: error.message
        });
        
        setAlertMessage(
          `Payment failed after ${retryCount + 1} attempt${retryCount > 0 ? 's' : ''}: ${error.message}. ` +
          `Your registration has been saved and you can retry payment later by contacting support.`
        );
      } catch (registrationError) {
        console.error('❌ Failed to save registration after payment failure:', registrationError);
        setAlertMessage(
          `Payment failed: ${error.message}. Additionally, there was an issue saving your registration. ` +
          `Please contact support with your details.`
        );
      }
      
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
      // Check database connectivity before processing payment
      const { validateConfiguration } = await import('../utils/dynamoDBStorage');
      const dbConfigValid = validateConfiguration();
      
      if (!dbConfigValid) {
        setAlertMessage('Database service is not properly configured. Please contact support.');
        setAlertVariant('warning');
        setShowAlert(true);
        // Allow payment to continue even with DB issues for better UX
      }
      
      // Add payment screenshot to form data (use the base64 version from formData)
      const paymentData = {
        ...formData,
        paymentScreenshotFile: paymentScreenshot // Keep the File object for filename
      };
      await processUPIPayment(paymentData);
    } catch (error) {
      console.error('❌ Payment completion error:', error);
      setAlertMessage(`Error processing payment: ${error.message || 'Please try again.'}`);;
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

  const runSystemHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await performHealthCheck();
      setSystemHealth(health);
      
      // Show health summary in alert
      if (health.overall === 'healthy') {
        setAlertMessage('✅ All systems are working properly. Payment failures may be temporary - please try again.');
        setAlertVariant('success');
      } else if (health.overall === 'warning') {
        setAlertMessage('⚠️ Some system components have issues. Payment may still work, but there could be delays.');
        setAlertVariant('warning');
      } else {
        setAlertMessage('❌ System issues detected. Please contact support for assistance.');
        setAlertVariant('danger');
      }
      
      setShowAlert(true);
      
      // Log detailed health report to console for debugging
      await logHealthStatus();
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setAlertMessage('Unable to run system check. Please contact support.');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Simulate UPI Gateway payment for demo (replace with actual integration)
  const simulateUPIPayment = async (paymentData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success (95% success rate for better user experience)
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      return {
        success: true,
        transactionId: paymentData.transactionId,
        paymentId: `PAY_${Date.now()}`,
        amount: paymentData.amount
      };
    } else {
      // Simulate different types of failures
      const failureReasons = [
        'Insufficient balance in account',
        'Payment declined by bank',
        'Network timeout - please retry',
        'UPI service temporarily unavailable',
        'Invalid UPI PIN entered'
      ];
      const randomFailure = failureReasons[Math.floor(Math.random() * failureReasons.length)];
      
      return {
        success: false,
        error: randomFailure
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.district || !formData.aadhaarCopy || !formData.playerType || !formData.image) {
      setAlertMessage('Please fill in all required fields including district, Aadhaar copy, player type, and upload an image.');
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
    

    
    // Show payment screen instead of processing payment immediately
    setShowPaymentScreen(true);
    setShowAlert(false);
  }; // handleSubmit function end

  return ( // RegistrationModal component return
    <Modal show={show} onHide={handleModalClose} size="lg" centered backdrop="static" keyboard={false}>
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
        
        {!showPaymentScreen && !showSuccessScreen ? (
        <Form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <div className="form-section mb-4">
            <h6 className="text-primary mb-3 border-bottom pb-2">
              <i className="fas fa-user me-2"></i>
              Personal Information
            </h6>
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
                    District <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Enter your district"
                    required
                  />
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
          </div>
          
          {/* Document Upload Section */}
          <div className="form-section mb-4">
            <h6 className="text-primary mb-3 border-bottom pb-2">
              <i className="fas fa-file-upload me-2"></i>
              Document Upload
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Aadhaar Card Copy <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="aadhaarCopy"
                    onChange={handleAadhaarCopyChange}
                    accept="image/*,.pdf"
                    required
                  />
                  <Form.Text className="text-muted">
                    Upload a clear copy of your Aadhaar card (Image or PDF format)
                  </Form.Text>
                  {formData.aadhaarCopy && (
                    <div className="mt-2">
                      <Badge bg="success" className="mb-2">
                        <i className="fas fa-check-circle me-1"></i>
                        Aadhaar copy uploaded
                      </Badge>
                      {formData.aadhaarCopy.startsWith('data:image/') && (
                        <div className="border rounded p-2 bg-light">
                          <img 
                            src={formData.aadhaarCopy} 
                            alt="Aadhaar Copy Preview" 
                            className="img-fluid rounded"
                            style={{maxHeight: '150px', maxWidth: '100%', objectFit: 'contain'}}
                          />
                          <div className="text-center mt-2">
                            <small className="text-muted">Aadhaar Copy Preview</small>
                          </div>
                        </div>
                      )}
                      {formData.aadhaarCopy.startsWith('data:application/pdf') && (
                        <div className="border rounded p-3 bg-light text-center">
                          <i className="fas fa-file-pdf fa-3x text-danger mb-2"></i>
                          <div className="small text-muted">PDF Document Uploaded</div>
                          <div className="small text-muted">Preview not available for PDF files</div>
                        </div>
                      )}
                    </div>
                  )}
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
                  {formData.userPhoto && (
                    <div className="mt-2">
                      <Badge bg="success" className="mb-2">
                        <i className="fas fa-check-circle me-1"></i>
                        Profile photo uploaded
                      </Badge>
                      <div className="border rounded p-2 bg-light">
                        <img 
                          src={formData.userPhoto} 
                          alt="Profile Photo Preview" 
                          className="img-fluid rounded"
                          style={{maxHeight: '150px', maxWidth: '100%', objectFit: 'cover'}}
                        />
                        <div className="text-center mt-2">
                          <small className="text-muted">Profile Photo Preview</small>
                        </div>
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Registration Information Section */}
          <div className="bg-light p-3 rounded mb-3">
            <h6 className="text-primary mb-2">Registration Details:</h6>
            <ul className="mb-0 small">
              <li><strong>Registration Fee: ₹999</strong></li>
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
        ) : showPaymentScreen && !showSuccessScreen ? (
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
                <div className="col-6"><strong>Aadhaar Copy:</strong></div>
                <div className="col-6">
                  {formData.aadhaarCopy ? (
                    <Badge bg="success">
                      <i className="fas fa-check-circle me-1"></i>
                      Uploaded
                    </Badge>
                  ) : (
                    <span className="text-muted">Not uploaded</span>
                  )}
                </div>
                <div className="col-6"><strong>Player Type:</strong></div>
                <div className="col-6">{formData.playerType}</div>

                <div className="col-12 mt-2 pt-2 border-top">
                  <strong className="text-success fs-5">Total Amount: ₹999</strong>
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
                  src="https://khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com/images/KHPL-QR-CODE.jpeg" 
                  alt="KHPL QR Code for Payment" 
                  className="img-fluid rounded"
                  style={{width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain'}}
                  crossOrigin="anonymous"
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
                  <div className="small fw-bold text-primary">₹999</div>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = 'https://khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com/images/KHPL-QR-CODE.jpeg';
                      link.download = 'KHPL-Payment-QR-Code.jpeg';
                      link.click();
                    }}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download QR
                  </Button>
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
                  I have paid ₹999
                </>
              )}
            </Button>
          </div>
        </div>
        ) : showSuccessScreen ? (
        <div className="success-screen text-center py-5">
          <div className="mb-4">
            <div className="success-icon mb-3">
              <i className="fas fa-check-circle fa-5x text-success"></i>
            </div>
            <h2 className="text-success mb-3">
              <i className="fas fa-trophy me-2"></i>
              Registration Successful!
            </h2>
            <div className="alert alert-success mx-3">
              <h5 className="mb-3">Welcome to KHPL!</h5>
              <div className="row text-start">
                <div className="col-5"><strong>Player Name:</strong></div>
                <div className="col-7">{successData?.playerName}</div>
                <div className="col-5"><strong>Phone Number:</strong></div>
                <div className="col-7">{successData?.phoneNumber}</div>
                <div className="col-5"><strong>Registration ID:</strong></div>
                <div className="col-7">#{successData?.registrationId}</div>
                <div className="col-5"><strong>Registration Date:</strong></div>
                <div className="col-7">{successData?.registrationDate}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Next Steps:</strong>
                <ul className="mt-2 mb-0 text-start">
                  <li>You will receive a confirmation email shortly</li>
                  <li>Keep your Registration ID for future reference</li>
                  <li>Tournament details will be shared via email</li>
                </ul>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleModalClose}
              className="mt-3"
            >
              <i className="fas fa-home me-2"></i>
              Close
            </Button>
            <div className="mt-2">
              <small className="text-muted">
                This window will close automatically in 5 seconds
              </small>
            </div>
          </div>
        </div>
        ) : null}  
      </Modal.Body>
      
      {!showPaymentScreen && !showSuccessScreen && (
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