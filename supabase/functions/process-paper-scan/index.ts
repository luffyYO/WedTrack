import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";
import * as jose from "https://deno.land/x/jose@v5.2.3/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedRow {
  person_name: string;
  father_name: string;
  village: string;
  amount: number | null;
  gift_date: string;
  confidence: number;
  needs_review: boolean;
}

interface OcrResponse {
  raw_ocr_text: string;
  parsed_fields: ParsedRow;
  parsed_rows: ParsedRow[];
  ocr_confidence: number;
  word_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth2 Helper
// ─────────────────────────────────────────────────────────────────────────────

async function getGoogleAccessToken(credentials: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  let privateKey = credentials.private_key;
  if (!privateKey) throw new Error("Missing 'private_key' in Google credentials.");
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  const jwt = await new jose.SignJWT({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(await jose.importPKCS8(privateKey, "RS256"));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  console.log("[process-paper-scan] Request started.");

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return errorResponse("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "").trim();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    let user: any = null;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(
          decodeURIComponent(atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""))
        );
        user = { id: payload.sub, email: payload.email };
      }
    } catch (_) { /* fallback below */ }

    if (!user?.id) {
      const { data: { user: u }, error } = await adminClient.auth.getUser(token);
      if (error || !u) return errorResponse("Unauthorized", 401);
      user = u;
    }

    // ── Parse Body ────────────────────────────────────────────────────────────
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return errorResponse("Content-Type must be application/json", 400);

    const body = await req.json();
    const { image_base64: imageBase64, mime_type: _mimeType = "image/jpeg", wedding_id: weddingId } = body;

    if (!imageBase64) return errorResponse("image_base64 is required", 400);
    if (!weddingId) return errorResponse("wedding_id is required", 400);
    if (imageBase64.length > 14_000_000) return errorResponse("Image too large (max 10 MB)", 400);

    // ── Ownership ─────────────────────────────────────────────────────────────
    const { data: wedding, error: dbError } = await adminClient
      .from("weddings").select("id").eq("id", weddingId).eq("user_id", user.id).maybeSingle();
    if (dbError || !wedding) return errorResponse("Access Denied: You do not own this wedding.", 403);

    // ── Load Learned Corrections (feedback loop) ──────────────────────────────
    // Fetch the last 200 human-edited corrections for this user to build merge rules.
    const { data: corrections } = await adminClient
      .from("ocr_corrections")
      .select("predicted_name, corrected_name, predicted_father, corrected_father, ocr_tokens")
      .eq("user_id", user.id)
      .eq("was_edited", true)
      .order("created_at", { ascending: false })
      .limit(200);

    // Build a learned merge map: "K. Ramchand" → { father: "Bichu", village: ... }
    // and an initial-merge map: "K." + "Ramchand" is a known valid full name
    const learnedNameMerges = new Set<string>();
    const learnedTokenPairs: Map<string, string> = new Map(); // "tok1|tok2" -> merged

    if (corrections && corrections.length > 0) {
      for (const c of corrections) {
        // If user corrected a split name into a merged one, remember the pattern
        if (c.predicted_name && c.corrected_name && c.predicted_name !== c.corrected_name) {
          learnedNameMerges.add(c.corrected_name.trim().toLowerCase());
          // Build token-pair merge rules from OCR tokens JSON
          if (Array.isArray(c.ocr_tokens) && c.ocr_tokens.length >= 2) {
            for (let i = 0; i < c.ocr_tokens.length - 1; i++) {
              const t1 = (c.ocr_tokens[i].text ?? "").trim();
              const t2 = (c.ocr_tokens[i + 1].text ?? "").trim();
              const merged = `${t1} ${t2}`.trim().toLowerCase();
              if (c.corrected_name.toLowerCase().includes(merged)) {
                learnedTokenPairs.set(`${t1.toLowerCase()}|${t2.toLowerCase()}`, `${t1} ${t2}`);
              }
            }
          }
        }
      }
    }

    console.log(`[process-paper-scan] Loaded ${corrections?.length ?? 0} learned corrections. Merge rules: ${learnedTokenPairs.size}`);

