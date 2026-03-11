import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken, generateEncryptionKey } from "../src/db/crypto.js";
import { randomBytes } from "node:crypto";

const TEST_KEY = randomBytes(32);

describe("crypto", () => {
  describe("generateEncryptionKey", () => {
    it("returns a 64-char hex string (32 bytes)", () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it("generates unique keys each time", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("encryptToken", () => {
    it("returns a colon-separated string with 3 parts (iv:authTag:ciphertext)", () => {
      const encrypted = encryptToken("APP_USR-test-token-123", TEST_KEY);
      const parts = encrypted.split(":");
      expect(parts).toHaveLength(3);
    });

    it("returns hex-encoded parts", () => {
      const encrypted = encryptToken("some-token", TEST_KEY);
      const [iv, authTag, ciphertext] = encrypted.split(":");
      expect(iv).toMatch(/^[0-9a-f]+$/);
      expect(authTag).toMatch(/^[0-9a-f]+$/);
      expect(ciphertext).toMatch(/^[0-9a-f]+$/);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", () => {
      const enc1 = encryptToken("same-token", TEST_KEY);
      const enc2 = encryptToken("same-token", TEST_KEY);
      expect(enc1).not.toBe(enc2);
    });

    it("iv is 24 hex chars (12 bytes)", () => {
      const encrypted = encryptToken("token", TEST_KEY);
      const iv = encrypted.split(":")[0];
      expect(iv).toHaveLength(24);
    });

    it("authTag is 32 hex chars (16 bytes)", () => {
      const encrypted = encryptToken("token", TEST_KEY);
      const authTag = encrypted.split(":")[1];
      expect(authTag).toHaveLength(32);
    });

    it("throws if key is not 32 bytes", () => {
      expect(() => encryptToken("token", Buffer.from("short"))).toThrow();
    });

    it("throws if plaintext is empty", () => {
      expect(() => encryptToken("", TEST_KEY)).toThrow("plaintext is required");
    });
  });

  describe("decryptToken", () => {
    it("round-trips: encrypt then decrypt returns original", () => {
      const original = "APP_USR-1234567890-abcdef";
      const encrypted = encryptToken(original, TEST_KEY);
      const decrypted = decryptToken(encrypted, TEST_KEY);
      expect(decrypted).toBe(original);
    });

    it("round-trips with long tokens", () => {
      const original = "EAAm6CtAZBO7ABQ7cAaV3THoyFJQVEZBY5ReqZBj4nZAZBJJLsUhilYZB4Stv";
      const encrypted = encryptToken(original, TEST_KEY);
      expect(decryptToken(encrypted, TEST_KEY)).toBe(original);
    });

    it("round-trips with special characters", () => {
      const original = "APP_USR-test+token/with=special&chars";
      const encrypted = encryptToken(original, TEST_KEY);
      expect(decryptToken(encrypted, TEST_KEY)).toBe(original);
    });

    it("throws with wrong key", () => {
      const encrypted = encryptToken("secret-token", TEST_KEY);
      const wrongKey = randomBytes(32);
      expect(() => decryptToken(encrypted, wrongKey)).toThrow();
    });

    it("throws with tampered ciphertext", () => {
      const encrypted = encryptToken("secret-token", TEST_KEY);
      const parts = encrypted.split(":");
      parts[2] = "ff" + parts[2].slice(2); // tamper ciphertext
      expect(() => decryptToken(parts.join(":"), TEST_KEY)).toThrow();
    });

    it("throws with tampered authTag", () => {
      const encrypted = encryptToken("secret-token", TEST_KEY);
      const parts = encrypted.split(":");
      parts[1] = "ff" + parts[1].slice(2); // tamper auth tag
      expect(() => decryptToken(parts.join(":"), TEST_KEY)).toThrow();
    });

    it("throws with malformed stored string (missing parts)", () => {
      expect(() => decryptToken("onlyonepart", TEST_KEY)).toThrow("Invalid encrypted token format");
    });

    it("throws with malformed stored string (two parts)", () => {
      expect(() => decryptToken("part1:part2", TEST_KEY)).toThrow("Invalid encrypted token format");
    });

    it("throws with empty stored string", () => {
      expect(() => decryptToken("", TEST_KEY)).toThrow("encrypted data is required");
    });
  });
});
