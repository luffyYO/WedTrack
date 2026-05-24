function base64UrlToBuffer(b64url) {
  const padding = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

const p256dh = "BBSZ5oFORJuRVMMcyJYCM1_fzItlImC5AKVnkowSCVL46kTtxrQ-IfQ8lWg7lQLrZOihmehj-s0ES1kXPIxcAbI";
const auth = "B7W0SI90ah9Dzef7-nVirQ";

const p256dhBuf = new Uint8Array(base64UrlToBuffer(p256dh));
const authBuf = new Uint8Array(base64UrlToBuffer(auth));

console.log("p256dh char length:", p256dh.length);
console.log("p256dh byte length:", p256dhBuf.length);
console.log("p256dh first byte (should be 0x04):", p256dhBuf[0].toString(16));
console.log("auth char length:", auth.length);
console.log("auth byte length:", authBuf.length);