    // ── Google Vision Credentials ─────────────────────────────────────────────
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT") || Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const visionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");

    let credentials: any = null;
    if (serviceAccountJson) {
      try { credentials = JSON.parse(serviceAccountJson); } catch (_) {}
    }

    let visionUrl = "https://vision.googleapis.com/v1/images:annotate";
    const vHeaders: Record<string, string> = { "Content-Type": "application/json" };

    if (credentials?.private_key && credentials?.client_email) {
      try {
        const accessToken = await getGoogleAccessToken(credentials);
        vHeaders["Authorization"] = `Bearer ${accessToken}`;
      } catch (err: any) {
        if (visionApiKey) visionUrl += `?key=${visionApiKey}`;
        else return errorResponse(`Auth failed: ${err.message}`, 401);
      }
    } else if (visionApiKey) {
      visionUrl += `?key=${visionApiKey}`;
    } else {
      return errorResponse("OCR credentials not configured. Set GOOGLE_SERVICE_ACCOUNT secret.", 503);
    }

    // ── Call Google Vision ────────────────────────────────────────────────────
    const visionPayload = {
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
        imageContext: { languageHints: ["te", "en", "hi"] },
      }],
    };

    console.log("[process-paper-scan] Calling Google Vision API...");
    const visionRes = await fetch(visionUrl, { method: "POST", headers: vHeaders, body: JSON.stringify(visionPayload) });

    if (!visionRes.ok) {
      const err = await visionRes.text();
      return errorResponse(`Vision API error (${visionRes.status}): ${err}`, 502);
    }

    const visionData = await visionRes.json();
    const annotation = visionData?.responses?.[0];
    if (annotation?.error) return errorResponse(annotation.error.message ?? "Vision processing failed", 422);

    const fullTextAnnotation = annotation?.fullTextAnnotation;
    const rawText: string = fullTextAnnotation?.text ?? "";

    if (!rawText.trim()) return errorResponse("No text found. Please scan a clearer image.", 422);

    const confidence = computeConfidence(fullTextAnnotation);
    const wordCount = (rawText.match(/\S+/g) ?? []).length;

    if (confidence < 0.25 && wordCount < 3) return errorResponse("Image too blurry. Please rescan.", 422);

    // ── Run 4-Pass Spatial Reconstruction ────────────────────────────────────
    console.log("[process-paper-scan] Running 4-pass spatial reconstruction engine...");
    let parsedRows: ParsedRow[] = [];
    try {
      parsedRows = reconstructTableFromVision(fullTextAnnotation, learnedTokenPairs);
    } catch (e: any) {
      console.error("[process-paper-scan] Parser error:", e.message);
    }
    console.log(`[process-paper-scan] Extracted ${parsedRows.length} rows.`);

    const emptyRow: ParsedRow = { person_name: "", father_name: "", village: "", amount: null, gift_date: todayStr(), confidence: 0, needs_review: true };

    const response: OcrResponse = {
      raw_ocr_text: rawText,
      parsed_fields: parsedRows[0] ?? emptyRow,
      parsed_rows: parsedRows,
      ocr_confidence: confidence,
      word_count: wordCount,
    };

    return successResponse(response);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown crash";
    console.error("[process-paper-scan] Fatal error:", msg);
    return errorResponse(`Server error: ${msg}`, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function computeConfidence(fullTextAnnotation: any): number {
  if (!fullTextAnnotation?.pages?.length) return 0.5;
  let total = 0, count = 0;
  for (const page of fullTextAnnotation.pages) {
    for (const block of page.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const word of para.words ?? []) {
          if (typeof word.confidence === "number") { total += word.confidence; count++; }
        }
      }
    }
  }
  return count > 0 ? total / count : 0.5;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token & Pattern Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Token {
  text: string;
  xMin: number; xMax: number; yMin: number; yMax: number;
  cx: number; cy: number; height: number;
  confidence: number;
}

/**
 * HEADER_RE: Matches any token that is a table header or noise.
 * Deliberately broad — includes Telugu header words, English headers, and fragments.
 */
