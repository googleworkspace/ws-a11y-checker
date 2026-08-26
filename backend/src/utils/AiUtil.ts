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
            console.log(`[DEBUG_IMAGE_DIAGNOSTIC] Direct inline body data found for CID "${contentId}". Length: ${base64Data?.length || 0}`);
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

/**
 * Cleans up or returns existing alternative text without introductory phrases.
 */
export function generateAiAltText(elementId: string, currentAlt?: string, base64DataParam?: string): string {
  if (currentAlt) {
    const cleaned = currentAlt.replace(/^(image|picture|photo|screenshot|graphic|diagram) of\s+/i, '').trim();
    if (cleaned && !/^(img_|dsc_|dcim_|photo_|image_|\d+|screenshot)|(\.(jpg|jpeg|png|gif|bmp|webp|svg)$)/i.test(cleaned)) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return '';
}

/**
 * Generates a descriptive link anchor title using deterministic syntactic heuristics.
 */
export function generateAiLinkTitle(anchorText: string, sentenceContext?: string, url?: string): string {
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

  return `${anchorText} (Reference Link)`;
}
