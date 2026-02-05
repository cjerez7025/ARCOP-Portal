import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar sticky en top */}
      <Navbar />
      
      {/* Contenido principal - flex-grow para empujar footer abajo */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer siempre al final */}
      <Footer />
    </div>
  );
};

export default Layout;