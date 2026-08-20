/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { VertexAI } = require('@google-cloud/vertexai');

/**
 * Google Cloud Function HTTP handler for Vertex AI accessibility suggestions.
 */
exports.generateAiSuggestions = async (req, res) => {
  // CORS Headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Only POST requests are supported.' });
  }

  const project = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'a11ychecker-501212';
  const location = process.env.GCP_LOCATION || 'us-central1';

  try {
    const vertexAi = new VertexAI({ project, location });
    const generativeModel = vertexAi.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
      generationConfig: { temperature: 0.2, maxOutputTokens: 100 }
    });

    const { action, imageBase64, mimeType, anchorText, sentenceContext, url } = req.body || {};

    if (action === 'ALT_TEXT') {
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 parameter is required for ALT_TEXT.' });
      }

      const prompt = "You are an accessibility audit assistant. Analyze this visual graphic/image from a Google Workspace document or email. Write a concise, highly descriptive Alternative Text caption suitable for screen readers (WCAG 2.1 AA compliant). Do NOT use introductory phrases like 'image of', 'picture of', 'chart showing', or markdown formatting. Output ONLY the clean caption.";

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: imageBase64
        }
      };

      const resp = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }]
      });

      const candidateText = resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const altText = candidateText.trim().replace(/^["']|["']$/g, '');

      return res.status(200).json({ success: true, altText });
    }

    if (action === 'LINK_TITLE') {
      if (!anchorText) {
        return res.status(400).json({ error: 'anchorText parameter is required for LINK_TITLE.' });
      }

      const prompt = `Rewrite this uninformative hyperlink anchor text "${anchorText}" into a concise, highly descriptive 2-5 word anchor label that clearly explains the target destination for screen reader users (WCAG 2.4.4 compliant). Context: "${sentenceContext || ''}". URL: "${url || ''}". Output ONLY the clean replacement anchor text.`;

      const resp = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const candidateText = resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const linkTitle = candidateText.trim().replace(/^["']|["']$/g, '');

      return res.status(200).json({ success: true, linkTitle });
    }

    return res.status(400).json({ error: 'Invalid action. Supported actions: ALT_TEXT, LINK_TITLE.' });
  } catch (err) {
    console.error('Error executing Vertex AI Cloud Function:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
