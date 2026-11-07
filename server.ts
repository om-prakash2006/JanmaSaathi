import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './firebase-applet-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API: Health & Connected Project Metadata
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firebase: {
      projectId: config.projectId,
      firestoreDatabaseId: config.firestoreDatabaseId,
      authDomain: config.authDomain,
      storageBucket: config.storageBucket,
    },
  });
});

// API: Staff Credential Verification
app.post('/api/auth/staff-login', (req, res) => {
  const { staffId, password, role } = req.body;
  if (!staffId || !password || !role) {
    return res.status(400).json({ success: false, error: 'Missing required credentials.' });
  }

  const cleanId = String(staffId).trim().toUpperCase();

  // Role validation
  if (role === 'worker') {
    if (cleanId === 'HW-44120' && password === 'demo1234') {
      return res.json({
        success: true,
        user: {
          uid: 'staff-hw-44120',
          staffId: 'HW-44120',
          role: 'worker',
          name: 'Sunita Devi',
          designation: 'Community Health Worker',
          assignedSubCentre: 'Rampur Sub-Centre',
        },
      });
    }
  } else if (role === 'supervisor') {
    if (cleanId === 'SUP-2025-012' && password === 'demo1234') {
      return res.json({
        success: true,
        user: {
          uid: 'staff-sup-2025-012',
          staffId: 'SUP-2025-012',
          role: 'supervisor',
          name: 'Dr. Rajesh Kumar',
          designation: 'Medical Officer In-Charge (MOIC)',
          district: 'Puri',
        },
      });
    }
  }

  return res.status(401).json({ success: false, error: 'Invalid staff code or password.' });
});

// API: Mother Account Linking Verification
app.post('/api/auth/link-mother-account', (req, res) => {
  const { mcpCardNumber, dateOfBirth, authUid } = req.body;
  if (!mcpCardNumber || !dateOfBirth) {
    return res.status(400).json({ success: false, error: 'Missing MCP Card Number or Date of Birth.' });
  }

  // Verify against verified registry
  if (mcpCardNumber === 'MCP-2026-0894' && dateOfBirth === '1998-08-14') {
    return res.json({
      success: true,
      message: 'Mother and Child Protection record successfully verified and linked.',
      motherId: 'MCP-2026-0894',
      name: 'Priya Sharma',
      authUid: authUid || 'verified',
    });
  }

  return res.status(404).json({
    success: false,
    error: 'No unlinked maternal record found matching the provided MCP Card Number and Date of Birth.',
  });
});

// API: Secure Content Translation Endpoint
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ success: false, error: 'Missing text or targetLang parameter.' });
  }

  const cleanText = String(text).trim();
  const cleanLang = String(targetLang).trim().toLowerCase();

  if (cleanLang === 'en') {
    return res.json({ success: true, translatedText: cleanText, sourceLanguage: 'en', targetLang: 'en' });
  }

  try {
    const { localizeDynamicText } = await import('./src/utils/dynamicLocalization.ts');
    const translated = localizeDynamicText(cleanText, cleanLang as 'hi' | 'or');
    return res.json({
      success: true,
      translatedText: translated,
      sourceLanguage: 'en',
      targetLang: cleanLang,
      cached: true,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Translation processing failed.',
      fallback: cleanText,
    });
  }
});

