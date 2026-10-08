import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {UserProvider} from './user-context';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    
      <App />
    
  </UserProvider>
);


