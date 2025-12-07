import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Row, Col, Image, Tabs, Tab } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { loadRegistrationData, saveRegistrationData, verifyS3Access } from '../utils/awsS3Storage';
import RegistrationSheet from './RegistrationSheet';

const AdminPanel = ({ show, handleClose }) => {
  const [registrations, setRegistrations] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (show) {
      loadRegistrations();
    }
  }, [show]);

  const loadRegistrations = async () => {
    try {
      // Load from S3 with localStorage fallback
      const data = await loadRegistrationData();
      if (data && Array.isArray(data)) {
        setRegistrations(data);
        return;
      }
    } catch (error) {
      console.error('Failed to load registration data:', error);
    }
    
    // Final fallback to empty array
    setRegistrations([]);
  };

  const exportAllToExcel = () => {
    if (registrations.length === 0) {
      alert('No registrations found to export.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(registrations);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All KHPL Registrations');
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email  
      { wch: 15 }, // Phone
      { wch: 15 }, // Aadhaar
      { wch: 15 }, // Player Type
      { wch: 12 }, // Jersey Size
      { wch: 20 }, // Registration Date
      { wch: 15 }  // Image Name
    ];
    ws['!cols'] = colWidths;
    
    const fileName = `All_KHPL_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all registration data from both GitHub and local storage? This action cannot be undone.')) {
      try {
        // Clear GitHub data by saving empty array
        // Try to clear GitHub storage
        try {
          const { saveToGitHub } = await import('../utils/githubStorage');
          await saveToGitHub('registrations.json', []);
          console.log('GitHub storage cleared successfully');
        } catch (error) {
          console.warn('Failed to clear GitHub storage:', error.message);
        }
      } catch (error) {
        console.error('Failed to clear GitHub data:', error);
      }
      
      // Clear localStorage
      localStorage.removeItem('khplRegistrations');
      setRegistrations([]);
    }
  };

  const viewAttachments = (registration) => {
    setSelectedUser(registration);
    setShowAttachmentsModal(true);
  };

  const closeAttachmentsModal = () => {
    setShowAttachmentsModal(false);
    setSelectedUser(null);
  };

  // Get current admin user info
  const adminUser = JSON.parse(sessionStorage.getItem('khplAdminUser') || '{}');

  const updatePaymentStatus = async (registrationId, newStatus) => {
    try {
      const updatedRegistrations = registrations.map(reg => 
        reg.id === registrationId 
          ? { ...reg, paymentStatus: newStatus, status: newStatus === 'SUCCESS' ? 'Active' : 'Payment Failed' }
          : reg
      );
      
      setRegistrations(updatedRegistrations);
      
      // Try to save to GitHub
      try {
        const { saveToGitHub } = await import('../utils/githubStorage');
        await saveToGitHub('registrations.json', updatedRegistrations);
        console.log('Payment status updated in GitHub successfully');
      } catch (error) {
        console.warn('Failed to update GitHub storage:', error.message);
      }
      
      // Update localStorage as backup
      localStorage.setItem('khplRegistrations', JSON.stringify(updatedRegistrations));
      
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const deleteRegistration = async (registrationId, userName) => {
    if (window.confirm(`Are you sure you want to delete registration for ${userName}? This action cannot be undone.`)) {
      try {
        const updatedRegistrations = registrations.filter(reg => reg.id !== registrationId);
        
        // Re-index the remaining registrations
        const reIndexedRegistrations = updatedRegistrations.map((reg, index) => ({
          ...reg,
          id: index + 1
        }));
        
        setRegistrations(reIndexedRegistrations);
        
        // Try to save to GitHub
        try {
          const { saveToGitHub } = await import('../utils/githubStorage');
          await saveToGitHub('registrations.json', reIndexedRegistrations);
          console.log('Registration deleted from GitHub successfully');
        } catch (error) {
          console.warn('Failed to update GitHub storage after deletion:', error.message);
        }
        
        // Update localStorage as backup
        localStorage.setItem('khplRegistrations', JSON.stringify(reIndexedRegistrations));
        
      } catch (error) {
        console.error('Failed to delete registration:', error);
        alert('Failed to delete registration. Please try again.');
      }
    }
  };

  return (
    <>
    <Modal show={show} onHide={handleClose} size="xl" centered fullscreen>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          <i className="fas fa-users me-2"></i>
          KHPL Admin Panel
        </Modal.Title>
        <div className="ms-auto text-end">
          <small className="d-block">Logged in as: {adminUser.username}</small>
          <small className="text-warning">{adminUser.role}</small>
        </div>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <Tabs defaultActiveKey="registrations" id="admin-panel-tabs" className="mb-0">
          <Tab eventKey="registrations" title={<><i className="fas fa-table me-1"></i>Registration Data</>}>
            <div className="p-3">
        <div className="d-flex justify-content-between mb-3">
          <div>
            <Badge bg="primary" className="me-2">
              Total Registrations: {registrations.length}
            </Badge>
            <Badge bg="info" className="me-2">
              Last Updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
            <Badge bg="success" className="me-2">
              Active: {registrations.filter(r => r.status === 'Active').length}
            </Badge>
            <Badge bg="warning" className="me-2">
              Pending: {registrations.filter(r => r.paymentStatus === 'PENDING').length}
            </Badge>
          </div>
          <div>
            <Button 
              variant="info" 
              size="sm" 
              className="me-2"
              onClick={() => {loadRegistrations(); setLastUpdated(new Date());}}
            >
              <i className="fas fa-sync me-1"></i>
              Refresh
            </Button>
            <Button 
              variant="success" 
              size="sm" 
              className="me-2"
              onClick={exportAllToExcel}
              disabled={registrations.length === 0}
            >
              <i className="fas fa-download me-1"></i>
              Export to Excel
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={clearAllData}
              disabled={registrations.length === 0}
            >
              <i className="fas fa-trash me-1"></i>
              Clear All Data
            </Button>
          </div>
        </div>
        
        <div className="alert alert-info mb-3">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Admin Actions:</strong> Use the action buttons to update payment status or delete registrations. 
          Changes are automatically saved to GitHub and localStorage.
          <Button 
            variant="outline-info" 
            size="sm" 
            className="ms-3"
            onClick={async () => {
              try {
                const result = await verifyS3Access();
                if (result.success) {
                  alert(`✅ AWS S3 Connected: ${result.bucket} (Region: ${result.region})`);
                } else {
                  alert(`❌ S3 Error: ${result.reason}${result.code ? ` (${result.code})` : ''}`);
                }
              } catch (error) {
                alert(`❌ Test Failed: ${error.message}`);
              }
            }}
          >
            <i className="fab fa-aws me-1"></i>
            Test S3
          </Button>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No registrations found</h5>
            <p className="text-muted">Registration data will appear here once users start registering.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Aadhaar</th>
                  <th>Player Type</th>
                  <th>Jersey Size</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, index) => (
                  <tr key={index}>
                    <td><Badge bg="primary">{reg.id || index + 1}</Badge></td>
                    <td>{reg.name}</td>
                    <td>{reg.email}</td>
                    <td>{reg.phoneNumber}</td>
                    <td>
                      <span className="font-monospace small">{reg.aadhaarNumber || 'N/A'}</span>
                    </td>
                    <td>
                      <Badge bg="secondary">{reg.playerType || 'N/A'}</Badge>
                    </td>
                    <td>
                      <Badge bg="outline-dark">{reg.jerseySize || 'N/A'}</Badge>
                    </td>
                    <td>
                      <Badge bg="info">₹{reg.amount || 500}</Badge>
                    </td>
                    <td>
                      <Badge bg={reg.paymentStatus === 'SUCCESS' ? 'success' : reg.paymentStatus === 'FAILED' ? 'danger' : 'warning'}>
                        {reg.paymentStatus || 'PENDING'}
                      </Badge>
                    </td>
                    <td>
                      <small>{reg.registrationDate}</small>
                    </td>
                    <td>
                      <Badge bg={reg.status === 'Active' ? 'success' : reg.status === 'Payment Failed' ? 'danger' : 'warning'}>
                        {reg.status || 'Pending'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {/* Payment Status Update Buttons */}
                        {reg.paymentStatus !== 'SUCCESS' && (
                          <Button 
                            size="sm" 
                            variant="success" 
                            onClick={() => updatePaymentStatus(reg.id, 'SUCCESS')}
                          >
                            Mark Paid
                          </Button>
                        )}
                        
                        {reg.paymentStatus !== 'FAILED' && (
                          <Button 
                            size="sm" 
                            variant="warning" 
                            onClick={() => updatePaymentStatus(reg.id, 'FAILED')}
                          >
                            Mark Failed
                          </Button>
                        )}
                        
                        {reg.paymentStatus !== 'PENDING' && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => updatePaymentStatus(reg.id, 'PENDING')}
                          >
                            Mark Pending
                          </Button>
                        )}
                        
                        {/* View Attachments Button */}
                        {(reg.userPhoto || reg.paymentScreenshot) && (
                          <Button 
                            size="sm" 
                            variant="info" 
                            onClick={() => viewAttachments(reg)}
                          >
                            View Attachments
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => deleteRegistration(reg.id, reg.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
            </div>
          </Tab>
          
          <Tab eventKey="livesheet" title={<><i className="fas fa-chart-line me-1"></i>Live Registration Sheet</>}>
            <div style={{height: '70vh', overflow: 'auto'}}>
              <RegistrationSheet />
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>

    {/* Attachments Modal */}
    <Modal 
      show={showAttachmentsModal} 
      onHide={closeAttachmentsModal} 
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-paperclip me-2"></i>
          Attachments - {selectedUser?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedUser && (
          <Row>
            {selectedUser.userPhoto && (
              <Col md={6} className="mb-4">
                <div className="text-center">
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-user-circle me-2 text-primary"></i>
                    User Photo
                  </h6>
                  <div className="border rounded p-3 bg-light">
                    <Image 
                      src={selectedUser.userPhoto} 
                      alt="User Photo" 
                      fluid 
                      rounded
                      className="shadow-sm"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="text-muted mt-2" style={{ display: 'none' }}>
                      <i className="fas fa-image fs-1"></i>
                      <div>Image not available</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open(selectedUser.userPhoto, '_blank')}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    Open in New Tab
                  </Button>
                </div>
              </Col>
            )}
            
            {selectedUser.paymentScreenshot && (
              <Col md={6} className="mb-4">
                <div className="text-center">
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-receipt me-2 text-success"></i>
                    Payment Screenshot
                  </h6>
                  <div className="border rounded p-3 bg-light">
                    <Image 
                      src={selectedUser.paymentScreenshot} 
                      alt="Payment Screenshot" 
                      fluid 
                      rounded
                      className="shadow-sm"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="text-muted mt-2" style={{ display: 'none' }}>
                      <i className="fas fa-image fs-1"></i>
                      <div>Image not available</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline-success" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open(selectedUser.paymentScreenshot, '_blank')}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    Open in New Tab
                  </Button>
                </div>
              </Col>
            )}
            
            {!selectedUser.userPhoto && !selectedUser.paymentScreenshot && (
              <Col xs={12}>
                <div className="text-center text-muted py-5">
                  <i className="fas fa-inbox fs-1 mb-3"></i>
                  <h5>No Attachments Found</h5>
                  <p>This registration doesn't have any uploaded images.</p>
                </div>
              </Col>
            )}
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100 d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            <i className="fas fa-info-circle me-1"></i>
            Registration ID: #{selectedUser?.id} | {selectedUser?.email}
          </div>
          <Button variant="secondary" onClick={closeAttachmentsModal}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default AdminPanel;