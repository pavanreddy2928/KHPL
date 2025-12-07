// Admin Image Upload Utility for KHPL
// Helps upload essential images (logo, QR code) to S3

import React, { useState } from 'react';
import { Card, Form, Alert, ProgressBar } from 'react-bootstrap';
import { uploadImageToS3 } from '../utils/s3ImageLoader';

const ImageUploadManager = () => {
  const [uploadStatus, setUploadStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const essentialImages = [
    { name: 'khpl.jpeg', description: 'KHPL Logo', required: true },
    { name: 'KHPL-QR-CODE.jpeg', description: 'Payment QR Code', required: true }
  ];

  const handleImageUpload = async (imageName, file) => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(prev => ({
      ...prev,
      [imageName]: { status: 'uploading', message: 'Uploading...' }
    }));

    try {
      const result = await uploadImageToS3(file, imageName);
      
      setUploadStatus(prev => ({
        ...prev,
        [imageName]: { 
          status: 'success', 
          message: `✅ Successfully uploaded to S3`,
          url: result.url
        }
      }));
    } catch (error) {
      setUploadStatus(prev => ({
        ...prev,
        [imageName]: { 
          status: 'error', 
          message: `❌ Upload failed: ${error.message}`
        }
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (imageName, e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(imageName, file);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="bg-warning text-dark">
        <h5 className="mb-0">
          <i className="fas fa-cloud-upload-alt me-2"></i>
          Upload Images to S3
        </h5>
        <small>Upload essential KHPL images to AWS S3 for better performance</small>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-3">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Instructions:</strong> Upload the essential images below to make them load from S3 instead of the public folder.
          This improves performance and ensures images are available even if deployed without static files.
        </Alert>

        {essentialImages.map((image) => (
          <div key={image.name} className="mb-3 p-3 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <strong>{image.description}</strong>
                <br />
                <code className="text-muted">{image.name}</code>
              </div>
              {image.required && (
                <span className="badge bg-warning text-dark">Required</span>
              )}
            </div>

            <Form.Group>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(image.name, e)}
                disabled={isUploading}
              />
            </Form.Group>

            {uploadStatus[image.name] && (
              <div className="mt-2">
                {uploadStatus[image.name].status === 'uploading' && (
                  <ProgressBar animated now={100} variant="primary" className="mb-2" />
                )}
                <Alert 
                  variant={
                    uploadStatus[image.name].status === 'success' ? 'success' : 
                    uploadStatus[image.name].status === 'error' ? 'danger' : 'info'
                  }
                  className="mb-0 py-2"
                >
                  {uploadStatus[image.name].message}
                  {uploadStatus[image.name].url && (
                    <div className="mt-1">
                      <small>S3 URL: <code>{uploadStatus[image.name].url}</code></small>
                    </div>
                  )}
                </Alert>
              </div>
            )}
          </div>
        ))}

        <Alert variant="success" className="mt-3">
          <i className="fas fa-lightbulb me-2"></i>
          <strong>Pro Tip:</strong> Once uploaded, the app will automatically load these images from S3 
          with fallback to the public folder if S3 is not available.
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default ImageUploadManager;