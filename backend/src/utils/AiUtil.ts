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

/**
 * Reliable magic-number MIME type detection from raw byte array.
 */
export function detectMimeFromBytes(bytes: number[]): string {
  if (bytes.length < 4) return 'image/png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp';
  return 'image/png';
}

/**
 * Traverses Gmail REST API message parts (format: 'FULL') to build an exact CID-to-Blob map.
 */
export function getInlineImageMapViaRest(messageId: string, accessToken?: string): Record<string, GoogleAppsScript.Base.Blob> {
  const token = accessToken || ScriptApp.getOAuthToken();
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=FULL`;
  console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Fetching message payload via REST for Message ID: ${messageId}`);
  
  const res = UrlFetchApp.fetch(url, {
    headers: { "Authorization": `Bearer ${token}` },
    muteHttpExceptions: true
  });
  
  console.log(`[DEBUG_IMAGE_DIAGNOSTIC] REST Response Code: ${res.getResponseCode()}`);
  if (res.getResponseCode() !== 200) {
    console.warn(`[getInlineImageMapViaRest] Failed to fetch message ${messageId}:`, res.getContentText());
    return {};
  }

  const messageData = JSON.parse(res.getContentText());
  const cidToBlobMap: Record<string, GoogleAppsScript.Base.Blob> = {};

  function traverseParts(parts: any[]) {
    if (!parts) return;
    for (const part of parts) {
      if (part.headers) {
        let contentId: string | null = null;
        for (const h of part.headers) {
          if (h.name && h.name.toLowerCase() === "content-id") {
            // Strip angle brackets: <ii_12345> -> ii_12345
            contentId = h.value.replace(/^</, "").replace(/>$/, "").trim();
            console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Found MIME Content-ID header: "${h.value}" -> key: "${contentId}"`);
            break;
          }
        }
        if (contentId) {
          let base64Data: string | null = null;
          if (part.body && part.body.data) {
            base64Data = part.body.data;
            console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Direct inline body data found for CID "${contentId}". Length: ${base64Data.length}`);
          } else if (part.body && part.body.attachmentId) {
            console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Attachment ID found for CID "${contentId}": ${part.body.attachmentId}. Fetching raw attachment data...`);
            const attUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${part.body.attachmentId}`;
            const attRes = UrlFetchApp.fetch(attUrl, {
              headers: { "Authorization": `Bearer ${token}` },
              muteHttpExceptions: true
            });
            console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Attachment Fetch Response Code: ${attRes.getResponseCode()}`);
            if (attRes.getResponseCode() === 200) {
              base64Data = JSON.parse(attRes.getContentText()).data;
            }
          }
          if (base64Data) {
            const decodedBytes = Utilities.base64DecodeWebSafe(base64Data);
            const mimeType = part.mimeType || detectMimeFromBytes(decodedBytes);
            const filename = part.filename || `${contentId}.${mimeType.split('/')[1] || 'png'}`;
            cidToBlobMap[contentId] = Utilities.newBlob(decodedBytes, mimeType, filename);
            console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Successfully created Blob for CID "${contentId}" (${mimeType}, ${decodedBytes.length} bytes).`);
          }
        }
      }
      if (part.parts) traverseParts(part.parts);
    }
  }

  traverseParts(messageData.payload?.parts || [messageData.payload]);
  console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Completed REST traversal. Total CIDs mapped: ${Object.keys(cidToBlobMap).length}. Keys:`, Object.keys(cidToBlobMap));
  return cidToBlobMap;
}

/**
 * RPC / Helper: Gets base64 encoded image data from active document or presentation by element ID.
 */
export function rpcGetImageBlob(elementId: string): string {
  try {
    if (typeof DocumentApp !== 'undefined') {
      const doc = DocumentApp.getActiveDocument();
      if (doc && elementId.startsWith('doc_img_')) {
        const idx = parseInt(elementId.replace('doc_img_', ''), 10);
        const img = doc.getBody().getImages()[idx];
        if (img) {
          return Utilities.base64Encode(img.getBlob().getBytes());
        }
      }
    }
  } catch (e) {}

  try {
    if (typeof SlidesApp !== 'undefined') {
      const pres = SlidesApp.getActivePresentation();
      if (pres) {
        const el = pres.getPageElementById(elementId);
        if (el && el.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
          return Utilities.base64Encode(el.asImage().getBlob().getBytes());
        }
      }
    }
  } catch (e) {}

  return '';
}

function callCloudFunction(payload: any): any {
  try {
    const scriptProps = PropertiesService.getScriptProperties().getProperties();
    const userProps = PropertiesService.getUserProperties().getProperties();
    const cfUrl = scriptProps['cloudFunctionUrl'] || userProps['cloudFunctionUrl'] || '';

    if (cfUrl) {
      console.log(`[AiUtil] Invoking Cloud Function microservice at: ${cfUrl}`);
      const res = UrlFetchApp.fetch(cfUrl, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
        timeoutSeconds: 15
      });
      if (res.getResponseCode() === 200) {
        return JSON.parse(res.getContentText());
      } else {
        console.warn(`[AiUtil] Cloud Function error (${res.getResponseCode()}):`, res.getContentText());
      }
    }
  } catch (err: any) {
    console.warn('[AiUtil] Failed to call Cloud Function microservice:', err.message || err);
  }
  return null;
}

/**
 * Generates alternative text for an image using Google Gemini API if key is available, or smart backend NLP fallback.
 */
export function generateAiAltText(elementId: string, currentAlt?: string, base64DataParam?: string): string {
  let apiKey = '';
  let model = 'gemini-3.5-flash-lite';
  try {
    const userProps = PropertiesService.getUserProperties().getProperties();
    apiKey = userProps.geminiApiKey || '';
    model = userProps.aiModel || 'gemini-3.5-flash-lite';
    if (!apiKey) {
      apiKey = PropertiesService.getScriptProperties().getProperty('geminiApiKey') || '';
    }
  } catch (e) {}

  const base64Data = base64DataParam || rpcGetImageBlob(elementId);
  console.log(`[DEBUG_IMAGE_DIAGNOSTIC] generateAiAltText START. elementId="${elementId}", apiKeyPresent=${!!apiKey}, base64Length=${base64Data ? base64Data.length : 0}`);

  if (!base64Data) {
    console.warn(`[DEBUG_IMAGE_DIAGNOSTIC] generateAiAltText: base64Data is EMPTY for ${elementId}! Cannot execute Gemini Vision.`);
    if (currentAlt) {
      const cleaned = currentAlt.replace(/^(image|picture|photo|screenshot|graphic) of\s+/i, '').trim();
      if (cleaned && !/^(img_|dsc_|dcim_|photo_|image_|\d+|screenshot)|(\.(jpg|jpeg|png|gif|bmp|webp|svg)$)/i.test(cleaned)) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }
    return '';
  }

  let mimeType = "image/png";
  try {
    const decodedBytes = Utilities.base64Decode(base64Data);
    mimeType = detectMimeFromBytes(decodedBytes);
  } catch (e) {}

  // 1. Attempt Cloud Function Microservice invocation first
  const cfResponse = callCloudFunction({ action: 'ALT_TEXT', imageBase64: base64Data, mimeType });
  if (cfResponse && cfResponse.altText) {
    console.log(`[AiUtil] ★ SUCCESS via Cloud Function! Generated Alt Text: "${cfResponse.altText}"`);
    return cfResponse.altText;
  }

  try {
    let mimeType = "image/png";
    const decodedBytes = Utilities.base64Decode(base64Data);
    mimeType = detectMimeFromBytes(decodedBytes);
    console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Decoded ${decodedBytes.length} bytes for Gemini/Vertex Vision. Detected MIME type: "${mimeType}"`);

    let url = '';
    const fetchHeaders: Record<string, string> = {};

    if (apiKey) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    } else {
      let projectId = '';
      try {
        const scriptProps = PropertiesService.getScriptProperties().getProperties();
        const userProps = PropertiesService.getUserProperties().getProperties();
        console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Script Prop Keys: ${Object.keys(scriptProps).join(', ')} | User Prop Keys: ${Object.keys(userProps).join(', ')}`);
        
        projectId = scriptProps['gcpProjectId'] || scriptProps['GCP_PROJECT_ID'] || scriptProps['PROJECT_ID'] || 
                    userProps['gcpProjectId'] || userProps['GCP_PROJECT_ID'] || userProps['PROJECT_ID'] || '';
        
        if (!projectId) {
          const crmRes = UrlFetchApp.fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
            headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
            muteHttpExceptions: true
          });
          if (crmRes.getResponseCode() === 200) {
            const data = JSON.parse(crmRes.getContentText());
            if (data.projects && data.projects.length > 0) {
              projectId = data.projects[0].projectId;
            }
          }
        }
      } catch (e: any) {
        console.warn(`[DEBUG_IMAGE_DIAGNOSTIC] Error accessing PropertiesService or CRM: ${e.message}`);
      }

      if (!projectId) {
        console.warn(`[DEBUG_IMAGE_DIAGNOSTIC] No GCP Project ID reachable. Vertex AI flow impossible.`);
        return '';
      }

      let vertexModel = model || 'gemini-3.5-flash-lite';
      if (vertexModel === 'gemini-1.5-flash' || vertexModel === 'gemini-flash') vertexModel = 'gemini-3.5-flash-lite';

      const region = 'us-central1';
      url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${vertexModel}:generateContent`;
      fetchHeaders['Authorization'] = `Bearer ${ScriptApp.getOAuthToken()}`;
    }

    console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Sending request to Gemini Vision API. Using API Key: ${!!apiKey}, Endpoint: ${url}`);

    const payload = {
      contents: [{
        parts: [
          { text: "You are an accessibility audit assistant. Analyze this visual graphic/image from a Google Workspace document or email. Write a concise, highly descriptive Alternative Text caption suitable for screen readers (WCAG 2.1 AA compliant). Do NOT use introductory phrases like 'image of', 'picture of', 'chart showing', or markdown formatting. Output ONLY the clean caption." },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 100 }
    };

    let response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: fetchHeaders,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeoutSeconds: 15
    });

    let responseCode = response.getResponseCode();
    let rawResponseBody = response.getContentText();

    // Fallback retry loop if Vertex AI returns 404 NOT_FOUND for a specific model version string
    if (responseCode === 404 && !apiKey && url.includes('aiplatform.googleapis.com')) {
      const fallbackModels = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash-lite-001',
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash-002',
        'gemini-2.0-flash-001'
      ];
      for (const altModel of fallbackModels) {
        console.warn(`[DEBUG_IMAGE_DIAGNOSTIC] Primary model returned 404. Attempting Vertex fallback model "${altModel}"...`);
        const fallbackUrl = url.replace(/\/models\/[^:]+:/, `/models/${altModel}:`);
        response = UrlFetchApp.fetch(fallbackUrl, {
          method: 'post',
          contentType: 'application/json',
          headers: fetchHeaders,
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
          timeoutSeconds: 15
        });
        responseCode = response.getResponseCode();
        rawResponseBody = response.getContentText();
        if (responseCode === 200) break;
      }
    }

    console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Vision API Response HTTP Status: ${responseCode}`);
    console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Vision API Raw Body: ${rawResponseBody.substring(0, 500)}`);

    const json = JSON.parse(rawResponseBody);
    if (responseCode === 200 && json.candidates?.[0]?.content?.parts?.[0]?.text) {
      const generatedText = json.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
      if (generatedText) {
        console.log(`[DEBUG_IMAGE_DIAGNOSTIC] ★ SUCCESS! Vision API generated alt text: "${generatedText}"`);
        return generatedText;
      }
    } else {
      console.warn(`[DEBUG_IMAGE_DIAGNOSTIC] Vision API call rejected/failed (Code ${responseCode}):`, rawResponseBody);
    }
  } catch (err: any) {
    console.error('[DEBUG_IMAGE_DIAGNOSTIC] Exception during Vision API call:', err.message || err);
  }

  return '';
}

/**
 * Generates a descriptive link anchor title using Gemini API or syntactic NLP rules.
 */
export function generateAiLinkTitle(anchorText: string, sentenceContext?: string, url?: string): string {
  // 1. Attempt Cloud Function Microservice invocation first
  const cfResponse = callCloudFunction({ action: 'LINK_TITLE', anchorText, sentenceContext, url });
  if (cfResponse && cfResponse.linkTitle) {
    console.log(`[AiUtil] ★ SUCCESS via Cloud Function! Generated Link Title: "${cfResponse.linkTitle}"`);
    return cfResponse.linkTitle;
  }

  let apiKey = '';
  let model = 'gemini-3.5-flash-lite';
  try {
    const props = PropertiesService.getUserProperties().getProperties();
    apiKey = props.geminiApiKey || '';
    model = props.aiModel || 'gemini-3.5-flash-lite';
  } catch (e) {}

  if (apiKey && (sentenceContext || url)) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const prompt = `You are a WCAG 2.1 AA accessibility specialist. A hyperlink currently has unclear or generic anchor text: "${anchorText}".
