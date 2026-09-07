import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import HousePage from './HousePage';
import './house.css';
import './photoStyles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><HousePage /></StrictMode>);
