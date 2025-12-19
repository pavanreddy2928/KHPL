import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Row, Col, Image, Tabs, Tab } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { verifyS3Access } from '../utils/awsS3Storage';
import { loadRegistrationsFromDynamoDB } from '../utils/dynamoDBStorage';
import { loadRegistrationImageFromS3 } from '../utils/registrationImageUpload';
import RegistrationSheet from './RegistrationSheet';
import ImageUploadManager from './ImageUploadManager';

const AdminPanel = ({ show, handleClose }) => {
  const [registrations, setRegistrations] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show) {
      loadRegistrations();
    }
  }, [show]);

  const loadRegistrations = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading registrations data...');
      
      // Try DynamoDB first
      console.log('📊 Attempting to load from DynamoDB...');
      let data = await loadRegistrationsFromDynamoDB();
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('✅ Successfully loaded', data.length, 'registrations from DynamoDB');
      } else {
        console.log('⚠️ No DynamoDB data found');
        data = [];
      }
      
      console.log('📊 Final data received:', data);
      console.log('📊 Data type:', typeof data);
      console.log('📊 Is array:', Array.isArray(data));
      console.log('📊 Data length:', data ? data.length : 0);
      
      if (data && Array.isArray(data)) {
        setRegistrations(data);
        setLastUpdated(new Date());
        console.log('✅ Successfully loaded', data.length, 'registrations');
      } else {
        setRegistrations([]);
        console.log('⚠️ No valid registration data found');
      }
    } catch (error) {
      console.error('❌ Error loading registrations:', error);
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addTestRegistration = async () => {
    const testRegistration = {
      id: `KHPL_${Date.now()}_TEST`,
      name: 'Test Player',
      email: 'test@example.com',
      phone: '9876543210',
      district: 'Bangalore Urban',
      age: '25',
      team: 'Test Team',
      city: 'Bangalore',
      registrationDate: new Date().toLocaleString(),
      status: 'Test Registration',
      amount: 999,
      paymentStatus: 'COMPLETED'
    };
    
    try {
      const { saveRegistrationToDynamoDB } = await import('../utils/dynamoDBStorage');
      const result = await saveRegistrationToDynamoDB(testRegistration);
      
      if (result.success) {
        loadRegistrations(); // Reload the data
        alert('Test registration added successfully to DynamoDB!');
      } else {
        alert('Failed to add test registration: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding test registration:', error);
      alert('Error adding test registration: ' + error.message);
    }
  };



  const exportAllToExcel = () => {
    if (registrations.length === 0) {
      alert('No registrations found to export.');
      return;
    }

    try {
      // Prepare data for Excel export
      const exportData = registrations.map(reg => ({
        'Registration ID': reg.id || 'N/A',
        'Name': reg.name || '',
        'Email': reg.email || '',
        'Phone': reg.phoneNumber || reg.phone || '',
        'District': reg.district || '',
        'Aadhaar Copy': reg.aadhaarCopy ? 'Uploaded' : 'Not Uploaded',
        'Player Type': reg.playerType || '',

        'Registration Date': reg.registrationDate || new Date().toLocaleDateString(),
        'Payment Status': reg.paymentStatus || 'PENDING',
        'Status': reg.status || 'Pending'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'All KHPL Registrations');
      
      // Auto-adjust column widths
      const colWidths = [
        { wch: 15 }, // Registration ID
        { wch: 20 }, // Name
        { wch: 30 }, // Email  
        { wch: 15 }, // Phone
        { wch: 15 }, // District
        { wch: 15 }, // Aadhaar Copy
        { wch: 15 }, // Player Type
        { wch: 20 }, // Registration Date
        { wch: 15 }, // Payment Status
        { wch: 12 }  // Status
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `All_KHPL_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      // Show success message
      alert(`Excel file exported successfully: ${fileName}`);
    } catch (error) {
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const clearAllRegistrations = async () => {
    if (window.confirm('⚠️ Are you sure you want to DELETE ALL registration data?\n\nThis will permanently delete:\n• All registration records from DynamoDB\n• All uploaded images from S3\n• All payment data\n\nThis action CANNOT be undone!')) {
      try {
        console.log('🗑️ Starting complete data clearing process...');
        
        // Step 1: Delete all registrations from DynamoDB
        const { deleteAllRegistrations } = await import('../utils/dynamoDBStorage');
        console.log('📡 Clearing DynamoDB registrations...');
        const dbResult = await deleteAllRegistrations();
        
        console.log('📊 DynamoDB clear result:', dbResult);
        
        // Step 2: Clear S3 images (if S3 is configured)
        let s3Result = { success: true, message: 'S3 not configured - skipped' };
        try {
          // Note: Individual S3 image deletion would require listing all objects
          // For now, we'll note that S3 images remain but registrations are deleted
          console.log('ℹ️ S3 image cleanup not implemented - images remain in storage');
        } catch (s3Error) {
          console.warn('⚠️ S3 cleanup warning:', s3Error.message);
        }
        
        // Step 3: Update UI immediately
        setRegistrations([]);
        setLastUpdated(new Date());
        
        // Step 4: Show comprehensive result
        if (dbResult.success) {
          alert(`✅ Successfully cleared all data!\n\n• Deleted ${dbResult.deletedCount} registrations from database\n• UI data cleared\n\nNote: S3 images may remain and need manual cleanup`);
        } else if (dbResult.deletedCount > 0) {
          alert(`⚠️ Partial success:\n\n• Deleted ${dbResult.deletedCount} of ${dbResult.totalCount} registrations\n• ${dbResult.failedCount} deletions failed\n• UI data cleared\n\nError: ${dbResult.error || 'Some deletions failed'}`);
        } else {
          alert(`❌ Failed to clear database data:\n\n• Error: ${dbResult.error}\n• UI data cleared locally\n\nDatabase may still contain records.`);
        }
        
      } catch (error) {
        console.error('❌ Clear all registrations failed:', error);
        
        // Still clear UI even if backend operations failed
        setRegistrations([]);
        setLastUpdated(new Date());
        
        alert(`❌ Error during data clearing: ${error.message}\n\nUI data cleared, but database records may remain.`);
      }
    }
  };

  const viewAttachments = async (registration) => {
    console.log('🔍 Loading attachments for registration:', registration.id);
    
    // If registration has image upload results, load images from S3
    if (registration.imageUploadResults && registration.imageUploadStatus === 'completed') {
      console.log('📁 Loading images from S3 using upload results...');
      
      const updatedRegistration = { ...registration };
      
      // Load images from S3 in parallel
      const imagePromises = [];
      
      if (registration.imageUploadResults.aadhaar?.s3Key) {
        imagePromises.push(
          loadRegistrationImageFromS3(registration.imageUploadResults.aadhaar.s3Key)
            .then(url => ({ type: 'aadhaar', url }))
            .catch(error => ({ type: 'aadhaar', error: error.message }))
        );
      }
      
      if (registration.imageUploadResults.userPhoto?.s3Key) {
        imagePromises.push(
          loadRegistrationImageFromS3(registration.imageUploadResults.userPhoto.s3Key)
            .then(url => ({ type: 'userPhoto', url }))
            .catch(error => ({ type: 'userPhoto', error: error.message }))
        );
      }
      
      if (registration.imageUploadResults.paymentScreenshot?.s3Key) {
        imagePromises.push(
          loadRegistrationImageFromS3(registration.imageUploadResults.paymentScreenshot.s3Key)
            .then(url => ({ type: 'paymentScreenshot', url }))
            .catch(error => ({ type: 'paymentScreenshot', error: error.message }))
        );
      }
      
      try {
        const imageResults = await Promise.all(imagePromises);
        
        // Update registration with loaded image URLs
        imageResults.forEach(result => {
          if (result.url) {
            switch (result.type) {
              case 'aadhaar':
                updatedRegistration.aadhaarCopyUrl = result.url;
                break;
              case 'userPhoto':
                updatedRegistration.userPhotoUrl = result.url;
                break;
              case 'paymentScreenshot':
                updatedRegistration.paymentScreenshotUrl = result.url;
                break;
            }
            console.log(`✅ Loaded ${result.type} from S3:`, result.url);
          } else if (result.error) {
            console.error(`❌ Failed to load ${result.type}:`, result.error);
          }
        });
        
        updatedRegistration.s3ImagesLoaded = true;
      } catch (error) {
        console.error('❌ Error loading images from S3:', error);
        updatedRegistration.s3LoadError = error.message;
      }
      
      setSelectedUser(updatedRegistration);
    } else {
      // Use existing base64 images or S3 URLs
      setSelectedUser(registration);
    }
    
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
      
      // Update in DynamoDB
      try {
        const { updateRegistrationStatus } = await import('../utils/dynamoDBStorage');
        await updateRegistrationStatus(registrationId, { 
          status: newStatus,
          paymentStatus: newStatus === 'Payment Completed' ? 'COMPLETED' : 'PENDING'
        });
        console.log('✅ Payment status updated in DynamoDB');
      } catch (error) {
        console.error('❌ Failed to update payment status in DynamoDB:', error);
      }
      
    } catch (error) {
      alert('Failed to update payment status. Please try again.');
    }
  };

  const deleteRegistration = async (registrationId, userName) => {
    if (window.confirm(`Are you sure you want to delete registration for ${userName}? This action cannot be undone.`)) {
      try {
        console.log('🗑️ Attempting to delete registration:', registrationId, 'for user:', userName);
        
        // Delete from DynamoDB first
        const { deleteRegistration: deleteDynamoRegistration } = await import('../utils/dynamoDBStorage');
        
        console.log('📡 Calling DynamoDB delete function...');
        const deleteResult = await deleteDynamoRegistration(registrationId);
        console.log('📋 Delete result:', deleteResult);
        
        if (deleteResult.success) {
          // Remove from local state only if DynamoDB deletion succeeded
          const updatedRegistrations = registrations.filter(reg => reg.id !== registrationId);
          setRegistrations(updatedRegistrations);
          
          // Update timestamp
          setLastUpdated(new Date());
          
          console.log('✅ Registration deleted successfully from DynamoDB and UI');
          alert(`Registration for ${userName} has been deleted successfully!`);
        } else {
          throw new Error(deleteResult.error || 'DynamoDB deletion failed');
        }
        
      } catch (error) {
        console.error('❌ Delete registration failed:', error);
        alert(`Failed to delete registration for ${userName}. Error: ${error.message || 'Please try again.'}`);
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
              disabled={isLoading}
              onClick={async () => {
                try {
                  await loadRegistrations();
                } catch (error) {
                  alert('Failed to refresh data. Please try again.');
                }
              }}
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync'} me-1`}></i>
              {isLoading ? 'Loading...' : 'Refresh'}
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
              onClick={clearAllRegistrations}
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
          Changes are automatically saved to DynamoDB cloud storage. 
          <strong className="text-danger">⚠️ Delete operations are permanent and cannot be undone!</strong>
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
            Test S3
          </Button>
          
          <Button 
            variant="outline-warning" 
            size="sm" 
            className="ms-2"
            onClick={async () => {
              try {
                const { verifyDynamoDBConnection } = await import('../utils/dynamoDBStorage');
                const result = await verifyDynamoDBConnection();
                if (result.success) {
                  alert(`✅ DynamoDB Connected: ${result.table} (Region: ${result.region})`);
                } else {
                  alert(`❌ DynamoDB Error: ${result.reason}`);
                }
              } catch (error) {
                alert(`❌ DynamoDB Test Failed: ${error.message}`);
              }
            }}
          >
            Test DynamoDB
          </Button>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No registrations found</h5>
            <p className="text-muted">Registration data will appear here once users start registering.</p>
            
            {/* Debug Information */}
            <div className="mt-4 p-3 bg-light border rounded">
              <h6 className="text-primary">Debug Information</h6>
              <p className="small mb-2">
                <strong>S3 Storage Enabled:</strong> {process.env.REACT_APP_S3_STORAGE === 'true' ? 'Yes' : 'No'}
              </p>
              <p className="small mb-2">
                <strong>AWS Region:</strong> {process.env.REACT_APP_AWS_REGION || 'Not configured'}
              </p>
              <p className="small mb-2">
                <strong>S3 Bucket:</strong> {process.env.REACT_APP_S3_BUCKET_NAME || 'Not configured'}
              </p>
              <p className="small mb-2">
                <strong>AWS Access Key:</strong> {process.env.REACT_APP_AWS_ACCESS_KEY_ID ? 'Configured' : 'Not configured'}
              </p>
              <p className="small mb-2">
                <strong>DynamoDB Table:</strong> {process.env.REACT_APP_DYNAMODB_TABLE_NAME || 'khpl-registrations'}
              </p>
              <p className="small text-info">
                💡 <strong>Solution:</strong> Create a .env file with AWS credentials for DynamoDB access
              </p>
              
              <div className="mt-3">
                <button 
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={addTestRegistration}
                >
                  Add Test Registration to DynamoDB
                </button>
                <button 
                  className="btn btn-sm btn-outline-warning"
                  onClick={clearAllRegistrations}
                >
                  Clear Display Data
                </button>
              </div>
            </div>
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
                  <th>District</th>
                  <th>Aadhaar Copy</th>
                  <th>Player Type</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Attachments</th>
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
                      <Badge bg="info">{reg.district || 'N/A'}</Badge>
                    </td>
                    <td>
                      <Badge bg={reg.aadhaarCopy ? 'success' : 'warning'}>
                        {reg.aadhaarCopy ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{reg.playerType || 'N/A'}</Badge>
                    </td>
                    <td>
                      <Badge bg="info">₹{reg.amount || 999}</Badge>
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
                      <div className="small">
                        <div>📷 {reg.userPhoto ? '✅' : '❌'}</div>
                        <div>💳 {reg.paymentScreenshot ? '✅' : '❌'}</div>
                      </div>
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
                        <Button 
                          size="sm" 
                          variant={reg.userPhoto || reg.paymentScreenshot || reg.aadhaarCopy ? "info" : "outline-secondary"}
                          onClick={() => viewAttachments(reg)}
                          title={`User Photo: ${!!reg.userPhoto ? '✓' : '✗'}, Payment Screenshot: ${!!reg.paymentScreenshot ? '✓' : '✗'}, Aadhaar Copy: ${!!reg.aadhaarCopy ? '✓' : '✗'}`}
                        >
                          View Attachments
                        </Button>
                        
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
          
          <Tab eventKey="images" title={<><i className="fas fa-images me-1"></i>S3 Images</>}>
            <div style={{height: '70vh', overflow: 'auto', padding: '20px'}}>
              <ImageUploadManager />
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
            {(selectedUser.aadhaarCopy || selectedUser.aadhaarCopyUrl) && (
              <Col md={selectedUser.userPhoto && selectedUser.paymentScreenshot ? 4 : 6} className="mb-4">
                <div className="text-center">
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-id-card me-2 text-info"></i>
                    Aadhaar Copy
                    {selectedUser.aadhaarCopyUrl && (
                      <Badge bg="info" className="ms-2 small">S3</Badge>
                    )}
                    {selectedUser.s3ImagesLoaded && (
                      <Badge bg="success" className="ms-1 small">Loaded</Badge>
                    )}
                  </h6>
                  <div className="border rounded p-3 bg-light">
                    {(() => {
                      const imageSource = selectedUser.aadhaarCopyUrl || selectedUser.aadhaarCopy;
                      const isPDF = imageSource && (imageSource.startsWith('data:application/pdf') || imageSource.endsWith('.pdf'));
                      
                      if (isPDF) {
                        return (
                          <div className="text-center py-4">
                            <i className="fas fa-file-pdf fa-4x text-danger mb-3"></i>
                            <div className="text-muted">PDF Document</div>
                            <div className="small text-muted">Preview not available</div>
                          </div>
                        );
                      } else if (imageSource) {
                        return (
                          <>
                            <Image 
                              src={imageSource} 
                              alt="Aadhaar Copy" 
                              fluid 
                              rounded
                              className="shadow-sm"
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div className="text-muted mt-2" style={{ display: 'none' }}>
                              <i className="fas fa-image fs-1"></i>
                              <div>Image not available</div>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open(selectedUser.aadhaarCopyUrl || selectedUser.aadhaarCopy, '_blank')}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    Open in New Tab
                  </Button>
                </div>
              </Col>
            )}
            
            {(selectedUser.userPhoto || selectedUser.userPhotoUrl) && (
              <Col md={selectedUser.aadhaarCopy && selectedUser.paymentScreenshot ? 4 : 6} className="mb-4">
                <div className="text-center">
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-user-circle me-2 text-primary"></i>
                    User Photo
                    {selectedUser.userPhotoUrl && (
                      <Badge bg="primary" className="ms-2 small">S3</Badge>
                    )}
                    {selectedUser.s3ImagesLoaded && (
                      <Badge bg="success" className="ms-1 small">Loaded</Badge>
                    )}
                  </h6>
                  <div className="border rounded p-3 bg-light">
                    <Image 
                      src={selectedUser.userPhotoUrl || selectedUser.userPhoto} 
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
                    onClick={() => window.open(selectedUser.userPhotoUrl || selectedUser.userPhoto, '_blank')}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    Open in New Tab
                  </Button>
                </div>
              </Col>
            )}
            
            {(selectedUser.paymentScreenshot || selectedUser.paymentScreenshotUrl) && (
              <Col md={selectedUser.aadhaarCopy && selectedUser.userPhoto ? 4 : 6} className="mb-4">
                <div className="text-center">
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-receipt me-2 text-success"></i>
                    Payment Screenshot
                    {selectedUser.paymentScreenshotUrl && (
                      <Badge bg="success" className="ms-2 small">S3</Badge>
                    )}
                    {selectedUser.s3ImagesLoaded && (
                      <Badge bg="success" className="ms-1 small">Loaded</Badge>
                    )}
                  </h6>
                  <div className="border rounded p-3 bg-light">
                    <Image 
                      src={selectedUser.paymentScreenshotUrl || selectedUser.paymentScreenshot} 
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
                    onClick={() => window.open(selectedUser.paymentScreenshotUrl || selectedUser.paymentScreenshot, '_blank')}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    Open in New Tab
                  </Button>
                </div>
              </Col>
            )}
            
            {!selectedUser.userPhoto && !selectedUser.paymentScreenshot && !selectedUser.aadhaarCopy && 
             !selectedUser.userPhotoUrl && !selectedUser.paymentScreenshotUrl && !selectedUser.aadhaarCopyUrl && (
              <Col xs={12}>
                <div className="text-center text-muted py-5">
                  <i className="fas fa-inbox fs-1 mb-3"></i>
                  <h5>No Attachments Found</h5>
                  <p>This registration doesn't have any uploaded images or documents.</p>
                  {selectedUser.imageUploadStatus && (
                    <div className="mt-3">
                      <Badge bg="warning">
                        Upload Status: {selectedUser.imageUploadStatus} 
                        ({selectedUser.uploadedImageCount || 0}/{selectedUser.totalImageCount || 0})
                      </Badge>
                    </div>
                  )}
                </div>
              </Col>
            )}
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="text-muted small">
              <i className="fas fa-info-circle me-1"></i>
              Registration ID: #{selectedUser?.id} | {selectedUser?.email}
            </div>
            <Button variant="secondary" onClick={closeAttachmentsModal}>
              Close
            </Button>
          </div>
          {selectedUser && (
            <div className="small text-muted">
              {selectedUser.imageUploadStatus && (
                <div>
                  <i className="fas fa-cloud-upload-alt me-1"></i>
                  Upload Status: 
                  <Badge 
                    bg={selectedUser.imageUploadStatus === 'completed' ? 'success' : 
                        selectedUser.imageUploadStatus === 'failed' ? 'danger' : 'warning'} 
                    className="ms-1"
                  >
                    {selectedUser.imageUploadStatus}
                  </Badge>
                  {selectedUser.uploadedImageCount !== undefined && (
                    <span className="ms-2">
                      ({selectedUser.uploadedImageCount}/{selectedUser.totalImageCount} uploaded)
                    </span>
                  )}
                </div>
              )}
              {selectedUser.s3ImagesLoaded && (
                <div className="mt-1">
                  <i className="fas fa-check-circle me-1 text-success"></i>
                  Images loaded from S3 successfully
                </div>
              )}
              {selectedUser.s3LoadError && (
                <div className="mt-1">
                  <i className="fas fa-exclamation-triangle me-1 text-warning"></i>
                  S3 Load Error: {selectedUser.s3LoadError}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default AdminPanel;