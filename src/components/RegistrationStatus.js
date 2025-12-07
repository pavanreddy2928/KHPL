import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';

const RegistrationStatus = () => {
  const [searchData, setSearchData] = useState({
    searchType: 'phone',
    searchValue: ''
  });
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSearchResult(null);
  };

  const searchRegistration = async (e) => {
    e.preventDefault();
    
    if (!searchData.searchValue.trim()) {
      setError('Please enter a valid search value');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);

    try {
      // Load registrations from S3 or localStorage
      const { loadRegistrationData } = await import('../utils/awsS3Storage');
      let registrations = [];
      
      console.log('Starting registration search...');
      
      try {
        registrations = await loadRegistrationData();
        if (registrations && Array.isArray(registrations)) {
          console.log('Loaded from storage:', registrations.length, 'registrations');
        } else {
          registrations = [];
          console.log('No registration data found');
        }
      } catch (error) {
        console.log('Storage load failed:', error.message);
        registrations = [];
      }

      // If no registrations found, create a test registration for demonstration
      if (registrations.length === 0) {
        console.log('No registrations found, creating test data...');
        const testRegistration = {
          id: 1,
          name: 'Test Player',
          email: 'test@example.com',
          phoneNumber: '9876543210',
          aadhaarNumber: '123456789012',
          playerType: 'Batsman',
          jerseySize: 'M',
          amount: 500,
          paymentStatus: 'SUCCESS',
          status: 'Active',
          registrationDate: new Date().toLocaleDateString(),
          userPhoto: null,
          paymentScreenshot: null
        };
        registrations = [testRegistration];
        // Save test data to localStorage
        localStorage.setItem('khplRegistrations', JSON.stringify(registrations));
        console.log('Test registration created with phoneNumber: 9876543210 and aadhaarNumber: 123456789012');
      }

      console.log('Total registrations to search:', registrations.length);
      console.log('Searching for:', searchData.searchType, '=', searchData.searchValue);
      
      // Debug: Show all available phone numbers and aadhaar numbers
      console.log('Available phone numbers:', registrations.map(r => r.phoneNumber || r.phone).filter(Boolean));
      console.log('Available aadhaar numbers:', registrations.map(r => r.aadhaarNumber || r.aadhaar).filter(Boolean));

      // Search for registration (fix field name mapping)
      const foundRegistration = registrations.find(reg => {
        if (searchData.searchType === 'phone') {
          const regPhone = reg.phoneNumber || reg.phone; // Handle both field names
          console.log('Comparing phone:', regPhone, 'with', searchData.searchValue);
          return regPhone === searchData.searchValue;
        } else {
          const regAadhaar = reg.aadhaarNumber || reg.aadhaar; // Handle both field names
          console.log('Comparing aadhaar:', regAadhaar, 'with', searchData.searchValue);
          return regAadhaar === searchData.searchValue;
        }
      });

      console.log('Search result:', foundRegistration);

      if (foundRegistration) {
        setSearchResult(foundRegistration);
      } else {
        setError(`No registration found with this ${searchData.searchType === 'phone' ? 'phone number' : 'Aadhaar number'}. Total registrations checked: ${registrations.length}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Payment Failed': return 'danger';
      default: return 'warning';
    }
  };

  const getPaymentStatusVariant = (paymentStatus) => {
    switch (paymentStatus) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold text-primary">Check Registration Status</h2>
            <p className="lead text-muted">
              Search your KHPL registration using phone number or Aadhaar number
            </p>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h4 className="fw-bold mb-4 text-center">Search Registration</h4>
              
              <Form onSubmit={searchRegistration}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Search By</Form.Label>
                      <Form.Select
                        name="searchType"
                        value={searchData.searchType}
                        onChange={handleInputChange}
                        className="border-2"
                      >
                        <option value="phone">Phone Number</option>
                        <option value="aadhaar">Aadhaar Number</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        {searchData.searchType === 'phone' ? 'Phone Number' : 'Aadhaar Number'}
                      </Form.Label>
                      <Form.Control
                        type={searchData.searchType === 'phone' ? 'tel' : 'text'}
                        name="searchValue"
                        value={searchData.searchValue}
                        onChange={handleInputChange}
                        placeholder={searchData.searchType === 'phone' ? 'Enter phone number' : 'Enter Aadhaar number'}
                        className="border-2"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold d-block">&nbsp;</Form.Label>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-100"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-search me-2"></i>
                            Search
                          </>
                        )}
                      </Button>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>

              {error && (
                <Alert variant="danger" className="mt-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {searchResult && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">Registration Details</h4>
                  <Badge bg={getStatusBadgeVariant(searchResult.status)} className="fs-6">
                    {searchResult.status || 'Pending'}
                  </Badge>
                </div>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">Registration ID:</strong>
                      <div className="fs-5 fw-semibold text-primary">#{searchResult.id}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Full Name:</strong>
                      <div className="fs-6">{searchResult.name}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Email:</strong>
                      <div className="fs-6">{searchResult.email}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Phone:</strong>
                      <div className="fs-6">{searchResult.phoneNumber || searchResult.phone}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Aadhaar:</strong>
                      <div className="fs-6">{searchResult.aadhaarNumber || searchResult.aadhaar}</div>
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">Player Type:</strong>
                      <div className="fs-6">{searchResult.playerType}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Jersey Size:</strong>
                      <div className="fs-6">{searchResult.jerseySize}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Registration Fee:</strong>
                      <div className="fs-6">₹{searchResult.amount || 500}</div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Payment Status:</strong>
                      <div>
                        <Badge bg={getPaymentStatusVariant(searchResult.paymentStatus)} className="fs-7">
                          {searchResult.paymentStatus || 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-muted">Registration Date:</strong>
                      <div className="fs-6">{searchResult.registrationDate}</div>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4 p-3 bg-light rounded">
                  <div className="row">
                    <div className="col-md-8">
                      <h6 className="fw-bold mb-2">Tournament Information:</h6>
                      <ul className="mb-0 small">
                        <li>Venue: Gunjuru, Bengaluru</li>
                        <li>Tournament: Karnataka Hardball Premier League (KHPL)</li>
                        <li>Registration Status: {searchResult.status === 'Active' ? 'Confirmed' : 'Pending Verification'}</li>
                      </ul>
                    </div>
                    <div className="col-md-4 text-md-end">
                      {searchResult.paymentStatus === 'SUCCESS' && searchResult.status === 'Active' && (
                        <div className="text-success">
                          <i className="fas fa-check-circle fs-4"></i>
                          <div className="small fw-semibold mt-1">Registration Complete</div>
                        </div>
                      )}
                      {searchResult.paymentStatus === 'PENDING' && (
                        <div className="text-warning">
                          <i className="fas fa-clock fs-4"></i>
                          <div className="small fw-semibold mt-1">Payment Pending</div>
                        </div>
                      )}
                      {searchResult.paymentStatus === 'FAILED' && (
                        <div className="text-danger">
                          <i className="fas fa-times-circle fs-4"></i>
                          <div className="small fw-semibold mt-1">Payment Failed</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {searchResult.paymentStatus !== 'SUCCESS' && (
                  <div className="mt-3">
                    <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Need Help?</strong> If you have completed the payment but status shows as pending, 
                      please contact our support team with your registration ID.
                    </Alert>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {!searchResult && !loading && !error && (
            <Card className="border-0 bg-light">
              <Card.Body className="p-4 text-center">
                <i className="fas fa-search fs-1 text-muted mb-3"></i>
                <h5 className="text-muted">Search Your Registration</h5>
                <p className="text-muted mb-3">
                  Enter your phone number or Aadhaar number to check your KHPL registration status
                </p>
                <div className="alert alert-info">
                  <small>
                    <strong>Test Data Available:</strong> Try searching with phone number <code>9876543210</code> or Aadhaar <code>123456789012</code>
                  </small>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default RegistrationStatus;