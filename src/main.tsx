import React from 'react';
import ReactDOM from 'react-dom/client';
import { PantallaTorreControl } from './torre';

const contenedor = document.getElementById('root');
if (contenedor) {
  const raiz = ReactDOM.createRoot(contenedor);
  raiz.render(
    <React.StrictMode>
      <PantallaTorreControl />
    </React.StrictMode>
  );
}
