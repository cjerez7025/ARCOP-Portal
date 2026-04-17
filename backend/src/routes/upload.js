// ============================================================
// backend/src/routes/upload.js
// Endpoint para subir archivos de documentación de respaldo
// a Firebase Storage (bucket del proyecto aligndata-arcop)
//
// POST /api/upload
//   - multipart/form-data
//   - campo 'archivo' (máx 3 archivos)
//   - campo 'solicitudId' (string, requerido)
//
// Responde con array de { nombre, url, tipo, tamaño }
// ============================================================
'use strict';

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const { bucket, db } = require('../services/firebase');

const router = express.Router();

// ── Configuración de multer ───────────────────────────────
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE_MB   = 5;
const MAX_FILES     = 3;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files:    MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

// ── POST /api/upload ──────────────────────────────────────
router.post('/', upload.array('archivos', MAX_FILES), async (req, res) => {
  try {
    const { solicitudId } = req.body;

    if (!solicitudId) {
      return res.status(400).json({
        status: 'error',
        error:  'solicitudId es requerido',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        error:  'No se recibieron archivos',
      });
    }

    const resultados = [];

    for (const file of req.files) {
      // Nombre seguro: solicitudId/uuid-originalname
      const ext      = path.extname(file.originalname);
      const safeName = `${uuidv4()}${ext}`;
      const filePath = `documentacion/${solicitudId}/${safeName}`;

      const blob = bucket.file(filePath);

      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName:  file.originalname,
            solicitudId:   solicitudId,
            uploadedAt:    new Date().toISOString(),
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
        resumable: false,
      });

      // este link va a google chat, la idea es que el encargado lo tenga simpre disponible 
      // Hacer archivo público y generar URL permanente
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      resultados.push({
        nombre:   file.originalname,
        path:     filePath,
        url:      publicUrl,
        tipo:     file.mimetype,
        tamaño:   file.size,
      });
    }

    // Guardar referencias en la solicitud de Firestore
    if (resultados.length > 0) {
      try {
        const solRef = db.collection('solicitudes').doc(solicitudId);
        const solSnap = await solRef.get();
        if (solSnap.exists) {
          const existentes = solSnap.data().documentacion_archivos || [];
          await solRef.update({
            documentacion_archivos: [...existentes, ...resultados],
          });
        }
      } catch (dbErr) {
        console.error('[upload] Error guardando refs en Firestore:', dbErr.message);
      }
    }

    return res.json({
      status: 'success',
      data:   resultados,
    });

  } catch (error) {
    console.error('[upload] Error:', error.message);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'error',
        error:  `El archivo supera el límite de ${MAX_SIZE_MB} MB`,
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        error:  `Máximo ${MAX_FILES} archivos permitidos`,
      });
    }

    return res.status(500).json({
      status: 'error',
      error:  error.message || 'Error al subir archivo',
    });
  }
});

module.exports = router;