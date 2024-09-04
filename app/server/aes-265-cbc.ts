import crypto from "crypto";

class AES256CBC {
  private key: Buffer;
  private iv: Buffer;

  constructor(key: string, iv: string) {
    // The key must be 32 bytes for AES-256 and iv must be 16 bytes
    if (key.length !== 32) {
      throw new Error("Key length must be 32 bytes for AES-256");
    }
    if (iv.length !== 16) {
      throw new Error("IV length must be 16 bytes for AES-CBC");
    }

    this.key = Buffer.from(key);
    this.iv = Buffer.from(iv);
  }

  // Encrypt a string
  encrypt(text: string): string {
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, this.iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  // Decrypt a string
  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, this.iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Encrypt an object (serialize it to JSON)
  encryptObject<T>(data: T): string {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString);
  }

  // Decrypt an object (deserialize JSON back to an object)
  decryptObject<T>(encryptedText: string): T | null {
    try {
      const decryptedText = this.decrypt(encryptedText);
      return JSON.parse(decryptedText);
    } catch {}
    return null;
  }
}

const aes256cbc = new AES256CBC(
  process.env.AES256CBC_KEY,
  process.env.AES256CBC_IV
);
export default aes256cbc;
