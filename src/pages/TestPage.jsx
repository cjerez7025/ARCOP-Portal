import React from 'react';

const TestPage = () => {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      background: 'yellow',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '48px', color: 'red' }}>
        🎉 ¡FUNCIONA! 🎉
      </h1>
      <p style={{ fontSize: '24px' }}>
        Si ves esto, React Router está funcionando correctamente.
      </p>
    </div>
  );
};

export default TestPage;