import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto';
import { isoCBOR } from '@simplewebauthn/server/helpers';

// Isang "device" na gawa sa code (Day 95) — para masubukan ang registration sa Vitest nang walang browser o hardware.
// Ginagawa nito ang ginagawa ng totoong authenticator: bagong key pair, at ang `attestationObject` na may public key.
// Ang browser naman ang gumagawa ng `clientDataJSON` (challenge + origin) — kaya napepeke rito ang origin para sa mga test ng phishing.
// Day 99: ang parehong flow sa TOTOONG browser (Playwright + virtual authenticator)

const b64url = (data: Uint8Array | string) => Buffer.from(data).toString('base64url');

// Mga bit ng `flags` sa authenticator data (WebAuthn spec)
const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;
const FLAG_ATTESTED_CREDENTIAL_DATA = 0x40;

// signCount: bilang ng pirma ayon sa device — tumataas sa bawat login (Day 97: ang server ang nagbabantay na hindi ito bumababa)
export type SoftCredential = { credentialId: Buffer; privateKey: KeyObject; publicKey: KeyObject; signCount: number };

export function newSoftCredential(): SoftCredential {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' }); // ES256
  return { credentialId: randomBytes(32), privateKey, publicKey, signCount: 0 };
}

type CreateOptions = {
  challenge: string; // mula sa options ng server
  origin: string; // ang page na "tumawag" — ang browser ang naglalagay nito
  rpId: string; // ang domain kung saan nakatali ang passkey
  credential?: SoftCredential; // default: bago
  userVerified?: boolean; // nagpakita ba ng fingerprint/PIN? default: oo
};

// Ang katumbas ng `navigator.credentials.create()` + `.toJSON()`
export function softCreate({ challenge, origin, rpId, credential = newSoftCredential(), userVerified = true }: CreateOptions) {
  const clientDataJSON = JSON.stringify({ type: 'webauthn.create', challenge, origin, crossOrigin: false });

  // Public key sa COSE format: { 1: kty=EC2, 3: alg=ES256, -1: crv=P-256, -2: x, -3: y }
  const jwk = credential.publicKey.export({ format: 'jwk' });
  const coseKey = isoCBOR.encode(
    new Map<number, number | Uint8Array>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, Buffer.from(jwk.x!, 'base64url')],
      [-3, Buffer.from(jwk.y!, 'base64url')],
    ]),
  );

  const flags = FLAG_USER_PRESENT | FLAG_ATTESTED_CREDENTIAL_DATA | (userVerified ? FLAG_USER_VERIFIED : 0);
  const idLength = Buffer.alloc(2);
  idLength.writeUInt16BE(credential.credentialId.length);
  const authData = Buffer.concat([
    createHash('sha256').update(rpId).digest(), // rpIdHash (32)
    Buffer.from([flags]), // flags (1)
    Buffer.alloc(4), // signCount (4) = 0
    Buffer.alloc(16), // aaguid (16) — walang sinasabi kung anong device
    idLength, // haba ng credential id (2)
    credential.credentialId,
    coseKey,
  ]);
  // `fmt: none`: walang attestation (hindi pinapatunayan kung sino ang gumawa ng device) — iyon din ang hinihingi natin
  const attestationObject = isoCBOR.encode(
    new Map<string, string | Uint8Array | Map<string, never>>([
      ['fmt', 'none'],
      ['attStmt', new Map<string, never>()],
      ['authData', authData],
    ]),
  );

  return {
    credential,
    response: {
      id: b64url(credential.credentialId),
      rawId: b64url(credential.credentialId),
      type: 'public-key' as const,
      response: { clientDataJSON: b64url(clientDataJSON), attestationObject: b64url(attestationObject), transports: ['internal'] },
      clientExtensionResults: {},
      authenticatorAttachment: 'platform' as const,
    },
  };
}

type GetOptions = {
  credential: SoftCredential;
  challenge: string;
  origin: string;
  rpId: string;
  userHandle?: string | null; // ang user id na itinago noong registration (null = huwag isama)
  userVerified?: boolean;
  signCount?: number; // default: dagdagan ng 1
  signWith?: KeyObject; // default: ang private key ng credential (iba = pekeng pirma)
};

// Ang katumbas ng `navigator.credentials.get()` (Day 97): PIRMA sa authenticatorData + SHA-256(clientDataJSON)
export function softGet({ credential, challenge, origin, rpId, userHandle = null, userVerified = true, signCount, signWith }: GetOptions) {
  credential.signCount = signCount ?? credential.signCount + 1;
  const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin, crossOrigin: false }));
  const counter = Buffer.alloc(4);
  counter.writeUInt32BE(credential.signCount);
  const authenticatorData = Buffer.concat([
    createHash('sha256').update(rpId).digest(),
    Buffer.from([FLAG_USER_PRESENT | (userVerified ? FLAG_USER_VERIFIED : 0)]),
    counter,
  ]);
  // ES256: ECDSA P-256 + SHA-256, DER ang format ng pirma (iyon ang default ng node:crypto)
  const signature = sign('sha256', Buffer.concat([authenticatorData, createHash('sha256').update(clientDataJSON).digest()]), signWith ?? credential.privateKey);
  return {
    id: b64url(credential.credentialId),
    rawId: b64url(credential.credentialId),
    type: 'public-key' as const,
    response: {
      clientDataJSON: b64url(clientDataJSON),
      authenticatorData: b64url(authenticatorData),
      signature: b64url(signature),
      ...(userHandle === null ? {} : { userHandle: b64url(userHandle) }),
    },
    clientExtensionResults: {},
    authenticatorAttachment: 'platform' as const,
  };
}

