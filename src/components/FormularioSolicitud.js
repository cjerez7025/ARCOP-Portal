import React from 'react';

function FormularioSolicitud() {
  return (
    <div className="formulario-solicitud">
      <h2>Formulario de Solicitud</h2>
      <form>
        <div>
          <label>Nombre:</label>
          <input type="text" name="nombre" />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" />
        </div>
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default FormularioSolicitud;