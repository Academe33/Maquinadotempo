import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { CharacterProvider } from './contexts/CharacterContext';
import AdminPanel from './components/AdminPanel';
import Home from './components/Home';

const AdminRoute = () => {
  const navigate = useNavigate();
  return <AdminPanel onClose={() => navigate('/')} />;
};

const App: React.FC = () => {
  return (
    <CharacterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminRoute />} />
        </Routes>
      </BrowserRouter>
    </CharacterProvider>
  );
};

export default App;
