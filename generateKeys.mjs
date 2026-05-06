import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

// Convex Auth expects a PKCS#8 PEM string (including the BEGIN/END lines).
// Most env UIs (including Convex Dashboard) accept multiline values — paste as-is.
process.stdout.write("JWT_PRIVATE_KEY=");
process.stdout.write(privateKey.trimEnd());
process.stdout.write("\n");
process.stdout.write(`JWKS=${jwks}\n`);

