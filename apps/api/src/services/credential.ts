import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { env } from '../env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
// const TAG_LENGTH = 16;

interface EncryptedPayload {
	iv: string;
	tag: string;
	data: string;
}
const encryptionKey = Buffer.from(env.ENCRYPTION_KEY, 'base64');

if (encryptionKey.length !== 32) {
	throw new Error(
		`ENCRYPTION_KEY must decode to 32 bytes for ${ALGORITHM}; got ${encryptionKey.length}. Regenerate with: openssl rand -base64 32`
	);
}

export function encrypt(plaintext: string): string {
	const iv = randomBytes(IV_LENGTH);

	const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);

	let encrypted = cipher.update(plaintext, 'utf8', 'base64');
	encrypted += cipher.final('base64');

	const tag = cipher.getAuthTag().toString('base64');
	const payload: EncryptedPayload = { iv: iv.toString('base64'), tag, data: encrypted };

	return JSON.stringify(payload);
}

export function decrypt(encryptedStr: string): string {
	const { iv, tag, data } = JSON.parse(encryptedStr) as EncryptedPayload;

	const decipher = createDecipheriv(ALGORITHM, encryptionKey, Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(tag, 'base64'));

	let decrypted = decipher.update(data, 'base64', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
