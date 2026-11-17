import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext'; // <-- IMPORT INI
import './index.css';
import TokoSubur from './AppSubur';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {/* Bungkus TokoSubur dengan AuthProvider */}
    <AuthProvider>
      <TokoSubur />
    </AuthProvider>
  </BrowserRouter>,
);