URL destination: "${url || 'not specified'}"
Surrounding sentence context: "${sentenceContext || anchorText}"
Rewrite the hyperlink anchor text so that screen reader users can understand the exact purpose or destination of the link out of context.
Rules:
1. Be concise (2 to 6 words).
2. Do not use generic words like "click here", "link", "this", "page", "document", "more info", or "learn more".
3. Return ONLY the clean replacement title text, capitalized cleanly without quotes, punctuation, or markdown.`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 60 }
      };
      const response = UrlFetchApp.fetch(apiUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      const json = JSON.parse(response.getContentText());
      if (response.getResponseCode() === 200 && json.candidates?.[0]?.content?.parts?.[0]?.text) {
        const generatedText = json.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
        if (generatedText) return generatedText;
      } else {
        console.warn('Gemini API NLP call failed:', response.getContentText());
      }
    } catch (err) {
      console.error('Error calling Gemini API for link title:', err);
    }
  }

  // Smart syntactic NLP heuristic fallback
  if (url) {
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    const domainParts = cleanUrl.split('/')[0].split('.');
    const mainDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
    const formattedDomain = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    
    if (/login|signin|auth/i.test(cleanUrl)) return `${formattedDomain} Login Portal`;
    if (/download|file|pdf|doc/i.test(cleanUrl)) return `${formattedDomain} Document Download`;
    if (/support|help|faq/i.test(cleanUrl)) return `${formattedDomain} Support Center`;
    if (/docs|guide|manual/i.test(cleanUrl)) return `${formattedDomain} Documentation`;
    if (/blog|news|article/i.test(cleanUrl)) return `${formattedDomain} Article`;
    
    return `${formattedDomain} Web Portal`;
  }

  return 'Destination Web Page';
}
