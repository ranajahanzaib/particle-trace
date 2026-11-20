import { describe, expect, it } from "vitest";
import {
  formatAngle,
  formatDistance,
  formatEnergy,
  formatMomentum,
  formatTime,
} from "../formatters";

describe("formatters", () => {
  it("formats energy correctly", () => {
    expect(formatEnergy(0.0005)).toBe("0.50 MeV");
    expect(formatEnergy(2.456)).toBe("2.456 GeV");
    expect(formatEnergy(1500)).toBe("1.500 TeV");
    expect(formatEnergy(null)).toBe("—");
  });

  it("formats momentum correctly", () => {
    expect(formatMomentum(12.3456)).toBe("12.346 GeV/c");
    expect(formatMomentum(1200)).toBe("1.200 TeV/c");
    expect(formatMomentum(null)).toBe("—");
  });

  it("formats distance correctly", () => {
    expect(formatDistance(0.025)).toBe("25.0 µm");
    expect(formatDistance(12.345)).toBe("12.345 mm");
    expect(formatDistance(1250)).toBe("1.250 m");
  });

  it("formats time and angles correctly", () => {
    expect(formatTime(0.0002)).toBe("0.20 ps");
    expect(formatTime(1.5234)).toBe("1.523 ns");
    expect(formatAngle(Math.PI)).toContain("3.142 rad (180.0°)");
  });
});
