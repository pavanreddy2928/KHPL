import React from 'react';
import { Button } from 'react-bootstrap';
import { FaInstagram } from 'react-icons/fa';

const Hero = () => {
  return (
    <>
      <section 
        className="hero-section"
        style={{
          backgroundColor: '#FFD700',
          background: `linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF8C00 50%, #DAA520 75%, #B8860B 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: '60vh',
          maxHeight: '80vh',
          padding: '20px',
          margin: '0',
          overflow: 'hidden'
        }}
      >
        {/* Main background image container */}
        <div
          style={{
            backgroundImage: `url('https://khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com/images/backgroung_logo.jpeg')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            minHeight: '400px',
            maxHeight: '600px',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0'
          }}
        />
      </section>
      
      {/* Title text below the image */}
      <div 
        style={{
          textAlign: 'center',
          padding: '5px 20px',
          backgroundColor: '#FFD700'
        }}
      >
        <h1 
          style={{
            color: '#8B4513',
            fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(255, 215, 0, 0.8), 0 0 8px rgba(255, 255, 255, 0.6)',
            backgroundColor: 'rgba(255, 215, 0, 0.9)',
            padding: '10px 20px',
            borderRadius: '10px',
            border: '2px solid #8B4513',
            margin: '0 0 10px 0',
            letterSpacing: '1px',
            display: 'inline-block'
          }}
        >
          KARNATAKA BIGGEST HARD BALL PREMIER LEAGUE
        </h1>
        
        {/* Instagram link below the title */}
        <div style={{ marginTop: '15px' }}>
          <Button 
            variant="outline-light" 
            className="rounded-circle p-3"
            as="a"
            href="https://www.instagram.com/khpl_s1?igsh=MXc2cDM2NmRnZHR0dw=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.9)',
              borderColor: '#8B4513',
              color: '#8B4513',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 165, 0, 0.9)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <FaInstagram size={24} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default Hero;