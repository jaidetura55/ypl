
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AdminApp } from './AdminApp';
import { DataProvider } from './contexts/DataContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Detect if we are in the Admin Environment
// Supports port 6000 OR a URL parameter ?admin=true
const ADMIN_PORTS = ['6000'];
const urlParams = new URLSearchParams(window.location.search);
const isAdminEnvironment = ADMIN_PORTS.includes(window.location.port) || urlParams.get('admin') === 'true';

root.render(
  <React.StrictMode>
    <DataProvider>
      {isAdminEnvironment ? <AdminApp /> : <App />}
    </DataProvider>
  </React.StrictMode>
);
