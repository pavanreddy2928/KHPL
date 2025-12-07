import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Registration from './components/Registration';
import SocialMedia from './components/SocialMedia';
import Footer from './components/Footer';
import ContactUs from './components/ContactUs';
import RegistrationStatus from './components/RegistrationStatus';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentPage(hash);
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial page based on current hash
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch(currentPage) {
      case 'contact':
        return <ContactUs />;
      case 'status':
        return <RegistrationStatus />;
      case 'home':
      case 'registration':
      case 'about':
      default:
        return (
          <>
            <Hero />
            <Registration />
            <SocialMedia />
          </>
        );
    }
  };

  return (
    <div className="App">
      <Header />
      {renderPage()}
      <Footer />
    </div>
  );
}

export default App;