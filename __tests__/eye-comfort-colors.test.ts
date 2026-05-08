import { getEyeComfortOverlayColor } from "../src/utils/eyeComfortColors";

describe("eye comfort colors", () => {
  it("returns light-mode overlay opacity by level", () => {
    expect(
      getEyeComfortOverlayColor({ isDark: false, level: "low" }),
    ).toBe("rgba(255, 160, 60, 0.08)");
    expect(
      getEyeComfortOverlayColor({ isDark: false, level: "medium" }),
    ).toBe("rgba(255, 160, 60, 0.14)");
    expect(
      getEyeComfortOverlayColor({ isDark: false, level: "high" }),
    ).toBe("rgba(255, 160, 60, 0.22)");
  });

  it("returns dark-mode overlay opacity by level", () => {
    expect(
      getEyeComfortOverlayColor({ isDark: true, level: "low" }),
    ).toBe("rgba(255, 150, 80, 0.06)");
    expect(
      getEyeComfortOverlayColor({ isDark: true, level: "medium" }),
    ).toBe("rgba(255, 150, 80, 0.10)");
    expect(
      getEyeComfortOverlayColor({ isDark: true, level: "high" }),
    ).toBe("rgba(255, 150, 80, 0.16)");
  });

  it("interpolates custom light-mode overlay opacity", () => {
    expect(
      getEyeComfortOverlayColor({
        isDark: false,
        level: "custom",
        customIntensity: 0,
      }),
    ).toBe("rgba(255, 160, 60, 0.08)");
    expect(
      getEyeComfortOverlayColor({
        isDark: false,
        level: "custom",
        customIntensity: 50,
      }),
    ).toBe("rgba(255, 160, 60, 0.15)");
    expect(
      getEyeComfortOverlayColor({
        isDark: false,
        level: "custom",
        customIntensity: 100,
      }),
    ).toBe("rgba(255, 160, 60, 0.22)");
  });

  it("interpolates custom dark-mode overlay opacity", () => {
    expect(
      getEyeComfortOverlayColor({
        isDark: true,
        level: "custom",
        customIntensity: 0,
      }),
    ).toBe("rgba(255, 150, 80, 0.06)");
    expect(
      getEyeComfortOverlayColor({
        isDark: true,
        level: "custom",
        customIntensity: 50,
      }),
    ).toBe("rgba(255, 150, 80, 0.11)");
    expect(
      getEyeComfortOverlayColor({
        isDark: true,
        level: "custom",
        customIntensity: 100,
      }),
    ).toBe("rgba(255, 150, 80, 0.16)");
  });
});