// API: ML Explainable Risk Screening Endpoint
app.post('/api/predict', async (req, res) => {
  try {
    const {
      age,
      systolicBP,
      diastolicBP,
      bloodSugar,
      bloodSugarUnit,
      bodyTemp,
      bodyTempUnit,
      heartRate,
      supplementaryObservations,
    } = req.body;

    const validationErrors: string[] = [];

    // 1. Strict Input Validation & Range Boundaries
    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 10 || numAge > 70) {
      validationErrors.push('Maternal age must be a valid number between 10 and 70 years.');
    }

    const numSystolic = Number(systolicBP);
    if (isNaN(numSystolic) || numSystolic < 60 || numSystolic > 220) {
      validationErrors.push('Systolic blood pressure must be between 60 and 220 mmHg.');
    }

    const numDiastolic = Number(diastolicBP);
    if (isNaN(numDiastolic) || numDiastolic < 30 || numDiastolic > 140) {
      validationErrors.push('Diastolic blood pressure must be between 30 and 140 mmHg.');
    }

    if (!isNaN(numSystolic) && !isNaN(numDiastolic) && numDiastolic >= numSystolic) {
      validationErrors.push('Diastolic pressure cannot exceed or equal systolic pressure.');
    }

    const numBS = Number(bloodSugar);
    if (isNaN(numBS) || numBS <= 0) {
      validationErrors.push('Blood glucose measurement is required and must be greater than 0.');
    }

    const numTemp = Number(bodyTemp);
    if (isNaN(numTemp) || numTemp <= 0) {
      validationErrors.push('Body temperature measurement is required.');
    }

    let numHR = Number(heartRate);
    if (isNaN(numHR) || numHR < 30 || numHR > 200) {
      validationErrors.push('Heart rate must be a valid physiological measurement between 30 and 200 bpm. Implausible measurements trigger remeasurement.');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Clinical input validation failed.',
        validationErrors,
      });
    }

    // 2. Unit Normalization Audit (Prevent double conversion)
    const cleanBSUnit = bloodSugarUnit === 'mg/dL' ? 'mg/dL' : 'mmol/L';
    let normalizedBS = numBS;
    if (cleanBSUnit === 'mg/dL') {
      normalizedBS = Number((numBS / 18.0).toFixed(2)); // Convert mg/dL to mmol/L
    }

    const cleanTempUnit = bodyTempUnit === '°C' ? '°C' : '°F';
    let normalizedTemp = numTemp;
    if (cleanTempUnit === '°C') {
      normalizedTemp = Number(((numTemp * 9) / 5 + 32).toFixed(1)); // Convert °C to °F
    }

    // 3. Load Versioned Model Artifact
    const modelPath = path.resolve(__dirname, 'src/ml/model_v1.0.0.json');
    if (!fs.existsSync(modelPath)) {
      return res.status(503).json({
        success: false,
        error: 'Machine learning prediction model is currently unavailable.',
        modelUnavailable: true,
      });
    }

    const modelArtifact = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
    const { predictWithExplanation } = await import('./src/ml/mlEngine.ts');

    const prediction = predictWithExplanation(
      modelArtifact.treeRoot,
      {
        age: numAge,
        systolicBP: numSystolic,
        diastolicBP: numDiastolic,
        bloodSugar: normalizedBS,
        bodyTemp: normalizedTemp,
        heartRate: numHR,
      },
      modelArtifact.modelVersion
    );

    return res.json({
      success: true,
      modelPrediction: {
        riskCategory: prediction.predictedCategory,
        terminalLeafSamples: prediction.terminalLeafSamples,
        leafClassDistribution: prediction.leafClassDistribution,
        distributionNote: prediction.distributionNote,
        decisionPath: prediction.decisionPath,
        contributingFeatures: prediction.contributingFeatures,
        featuresContributingToIncreasedRisk: prediction.featuresContributingToIncreasedRisk,
        featuresContributingToDecreasedRisk: prediction.featuresContributingToDecreasedRisk,
        evaluatedModelFeatures: prediction.evaluatedModelFeatures,
        summaryExplanation: prediction.summaryExplanation,
        modelVersion: modelArtifact.modelVersion,
        preprocessingVersion: modelArtifact.preprocessingVersion,
        explanationMethod: prediction.explanationMethod,
        limitationsNote: prediction.limitationsNote,
      },
      originalMeasurements: {
        age: { value: numAge, unit: 'years' },
        systolicBP: { value: numSystolic, unit: 'mmHg' },
        diastolicBP: { value: numDiastolic, unit: 'mmHg' },
        bloodSugar: { value: numBS, unit: cleanBSUnit },
        bodyTemp: { value: numTemp, unit: cleanTempUnit },
        heartRate: { value: numHR, unit: 'bpm' },
        hemoglobin: { value: supplementaryObservations?.haemoglobinGdl ?? null, unit: 'g/dL' },
      },
      normalizedModelInputs: {
        age: numAge,
        systolicBP: numSystolic,
        diastolicBP: numDiastolic,
        bloodSugarMmolL: normalizedBS,
        bodyTempFahrenheit: normalizedTemp,
        heartRateBpm: numHR,
      },
      supplementaryObservations: {
        haemoglobinGdl: supplementaryObservations?.haemoglobinGdl ?? null,
        bleeding: !!supplementaryObservations?.bleeding,
        swelling: supplementaryObservations?.swelling || 'None',
        reducedFetalMovement: !!supplementaryObservations?.reducedFetalMovement,
        clinicalNotes: supplementaryObservations?.clinicalNotes || '',
      },
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Prediction inference error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process ML risk screening prediction.',
      message: err.message,
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    console.log(`[JanmaSaathi Server] Serving production application bundle from: ${distPath}`);
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('sw.js')) {
            // Never cache the service worker file itself so updates are recognized immediately
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (filePath.endsWith('manifest.webmanifest')) {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          } else if (filePath.includes('/assets/')) {
            // Hashed Vite assets can be safely cached long-term
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[JanmaSaathi Server] Mounting Vite development middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JanmaSaathi full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
