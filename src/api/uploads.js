import { ApiError } from "./http.js";
import { presignUpload, recordDocument, recordPhoto } from "./endpoints.js";
import { toDocType, toPhotoCategory } from "./mapping.js";

/**
 * PUTs a file straight at storage, bypassing our API.
 *
 * XHR rather than fetch because it reports progress, and a parent uploading a
 * few MB of registration scans deserves a progress bar rather than a spinner.
 */
function putFile(url, file, { onProgress, signal, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);

    // Each header must be set EXACTLY ONCE. xhr.setRequestHeader APPENDS to an
    // existing header rather than replacing it, so setting Content-Type twice
    // sends "image/png, image/png" — which no longer matches the value baked
    // into the presigned signature, and storage answers 403.
    //
    // The API tells us what it signed via `required_headers`; that always wins.
    // Deduplicated case-insensitively: "Content-Type" and "content-type" are
    // the same header, and setting both would reintroduce the bug.
    const merged = new Map([
      ["content-type", ["Content-Type", file.type || "application/octet-stream"]],
    ]);
    Object.entries(headers).forEach(([key, value]) =>
      merged.set(key.toLowerCase(), [key, value])
    );
    merged.forEach(([name, value]) => xhr.setRequestHeader(name, value));

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new ApiError("Upload failed. Please try that file again.", {
            status: xhr.status,
          })
        );
    };

    xhr.onerror = () =>
      reject(new ApiError("Upload failed. Check your connection.", { status: 0 }));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(file);
  });
}

/**
 * The full presign → PUT → record round trip.
 *
 * `purpose` is "document" or "photo". `meta` carries whatever the record step
 * needs alongside the storage key — a document type, or a photo category.
 * Resolves to the created record.
 */
export async function uploadFile({ file, purpose, meta = {}, onProgress, signal }) {
  const mimeType = file.type || "application/octet-stream";

  const presigned = await presignUpload({
    purpose,
    filename: file.name,
    contentType: mimeType,
    size: file.size,
  });

  const uploadUrl = presigned?.upload_url;
  const fileKey = presigned?.file_key;
  if (!uploadUrl || !fileKey) {
    throw new ApiError("Couldn't start the upload. Please try again.", { status: 502 });
  }

  // The Content-Type is part of what was signed — sending a different one
  // makes storage reject the PUT with a 403.
  await putFile(uploadUrl, file, {
    onProgress,
    signal,
    headers: presigned.required_headers || {},
  });

  // Step 3: tell the API the object exists. `file_key` is what links the row
  // to the stored object; the API validates it belongs to this centre.
  const record = purpose === "photo" ? recordPhoto : recordDocument;
  return record({
    file_key: fileKey,
    file_name: file.name,
    file_size_bytes: file.size,
    mime_type: mimeType,
    ...meta,
  });
}

export const uploadDocument = ({ file, documentType, proofType, ...rest }) =>
  uploadFile({
    file,
    purpose: "document",
    meta: {
      doc_type: toDocType(documentType),
      ...(proofType ? { business_proof_subtype: proofType } : {}),
    },
    ...rest,
  });

export const uploadPhoto = ({ file, category, isCover = false, ...rest }) =>
  uploadFile({
    file,
    purpose: "photo",
    meta: { category: toPhotoCategory(category), is_cover: isCover },
    ...rest,
  });
