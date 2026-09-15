import express from 'express';
import { TRANSPARENT_GIF, isValidRedirectUrl } from '../utils/tracking.js';
import { recordCampaignOpen, recordCampaignClick } from '../db/campaignRepository.js';

const router = express.Router();

/**
 * GET /api/track/open/:campaignId/:contactId
 * Transparent 1x1 GIF tracking pixel for email opens
 */
router.get('/open/:campaignId/:contactId', async (req, res) => {
  const { campaignId, contactId } = req.params;

  // Send 1x1 transparent GIF immediately with no-cache headers
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': TRANSPARENT_GIF.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.end(TRANSPARENT_GIF);

  // Record open asynchronously
  try {
    await recordCampaignOpen(campaignId, contactId, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } catch (err) {
    console.warn('Aviso: no se pudo registrar apertura de campaña:', err.message);
  }
});

/**
 * GET /api/track/click/:campaignId/:contactId
 * Tracks click on hyperlinked email URLs and redirects safely
 */
router.get('/click/:campaignId/:contactId', async (req, res) => {
  const { campaignId, contactId } = req.params;
  const targetUrl = req.query.url;

  if (!targetUrl || !isValidRedirectUrl(targetUrl)) {
    return res.status(400).send('Enlace de redirección no válido o peligroso.');
  }

  // Record click event asynchronously
  try {
    await recordCampaignClick(campaignId, contactId, targetUrl, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } catch (err) {
    console.warn('Aviso: no se pudo registrar clic de campaña:', err.message);
  }

  // Redirect to original URL
  res.redirect(302, targetUrl);
});

export default router;
