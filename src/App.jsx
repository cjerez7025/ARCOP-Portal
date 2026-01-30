import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Componente inline para Home
const Home = () => (
  <div style={{ padding: '50px', background: 'lightgreen', minHeight: '100vh' }}>
    <h1>🏠 HOME - Ruta: /</h1>
  </div>
);

// Componente inline para Test
const Test = () => (
  <div style={{ padding: '50px', background: 'yellow', minHeight: '100vh' }}>
    <h1>🧪 TEST - Ruta: /test</h1>
  </div>
);

// Componente inline para Validar
const Validar = () => {
  const hash = window.location.hash;
  return (
    <div style={{ padding: '50px', background: 'lightblue', minHeight: '100vh' }}>
      <h1>✅ VALIDAR - Ruta: /validar/:token</h1>
      <p>Hash completo: {hash}</p>
    </div>
  );
};

function App() {
  console.log('🔥 App renderizado');
  console.log('📍 Location:', window.location.href);
  console.log('# Hash:', window.location.hash);
  
  return (
    <Router>
      <div>
        <h1 style={{ background: 'black', color: 'white', padding: '10px' }}>
          Portal ARCOP - Router Test
        </h1>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<Test />} />
          <Route path="/validar/:token" element={<Validar />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;