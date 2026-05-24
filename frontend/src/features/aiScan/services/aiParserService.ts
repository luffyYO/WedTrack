/**
 * AI Paste Parser Service
 *
 * Accepts whatever the user pastes from ChatGPT / Gemini / Claude
 * and normalises it into clean OcrRow[] objects.
 *
 * Supported input formats:
 * 1. JSON array  (preferred — AI returns this)
 * 2. Markdown table  (| col | col |)
 * 3. Numbered / plain-text lines  ("1. K. Ramchand, Bichu, Bachapuram, 750")
 * 4. Tab-separated text
 * 5. Any freeform mix of the above
 */


/** Structured row returned by the parser — shared across AI Scan and NewGift AI extract. */
export interface OcrRow {
    id: string;
    person_name: string;
    father_name: string;
    village: string;
    amount: number;
    amount_type: string;
    gift_date: string;
    confidence?: number;
    needs_review?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).substring(2, 9);

/** Strip currency symbols and normalise an amount string to a number. */
function parseAmount(raw: string): number {
    if (!raw) return 0;
    const cleaned = String(raw)
        .replace(/[₹rRs\s]/gi, '')
        .replace(/\/-$/g, '')
        .replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : Math.round(val);
}

/** Remove serial-number prefixes like "1.", "01)", "2 -" from start of string. */
function stripSerial(s: string): string {
    return s.replace(/^\s*\d+[\s.):\-]+/, '').trim();
}

