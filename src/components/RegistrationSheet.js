import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { loadRegistrationData } from '../utils/awsS3Storage';

const RegistrationSheet = () => {
  const [registrations, setRegistrations] = useState([]);
  const [lastUpdated] = useState(new Date());

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      // Load from S3 with localStorage fallback
      const data = await loadRegistrationData();
      if (data && Array.isArray(data)) {
        setRegistrations(data);
        return;
      }
    } catch (error) {
      // Silent fallback to localStorage
    }
    
    // Final fallback to localStorage
    const localData = JSON.parse(localStorage.getItem('khplRegistrations') || '[]');
    setRegistrations(localData);
  };

  const downloadExcelSheet = () => {
    if (registrations.length === 0) {
      alert('No registrations found to export.');
      return;
    }

    // Create Excel workbook
    const ws = XLSX.utils.json_to_sheet(registrations);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KHPL Registrations');
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 8 },  // ID
      { wch: 20 }, // Name
      { wch: 30 }, // Email  
      { wch: 15 }, // Phone
      { wch: 15 }, // Aadhaar
      { wch: 15 }, // Player Type
      { wch: 12 }, // Jersey Size
      { wch: 20 }, // Registration Date
      { wch: 15 }, // Image Name
      { wch: 10 }  // Status
    ];
    ws['!cols'] = colWidths;
    
    // Generate filename with timestamp
    const fileName = `KHPL_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <section id="registrations" className="registration-sheet py-4" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">
                    <i className="fas fa-table me-2"></i>
                    KHPL Registration Sheet
                  </h5>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="light" text="dark" className="me-3">
                    Last Updated: {lastUpdated.toLocaleTimeString()}
                  </Badge>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={downloadExcelSheet}
                    disabled={registrations.length === 0}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download Excel
                  </Button>
                </div>
              </Card.Header>
              
              <Card.Body className="p-0">
                {registrations.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No registrations yet</h5>
                    <p className="text-muted">New registrations will appear here automatically</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="mb-0" hover>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '60px' }}>ID</th>
                          <th style={{ width: '140px' }}>Name</th>
                          <th style={{ width: '170px' }}>Email</th>
                          <th style={{ width: '110px' }}>Phone</th>
                          <th style={{ width: '120px' }}>Aadhaar</th>
                          <th style={{ width: '90px' }}>Player Type</th>
                          <th style={{ width: '70px' }}>Jersey</th>
                          <th style={{ width: '90px' }}>Amount</th>
                          <th style={{ width: '110px' }}>Payment</th>
                          <th style={{ width: '120px' }}>Date</th>
                          <th style={{ width: '90px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((reg, index) => (
                          <tr key={index} className={index === registrations.length - 1 ? 'table-warning' : ''}>
                            <td>
                              <Badge 
                                bg={index === registrations.length - 1 ? 'warning' : 'primary'}
                                className="fw-bold"
                              >
                                {reg.id || index + 1}
                              </Badge>
                            </td>
                            <td className="fw-semibold">{reg.name}</td>
                            <td>{reg.email}</td>
                            <td>{reg.phoneNumber}</td>
                            <td className="font-monospace small text-muted">
                              {reg.aadhaarNumber || 'N/A'}
                            </td>
                            <td>
                              <Badge bg="secondary" className="small">
                                {reg.playerType || 'N/A'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="outline-dark" className="small">
                                {reg.jerseySize || 'N/A'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="info" className="fw-bold">
                                ₹{reg.amount || 2999}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={reg.paymentStatus === 'SUCCESS' ? 'success' : reg.paymentStatus === 'FAILED' ? 'danger' : 'warning'}>
                                <i className={`fas ${reg.paymentStatus === 'SUCCESS' ? 'fa-check' : reg.paymentStatus === 'FAILED' ? 'fa-times' : 'fa-clock'} me-1`}></i>
                                {reg.paymentStatus || 'PENDING'}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {reg.registrationDate}
                              </small>
                            </td>
                            <td>
                              <Badge 
                                bg={reg.status === 'Active' ? 'success' : reg.status === 'Payment Failed' ? 'danger' : 'warning'}
                                className="px-2"
                              >
                                {reg.status || 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
              
              {registrations.length > 0 && (
                <Card.Footer className="bg-light text-muted text-center">
                  <small>
                    <i className="fas fa-info-circle me-1"></i>
                    Total Registrations: <strong>{registrations.length}</strong> | 
                    Latest registration highlighted in yellow | 
                    Manual refresh available
                  </small>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default RegistrationSheet;