const HEADER_RE = /^(s\.?no\.?|sl\.?no\.?|slno|sr\.?no|no\.?|#|sno|name|guest|groom|bride|father'?s?|fathers?|s\/o|w\/o|d\/o|village|town|amount|rs\.?|rupees|total|grand|signature|sign|date|event|type|gift|contribution|page|మొత్తం|పేరు|తండ్రి|గ్రామం|కానుక|తేదీ|నం\.|మొ\.|--+|===+|___+)$/i;

/** Initials and titles that must be merged with the next token */
const INITIAL_RE = /^(sri|smt|dr|mr|mrs|m\/s|ch|[a-zA-Z]\.?|కె\.|మ\.|పి\.|శ్రీ)$/i;

/** Amount patterns */
function parseAmount(text: string): number | null {
  // Strip currency markers & trailing slashes
  const cleaned = text
    .replace(/[₹rRs\s]/gi, "")
    .replace(/\/-$/g, "")
    .replace(/[^0-9,]/g, "")
    .trim();
  if (!cleaned || !/^\d/.test(cleaned)) return null;
  const val = parseInt(cleaned.replace(/,/g, ""), 10);
  return val >= 50 && val <= 999999 ? val : null;
}

function isPlausibleName(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (HEADER_RE.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  return /[a-zA-Z\u0C00-\u0C7F]/.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4-Pass Spatial Table Reconstruction Engine
// ─────────────────────────────────────────────────────────────────────────────

function reconstructTableFromVision(
  fullTextAnnotation: any,
  learnedTokenPairs: Map<string, string>
): ParsedRow[] {
  if (!fullTextAnnotation?.pages?.length) return [];

  // ══════════════════════════════════════════════════════════════════
  // PASS 1 — Extract word tokens with bounding boxes from Vision API
  // ══════════════════════════════════════════════════════════════════
  const tokens: Token[] = [];
  let pageWidth = 0;
  let pageHeight = 0;

  for (const page of fullTextAnnotation.pages) {
    pageWidth = Math.max(pageWidth, page.width ?? 0);
    pageHeight = Math.max(pageHeight, page.height ?? 0);

    for (const block of page.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const word of para.words ?? []) {
          const text = (word.symbols ?? []).map((s: any) => {
            // Include detected break space after symbol if present
            const breakType = s.property?.detectedBreak?.type;
            return s.text + (breakType === "SPACE" || breakType === "EOL_SURE_SPACE" ? " " : "");
          }).join("").trim();

          if (!text) continue;

          const v = word.boundingBox?.vertices;
          if (!v || v.length < 4) continue;

          const xs = v.map((p: any) => p.x ?? 0);
          const ys = v.map((p: any) => p.y ?? 0);
          const xMin = Math.min(...xs), xMax = Math.max(...xs);
          const yMin = Math.min(...ys), yMax = Math.max(...ys);
          const height = yMax - yMin;
          if (height < 3) continue;

          tokens.push({
            text,
            xMin, xMax, yMin, yMax,
            cx: (xMin + xMax) / 2,
            cy: (yMin + yMax) / 2,
            height,
            confidence: typeof word.confidence === "number" ? word.confidence : 0.8,
          });

          pageWidth = Math.max(pageWidth, xMax);
          pageHeight = Math.max(pageHeight, yMax);
        }
      }
    }
  }

  if (tokens.length === 0) return [];

  // ══════════════════════════════════════════════════════════════════
  // PASS 2 — Cluster tokens into horizontal lines (Y-axis grouping)
  // ══════════════════════════════════════════════════════════════════
  tokens.sort((a, b) => a.cy - b.cy);

  const lines: Token[][] = [];
  for (const tok of tokens) {
    let placed = false;
    for (const line of lines) {
      const lineY = line.reduce((s, t) => s + t.cy, 0) / line.length;
      const avgH = line.reduce((s, t) => s + t.height, 0) / line.length;
      if (Math.abs(tok.cy - lineY) < Math.max(8, avgH * 0.6)) {
        line.push(tok);
        placed = true;
        break;
      }
    }
    if (!placed) lines.push([tok]);
  }

  for (const line of lines) line.sort((a, b) => a.cx - b.cx);

  // ── PASS 2b: Detect header row & derive column X-boundaries ──────
  //
  // A header row has ≥40% of its tokens matching HEADER_RE.
  // From it we extract the X-center of each column header to form
  // column boundary thresholds for all data rows.
  //
  let headerRowIdx = -1;
  // Column boundaries as normalized X fractions [0..1]
  // Defaults cover the typical 4-column handwritten table layout
  let colNameX = 0.0;
  let colFatherX = 0.30;
  let colVillageX = 0.55;
  let colAmountX = 0.80;
  let columnsDetected = false;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.length < 2) continue;
    const headerCount = line.filter(t => HEADER_RE.test(t.text)).length;
    if (headerCount / line.length >= 0.35) {
      headerRowIdx = i;

      // Map header tokens to known field names
      for (const tok of line) {
        const norm = tok.cx / pageWidth;
        const t = tok.text.toLowerCase();
        if (/name|పేరు/.test(t) && !(/father/.test(t))) colNameX = norm;
        else if (/father|s\/o|తండ్రి/.test(t)) colFatherX = norm;
        else if (/village|town|గ్రామం/.test(t)) colVillageX = norm;
        else if (/amount|rs|మొత్తం/.test(t)) colAmountX = norm;
      }
      columnsDetected = true;
      console.log(`[process-paper-scan] Header at line ${i}. Columns: name=${colNameX.toFixed(2)} father=${colFatherX.toFixed(2)} village=${colVillageX.toFixed(2)} amount=${colAmountX.toFixed(2)}`);
      break;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PASS 3 — Map tokens into field buckets using column X boundaries
  // ══════════════════════════════════════════════════════════════════

  /**
   * Merges a bucket of tokens into a single string.
   * Applies:
   *   1. Learned token-pair rules from past corrections
   *   2. Initial-merging heuristic ("K." + "Ramchand" → "K. Ramchand")
   *   3. Space normalization
   */
  function mergeBucket(bucket: Token[]): { text: string; confidence: number } {
    if (bucket.length === 0) return { text: "", confidence: 1 };
    bucket.sort((a, b) => a.cx - b.cx);

    const out: string[] = [];
    let conf = 0;
    let i = 0;

    while (i < bucket.length) {
      const cur = bucket[i];
      conf += cur.confidence;

      if (i < bucket.length - 1) {
        const nxt = bucket[i + 1];
        // Check learned merge rule first
        const pairKey = `${cur.text.trim().toLowerCase()}|${nxt.text.trim().toLowerCase()}`;
        const learnedMerge = learnedTokenPairs.get(pairKey);
        if (learnedMerge) {
          out.push(learnedMerge);
          conf += nxt.confidence;
          i += 2;
          continue;
        }

        // Heuristic: if current token is an initial/title, merge with next
        if (INITIAL_RE.test(cur.text.trim())) {
          const merged = cur.text.trim() + " " + nxt.text.trim();
          out.push(merged);
          conf += nxt.confidence;
          i += 2;
          continue;
        }
      }

      out.push(cur.text.trim());
      i++;
    }

    const text = out.join(" ").replace(/\s{2,}/g, " ").trim();
    return { text, confidence: conf / bucket.length };
  }

  const parsedRows: ParsedRow[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    if (lineIdx === headerRowIdx) continue;

    const line = lines[lineIdx];
    if (line.length === 0) continue;

    // Skip lines where majority of tokens are header words (repeated header rows)
    const headerFrac = line.filter(t => HEADER_RE.test(t.text)).length / line.length;
    if (headerFrac >= 0.5) continue;

    const nameBucket: Token[] = [];
    const fatherBucket: Token[] = [];
    const villageBucket: Token[] = [];
    const amountBucket: Token[] = [];

    if (columnsDetected && pageWidth > 0) {
      // Use detected column boundaries
      for (const tok of line) {
        const nx = tok.cx / pageWidth;
        if (nx >= colAmountX) amountBucket.push(tok);
        else if (nx >= colVillageX) villageBucket.push(tok);
        else if (nx >= colFatherX) fatherBucket.push(tok);
        else nameBucket.push(tok);
      }
    } else {
      // No header detected — use gap-based sequential splitting
      // Find the largest horizontal gaps to infer column transitions
      const sorted = [...line].sort((a, b) => a.cx - b.cx);
      const gaps: { idx: number; gap: number }[] = [];

      for (let g = 0; g < sorted.length - 1; g++) {
        const gap = sorted[g + 1].xMin - sorted[g].xMax;
        const avgH = (sorted[g].height + sorted[g + 1].height) / 2;
        // Significant gap = > 2.0x average char height
        if (gap > avgH * 2.0) gaps.push({ idx: g, gap });
      }
      gaps.sort((a, b) => b.gap - a.gap); // largest gaps first

      // Take up to 3 gap boundaries to split into up to 4 columns
      const splitPoints = gaps
        .slice(0, 3)
        .map(g => g.idx)
        .sort((a, b) => a - b);

      const groups: Token[][] = [];
      let start = 0;
      for (const sp of splitPoints) {
        groups.push(sorted.slice(start, sp + 1));
        start = sp + 1;
      }
      groups.push(sorted.slice(start));

      // Map groups by count
      if (groups.length === 1) nameBucket.push(...groups[0]);
      else if (groups.length === 2) { nameBucket.push(...groups[0]); villageBucket.push(...groups[1]); }
      else if (groups.length === 3) { nameBucket.push(...groups[0]); fatherBucket.push(...groups[1]); villageBucket.push(...groups[2]); }
      else { nameBucket.push(...groups[0]); fatherBucket.push(...groups[1]); villageBucket.push(...groups[2]); amountBucket.push(...groups[3]); }
    }

    const nm = mergeBucket(nameBucket);
    const fa = mergeBucket(fatherBucket);
    const vi = mergeBucket(villageBucket);

    let nameText = nm.text;
    let fatherText = fa.text;
    let villageText = vi.text;
    let amountVal: number | null = null;

    // ── PASS 4: Validate, repair & sanitize ──────────────────────────────────

    // Extract amount from amount bucket
    for (const tok of amountBucket) {
      const a = parseAmount(tok.text);
      if (a !== null) { amountVal = a; break; }
    }
    // Try merged amount bucket text if individual tokens failed
    if (amountVal === null) {
      const amT = mergeBucket(amountBucket).text;
      if (amT) amountVal = parseAmount(amT);
    }

    // Rescue: if no amount found yet, scan village/father for numeric content
    if (amountVal === null && villageText) {
      const a = parseAmount(villageText);
      if (a !== null) { amountVal = a; villageText = ""; }
    }
    if (amountVal === null && fatherText) {
      const a = parseAmount(fatherText);
      if (a !== null) { amountVal = a; fatherText = ""; }
    }
    // Last resort: check name field for amount (single-column OCR)
    if (amountVal === null && nameText) {
      // Extract a trailing number from name
      const m = nameText.match(/(\d{3,6})\s*\/?-?\s*$/);
      if (m) {
        const a = parseAmount(m[1]);
        if (a !== null) {
          amountVal = a;
          nameText = nameText.replace(m[0], "").trim();
        }
      }
    }

    // Remove header words that leaked into any text field
    const sanitize = (s: string) =>
      s.split(/\s+/)
        .filter(part => part.length > 0 && !HEADER_RE.test(part))
        .join(" ")
        .replace(/^[\s.,\-_:]+|[\s.,\-_:]+$/g, "")
        .trim();

    nameText = sanitize(nameText);
    fatherText = sanitize(fatherText);
    villageText = sanitize(villageText);

    // Remove standalone serial numbers like "1", "2.", "01" from name
    nameText = nameText.replace(/^\d+[\.\-\)\s]+/, "").trim();

    // Skip rows where name is a header word after sanitization
    if (HEADER_RE.test(nameText)) continue;
    // Skip purely numeric names
    if (/^\d+$/.test(nameText)) continue;
    // Skip entirely empty data rows
    if (!nameText && amountVal === null) continue;
    // Skip very short single-char fragments with no amount
    if (nameText.length < 2 && amountVal === null) continue;

    // Compute row confidence
    const tokConf = line.reduce((s, t) => s + t.confidence, 0) / line.length;
    const rowConf = Math.round(tokConf * 100) / 100;
    const needsReview = rowConf < 0.70 || !isPlausibleName(nameText) || nameText.length < 2;

    parsedRows.push({
      person_name: nameText,
      father_name: fatherText,
      village: villageText,
      amount: amountVal,
      gift_date: todayStr(),
      confidence: rowConf,
      needs_review: needsReview,
    });
  }

  console.log(`[process-paper-scan] Final: ${parsedRows.length} rows after 4-pass validation.`);
  return parsedRows;
}
