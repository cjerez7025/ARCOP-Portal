// ============================================================
// src/components/OnboardingTour.jsx
// Tour guiado para titular nuevo en el portal público
// Usa driver.js — se activa una sola vez via localStorage
// ============================================================
import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = 'arcop_tour_completado';

const PASOS = [
  {
    element: '.arcop-portal-publico',
    popover: {
      title: '👋 Bienvenido al Portal ARCOP',
      description: 'Este portal te permite ejercer tus derechos de protección de datos personales conforme a la Ley 21.719 de Chile. Te guiaremos en 4 pasos.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.arcop-derechos-grid',
    popover: {
      title: '1️⃣ Elige tu derecho',
      description: 'Selecciona el derecho que deseas ejercer: Acceso, Rectificación, Cancelación, Oposición o Portabilidad.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '.arcop-portal-publico',
    popover: {
      title: '2️⃣ Completa el formulario',
      description: 'Al seleccionar un derecho, se abrirá un formulario con los datos necesarios para procesar tu solicitud.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.arcop-portal-publico',
    popover: {
      title: '3️⃣ Confirma tu identidad',
      description: 'Recibirás un email de confirmación. Haz clic en el link para validar tu identidad y activar la solicitud.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.arcop-portal-publico',
    popover: {
      title: '4️⃣ Seguimiento',
      description: 'Puedes hacer seguimiento de tu solicitud con el número de caso que recibirás por email. El plazo legal de respuesta es de 15 días hábiles.',
      side: 'bottom',
      align: 'center',
    },
  },
];

const OnboardingTour = () => {
  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return;

    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        progressText: 'Paso {{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido!',
        allowClose: true,
        overlayColor: 'rgba(2, 11, 22, 0.85)',
        popoverClass: 'arcop-tour-popover',
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY, '1');
          driverObj.destroy();
        },
        steps: PASOS,
      });
      driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default OnboardingTour;