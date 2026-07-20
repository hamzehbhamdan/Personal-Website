import { describe, it, expect } from "vitest";
import { sniffMime } from "@/lib/mime-sniff";

describe("sniffMime", () => {
  it("detects PDF, PNG, JPEG by magic bytes", () => {
    expect(sniffMime(Buffer.from("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe("image/png");
    expect(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
  });

  it("treats printable/UTF-8 bytes as text and rejects binary", () => {
    expect(sniffMime(Buffer.from("hello world\n"))).toBe("text/plain");
    expect(sniffMime(Buffer.from([0x00, 0x01, 0x02, 0x03]))).toBeNull();
  });
});
