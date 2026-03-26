const os = require('os');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyBPxR6GnIa1b9KEQ_R3IWDNSobjaYSLbIU';
const PROJECT_ID = 'screenshot-2bb17';
const S3_UPLOAD_API = 'https://p4z47zevn7.execute-api.us-east-1.amazonaws.com/dev/Upload-Image-to-s3';

// Step 1: Ask the API for a pre-signed S3 upload URL
async function getS3PresignedUrl(fileName, mimeType) {
  const res = await fetch(S3_UPLOAD_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, mimeType })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`S3 presign failed: ${err}`);
  }
  return res.json(); // { uploadUrl, fileUrl }
}

// Step 2: PUT the file bytes directly to S3 via the pre-signed URL
async function putFileToS3(uploadUrl, fileBuffer, mimeType) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: fileBuffer
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`S3 PUT failed: ${err}`);
  }
}

// Capture screenshot file → upload to S3 → return the public S3 URL
async function uploadScreenshotToS3(filePath) {
  const fileName = path.basename(filePath);
  const mimeType = 'image/png';

  const { uploadUrl, fileUrl } = await getS3PresignedUrl(fileName, mimeType);
  const fileBuffer = fs.readFileSync(filePath);
  await putFileToS3(uploadUrl, fileBuffer, mimeType);

  return fileUrl;
}

async function refreshIdToken(refreshToken) {
  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  const data = await res.json();
  return { idToken: data.id_token, refreshToken: data.refresh_token };
}

function buildFields(docData) {
  const fields = {};
  Object.entries(docData).forEach(([k, v]) => {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
  });
  return fields;
}

// Save (create/overwrite) a document at a specific path using PATCH
async function setDocument(idToken, docPath, docData) {
  const fields = buildFields(docData);
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore set failed (${docPath}): ${err}`);
  }
  return res.json();
}

// Add a new document (auto-ID) to a collection
async function addDocument(idToken, collection, docData) {
  const fields = buildFields(docData);
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore add failed (${collection}): ${err}`);
  }
  return res.json();
}

// Called once on first login — creates/updates the user's profile in Firestore
async function saveUserRecord({ idToken, userId, userEmail, companyName }) {
  await setDocument(idToken, `users/${userId}`, {
    userId,
    email: userEmail,
    companyName,
    deviceHostname: os.hostname(),
    updatedAt: new Date().toISOString()
  });
}

// Called after every screenshot — uploads to S3, then stores metadata + S3 URL in Firestore
async function saveScreenshotRecord({
  refreshToken, filePath, timestamp, appName,
  userId, userEmail, companyName
}) {
  const tokens = await refreshIdToken(refreshToken);

  // Upload screenshot to S3 and get public URL
  let s3Url = '';
  try {
    s3Url = await uploadScreenshotToS3(filePath);
  } catch (err) {
    console.error('S3 upload failed:', err.message);
  }

  await addDocument(tokens.idToken, 'screenshots', {
    userId,
    userEmail,
    companyName,
    appName: appName || 'Unknown',
    timestamp,
    localFilePath: filePath,
    s3Url,
    deviceHostname: os.hostname(),
    createdAt: new Date().toISOString()
  });

  return { refreshToken: tokens.refreshToken };
}

// Read admin-controlled config for this company from Firestore
async function getAdminConfig(idToken, companyName) {
  const docPath = `companyConfig/${companyName}`;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;

  const cfg = {};
  if (doc.fields.captureInterval) cfg.captureInterval = Number(doc.fields.captureInterval.integerValue);
  if (doc.fields.captureEnabled !== undefined) cfg.captureEnabled = doc.fields.captureEnabled.booleanValue;
  if (doc.fields.forceScreenshotAt) cfg.forceScreenshotAt = doc.fields.forceScreenshotAt.stringValue;
  return cfg;
}

module.exports = { saveScreenshotRecord, saveUserRecord, refreshIdToken, uploadScreenshotToS3, getAdminConfig };
