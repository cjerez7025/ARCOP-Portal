import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GraficosPanel = ({ solicitudes }) => {
  
  // GRÁFICO 1: Solicitudes por mes (Línea)
  const solicitudesPorMesData = useMemo(() => {
    const meses = {};
    const hoy = new Date();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesAño = `${fecha.toLocaleString('es-CL', { month: 'short' })} ${fecha.getFullYear()}`;
      meses[mesAño] = 0;
    }
    
    // Contar solicitudes por mes
    solicitudes.forEach(sol => {
      const fecha = new Date(sol.fecha_solicitud);
      const mesAño = `${fecha.toLocaleString('es-CL', { month: 'short' })} ${fecha.getFullYear()}`;
      if (meses.hasOwnProperty(mesAño)) {
        meses[mesAño]++;
      }
    });
    
    return {
      labels: Object.keys(meses),
      datasets: [
        {
          label: 'Solicitudes',
          data: Object.values(meses),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [solicitudes]);

  // GRÁFICO 2: Por estado (Torta)
  const solicitudesPorEstadoData = useMemo(() => {
    const estados = {
      'PENDIENTE': 0,
      'VALIDADA': 0,
      'EN_PROCESO': 0,
      'RESUELTA': 0,
      'CERRADA': 0
    };
    
    solicitudes.forEach(sol => {
      if (estados.hasOwnProperty(sol.estado)) {
        estados[sol.estado]++;
      }
    });

    const colores = {
      'PENDIENTE': 'rgba(234, 179, 8, 0.8)',
      'VALIDADA': 'rgba(59, 130, 246, 0.8)',
      'EN_PROCESO': 'rgba(168, 85, 247, 0.8)',
      'RESUELTA': 'rgba(34, 197, 94, 0.8)',
      'CERRADA': 'rgba(107, 114, 128, 0.8)'
    };

    const labels = Object.keys(estados);
    const data = Object.values(estados);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: labels.map(e => colores[e]),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 10
        }
      ]
    };
  }, [solicitudes]);

  // GRÁFICO 3: Tiempo de respuesta promedio (Barras)
  const tiempoRespuestaData = useMemo(() => {
    const tiempos = {
      'PENDIENTE': [],
      'VALIDADA': [],
      'EN_PROCESO': [],
      'RESUELTA': [],
      'CERRADA': []
    };

    solicitudes.forEach(sol => {
      const inicio = new Date(sol.fecha_solicitud);
      const fin = new Date(sol.actualizado_en || sol.fecha_solicitud);
      const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
      
      if (tiempos[sol.estado]) {
        tiempos[sol.estado].push(dias);
      }
    });

    const promedios = Object.keys(tiempos).map(estado => {
      const valores = tiempos[estado];
      if (valores.length === 0) return 0;
      return parseFloat((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1));
    });

    return {
      labels: Object.keys(tiempos),
      datasets: [
        {
          label: 'Días promedio',
          data: promedios,
          backgroundColor: [
            'rgba(234, 179, 8, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(107, 114, 128, 0.7)'
          ],
          borderColor: [
            'rgb(234, 179, 8)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(34, 197, 94)',
            'rgb(107, 114, 128)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    };
  }, [solicitudes]);

  // Opciones para gráfico de línea
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 11 }
        },
        grid: {
          display: false
        }
      }
    }
  };

  // Opciones para gráfico de torta
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 }
      }
    }
  };

  // Opciones para gráfico de barras
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} días`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 },
          callback: function(value) {
            return value + ' días';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 11 }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Gráfico de Línea - Solicitudes por mes */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📈 Solicitudes por Mes
        </h3>
        <div style={{ height: '300px' }}>
          <Line data={solicitudesPorMesData} options={lineOptions} />
        </div>
      </div>

      {/* Gráfico de Torta - Distribución por estado */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🥧 Distribución por Estado
        </h3>
        <div style={{ height: '300px' }}>
          <Pie data={solicitudesPorEstadoData} options={pieOptions} />
        </div>
      </div>

      {/* Gráfico de Barras - Tiempo promedio */}
      <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ⏱️ Tiempo Promedio de Respuesta por Estado
        </h3>
        <div style={{ height: '300px' }}>
          <Bar data={tiempoRespuestaData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default GraficosPanel;