/** Very basic title-case normalisation. */
function normaliseName(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy 1 — JSON
// ─────────────────────────────────────────────────────────────────────────────

function tryParseJson(text: string, defaultDate: string): OcrRow[] | null {
    // Extract the first JSON array from the text (handles markdown code fences)
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return null;

    let parsed: any[];
    try {
        parsed = JSON.parse(match[0]);
    } catch {
        return null;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed
        .map((item: any) => {
            if (typeof item !== 'object' || item === null) return null;

            // Accept multiple key aliases AI models might use
            const name =
                item.name || item.guest_name || item.person_name ||
                item.guestName || item.personName || '';
            const father =
                item.father_name || item.father || item.fatherName ||
                item.fathers_name || item["father's_name"] || '';
            const village =
                item.village || item.town || item.place || item.locality || '';
            const amount = parseAmount(
                String(item.amount || item.amt || item.gift_amount || 0)
            );
            const date =
                item.date || item.gift_date || item.event_date || defaultDate;

            if (!name && amount === 0) return null;

            return {
                id: genId(),
                person_name: normaliseName(String(name)),
                father_name: normaliseName(String(father)),
                village: normaliseName(String(village)),
                amount,
                amount_type: 'Cash',
                gift_date: date,
                confidence: typeof item.confidence === 'number' ? item.confidence : 0.95,
                needs_review: false,
            } as OcrRow;
        })
        .filter((r): r is OcrRow => r !== null && r.person_name.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy 2 — Markdown / pipe table
// ─────────────────────────────────────────────────────────────────────────────

function tryParseMarkdownTable(text: string, defaultDate: string): OcrRow[] | null {
    const lines = text.split('\n').filter(l => l.includes('|'));
    if (lines.length < 2) return null;

    // Find header line
    const headerLine = lines.find(l => /name|father|village|amount/i.test(l));
    if (!headerLine) return null;

    const headers = headerLine
        .split('|')
        .map(h => h.trim().toLowerCase().replace(/[^a-z_' ]/g, '').trim());

    // Map header index to field
    const idx = {
        name: headers.findIndex(h => /name/.test(h) && !/father/.test(h)),
        father: headers.findIndex(h => /father/.test(h)),
        village: headers.findIndex(h => /village|town|place/.test(h)),
        amount: headers.findIndex(h => /amount|amt/.test(h)),
    };

    if (idx.name === -1) return null;

    const rows: OcrRow[] = [];
    const headerIdx = lines.indexOf(headerLine);
    const dataLines = lines.slice(headerIdx + 1).filter(l => !l.match(/^[\s|:-]+$/));

    for (const line of dataLines) {
        const cells = line.split('|').map(c => c.trim()).filter((_, i) => i > 0);
        const get = (i: number) => (i >= 0 && i < cells.length ? cells[i] : '');

        const name = normaliseName(stripSerial(get(idx.name - 1)));
        if (!name) continue;

        rows.push({
            id: genId(),
            person_name: name,
            father_name: normaliseName(get(idx.father - 1)),
            village: normaliseName(get(idx.village - 1)),
            amount: parseAmount(get(idx.amount - 1)),
            amount_type: 'Cash',
            gift_date: defaultDate,
            confidence: 0.93,
            needs_review: false,
        });
    }

    return rows.length > 0 ? rows : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy 3 — Plain text / numbered list
// ─────────────────────────────────────────────────────────────────────────────

function tryParsePlainText(text: string, defaultDate: string): OcrRow[] {
    const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 2 && !/^[-=_|#*]{3,}$/.test(l));

    const rows: OcrRow[] = [];

    // Skip obvious header lines
    const HEADER_RE = /^(s\.?no|name|father|village|amount|guest|date|s\/o|w\/o)/i;

    for (const rawLine of lines) {
        if (HEADER_RE.test(rawLine)) continue;

        const line = stripSerial(rawLine);

        // Detect separator: comma, tab, pipe, or 2+ spaces
        let parts: string[] = [];
        if (line.includes('\t')) {
            parts = line.split('\t').map(p => p.trim());
        } else if (line.includes('|')) {
            parts = line.split('|').map(p => p.trim()).filter(Boolean);
        } else if ((line.match(/,/g) || []).length >= 2) {
            parts = line.split(',').map(p => p.trim());
        } else {
            // Fallback: split on 2+ spaces
            parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
        }

        if (parts.length === 0) continue;

        // Find amount: last element that looks numeric
        let amountVal = 0;
        let amountIdx = -1;
        for (let i = parts.length - 1; i >= 0; i--) {
            const a = parseAmount(parts[i]);
            if (a >= 50) { amountVal = a; amountIdx = i; break; }
        }

        const textParts = parts
            .filter((_, i) => i !== amountIdx)
            .map(p => normaliseName(p))
            .filter(p => p.length > 0);

        let name = '', father = '', village = '';
        if (textParts.length === 1) name = textParts[0];
        else if (textParts.length === 2) { name = textParts[0]; village = textParts[1]; }
        else if (textParts.length >= 3) { name = textParts[0]; father = textParts[1]; village = textParts.slice(2).join(' '); }

        if (!name) continue;

        rows.push({
            id: genId(),
            person_name: name,
            father_name: father,
            village,
            amount: amountVal,
            amount_type: 'Cash',
            gift_date: defaultDate,
            confidence: 0.88,
            needs_review: amountVal === 0,
        });
    }

    return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Master parse function — tries all strategies in priority order
// ─────────────────────────────────────────────────────────────────────────────

export function parseAIPastedText(text: string, defaultDate?: string): OcrRow[] {
    const date = defaultDate ?? new Date().toISOString().split('T')[0];
    const trimmed = text.trim();
    if (!trimmed) return [];

    // 1. JSON (highest confidence — AI typically returns this)
    const jsonRows = tryParseJson(trimmed, date);
    if (jsonRows && jsonRows.length > 0) return jsonRows;

    // 2. Markdown table
    const mdRows = tryParseMarkdownTable(trimmed, date);
    if (mdRows && mdRows.length > 0) return mdRows;

    // 3. Plain text / numbered list (most flexible)
    return tryParsePlainText(trimmed, date);
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction prompt template
// ─────────────────────────────────────────────────────────────────────────────

export const AI_EXTRACTION_PROMPT = `You are an advanced multilingual handwritten document extraction AI.

Your task is to extract structured guest contribution records from handwritten paper sheets with maximum possible accuracy.

The input image may contain:
- handwritten tables
- free-form handwritten lists
- mixed layouts
- multiple languages
- noisy backgrounds
- skewed writing
- inconsistent spacing
- broken rows
- mixed scripts

SUPPORTED LANGUAGES:
- English
- Telugu
- Hindi
- Malayalam
- Tamil
- Kannada
- Marathi
- Urdu
- Bengali
- Hinglish / mixed language writing
- Any multilingual handwritten combination

IMPORTANT:
The output must preserve the original names and language exactly as written.

====================================================
PRIMARY GOAL
====================================================

Extract every guest entry correctly and return ONLY a clean JSON array.

Each guest entry must remain as ONE complete row.

Never split one person into multiple rows.

====================================================
EXPECTED OUTPUT FORMAT
====================================================

[
  {
    "name": "",
    "father_name": "",
    "village": "",
    "amount": ""
  }
]

Return ONLY valid JSON.
Do NOT add explanations.
Do NOT add markdown.
Do NOT add comments.

====================================================
CRITICAL EXTRACTION RULES
====================================================

1. TABLE UNDERSTANDING
- First detect the full table structure.
- Detect rows and columns visually before reading text.
- Understand which words belong to the same row.
- Do NOT process isolated words independently.

2. ROW RECONSTRUCTION
- Merge fragmented words into complete fields.
Examples:
- "K." + "Ramchand" → "K. Ramchand"
- "Ravi" + "Teja" → "Ravi Teja"
- Telugu split syllables must be merged correctly.
- Malayalam broken handwriting fragments must be reconstructed.

3. COLUMN MAPPING
Expected fields:
- name
- father_name
- village
- amount

Map text into the correct field using:
- row alignment
- column position
- handwriting structure
- neighboring tokens
- semantic meaning

4. HEADER REMOVAL
Never include:
- column headers
- totals
- serial numbers
- page numbers
- labels like: Name, Father's Name, Village, Amount, Total

5. AMOUNT NORMALIZATION
Extract amount as plain number string only.
Examples:
- "₹1000" → "1000"
- "1000/-" → "1000"
- "Rs. 5000" → "5000"

6. MULTILINGUAL UNDERSTANDING
The handwritten data may contain:
- Telugu names
- Hindi villages
- Malayalam text
- mixed English + Telugu
- regional abbreviations

Preserve the original script exactly. Do NOT transliterate unless necessary.

7. LOW CONFIDENCE HANDLING
If a field is unclear:
- use empty string ""
- never hallucinate values
- never invent names

8. NO ROW FRAGMENTATION
Do NOT create separate rows for initials, surnames, villages, or amounts.
One person = one JSON object only.

9. SEMANTIC VALIDATION
- Names usually resemble person names
- father_name usually resembles another person name
- village resembles location/place
- amount must be numeric

10. SPATIAL UNDERSTANDING
- same horizontal line = likely same row
- same vertical alignment = likely same column

====================================================
FINAL REQUIREMENT
====================================================

Behave like a human data-entry expert reading handwritten sheets carefully.
The final output must look like a manually verified structured dataset.

Return ONLY the JSON array.`;
