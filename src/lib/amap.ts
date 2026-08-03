import AMapLoader from "@amap/amap-jsapi-loader";

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

/** Minimal AMap namespace shape used by AlbumPage */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AMapNamespace = any;

/** China envelope as [SW lng/lat, NE lng/lat] for AMap.Bounds */
export const CHINA_AMAP_BOUNDS: [[number, number], [number, number]] = [
  [73.0, 3.0],
  [135.0, 54.0],
];

export const CHINA_CENTER_LNG_LAT: [number, number] = [104, 35];

export function getAmapKey(): string | undefined {
  const key = import.meta.env.VITE_AMAP_KEY as string | undefined;
  return key?.trim() || undefined;
}

export async function loadAmap(): Promise<AMapNamespace> {
  const key = getAmapKey();
  if (!key) {
    throw new Error("MISSING_AMAP_KEY");
  }

  const security = (import.meta.env.VITE_AMAP_SECURITY_JS_CODE as string | undefined)?.trim();
  if (security) {
    window._AMapSecurityConfig = { securityJsCode: security };
  }

  return AMapLoader.load({
    key,
    version: "2.0",
    plugins: ["AMap.ToolBar"],
  });
}
