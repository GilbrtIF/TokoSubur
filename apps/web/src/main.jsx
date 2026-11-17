import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import TokoSubur from './AppSubur'; // Sesuaikan path

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <TokoSubur />
  </BrowserRouter>,
);