import { createHash } from "crypto";

export class HashUtils {
  /**
   * Generate a consistent hash for any string input
   * @param input - The input string to hash
   * @param length - Length of hash to return (default: 12)
   * @returns Short hash string
   */
  static generateHash(input: string, length: number = 12): string {
    return createHash("md5")
      .update(input.trim().toLowerCase())
      .digest("hex")
      .substring(0, length);
  }
}
