// Day 94 — ang IDEYA ng passkey, gamit lang ang node:crypto (walang library, walang browser).
// HINDI ito ang totoong WebAuthn (mas marami itong detalye — Day 95–98); ito ang tatlong bahagi na nagpapaligtas dito:
//   1. key pair: ang PRIVATE key ay hindi umaalis sa device; PUBLIC key lang ang nasa server
//   2. challenge: random, isang gamit lang — kaya walang silbi ang lumang pirma (replay)
//   3. origin: kasama sa pinipirmahan ang site na kausap ng browser — kaya walang silbi ang pirma mula sa pekeng site (phishing)
// Patakbuhin:  cd backend && node playground/02-passkey-concept.js
import { generateKeyPairSync, randomBytes, sign, verify } from 'node:crypto';

const REAL_SITE = 'https://nelson1869.com';

// --- REGISTER (isang beses): gumagawa ang device ng key pair PARA SA SITE NA ITO ---
const device = generateKeyPairSync('ec', { namedCurve: 'P-256' }); // ES256, ang karaniwang algorithm ng passkey
const server = { publicKey: device.publicKey, challenge: null }; // ito LANG ang alam ng server — walang sikreto
console.log('Nasa server:', server.publicKey.export({ type: 'spki', format: 'pem' }).split('\n')[1].slice(0, 30) + '… (public key lang)');

// --- LOGIN ---
function serverStartsLogin() {
  server.challenge = randomBytes(32).toString('base64url'); // bago sa bawat login
  return server.challenge;
}
// Ang BROWSER ang naglalagay ng origin (hindi ang page, kaya hindi ito mapepeke ng pekeng site); ang device ang pumipirma
function deviceSigns(challenge, originSeenByBrowser) {
  const clientData = JSON.stringify({ challenge, origin: originSeenByBrowser });
  return { clientData, signature: sign('sha256', Buffer.from(clientData), device.privateKey) };
}
function serverVerifies({ clientData, signature }) {
  const { challenge, origin } = JSON.parse(clientData);
  const expected = server.challenge;
  server.challenge = null; // isang gamit lang, pumasa man o hindi
  if (!expected || challenge !== expected) return '❌ maling o nagamit nang challenge';
  if (origin !== REAL_SITE) return `❌ maling origin (${origin})`;
  if (!verify('sha256', Buffer.from(clientData), server.publicKey, signature)) return '❌ maling pirma';
  return '✅ naka-login';
}

console.log('\n1. Normal na login:        ', serverVerifies(deviceSigns(serverStartsLogin(), REAL_SITE)));

// REPLAY: nakuha ng umaatake ang buong sagot ng isang lumang login, at ipinadala ulit
const old = deviceSigns(serverStartsLogin(), REAL_SITE);
serverVerifies(old); // ang totoong login
serverStartsLogin(); // bagong login = bagong challenge
console.log('2. Lumang sagot, inulit:    ', serverVerifies(old));

// PHISHING: ang user ay nasa pekeng site. Ipinasa ng pekeng site ang TOTOONG challenge ng totoong server
const phished = deviceSigns(serverStartsLogin(), 'https://nelson1869.com.evil.example');
console.log('3. Pirma mula sa pekeng site:', serverVerifies(phished));

// PEKENG ORIGIN: binago ng umaatake ang origin sa clientData pagkatapos pumirma
const tampered = deviceSigns(serverStartsLogin(), 'https://nelson1869.com.evil.example');
tampered.clientData = tampered.clientData.replace('https://nelson1869.com.evil.example', REAL_SITE);
console.log('4. Binago ang origin:       ', serverVerifies(tampered));

// NINAKAW ANG DATABASE: public key lang ang nakuha — hindi ito makakapirma
const thief = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const c = serverStartsLogin();
const forged = { clientData: JSON.stringify({ challenge: c, origin: REAL_SITE }), signature: null };
forged.signature = sign('sha256', Buffer.from(forged.clientData), thief.privateKey);
console.log('5. Pirma ng ibang key:      ', serverVerifies(forged));
