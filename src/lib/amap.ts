import AMapLoader from "@amap/amap-jsapi-loader";

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string;
      serviceHost?: string;
    };
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

function applySecurityConfig(): void {
  const security = (import.meta.env.VITE_AMAP_SECURITY_JS_CODE as string | undefined)?.trim();
  if (security) {
    // Must be set before AMapLoader.load / maps script request
    window._AMapSecurityConfig = { securityJsCode: security };
  }
}

/** Apply as early as this module is imported */
applySecurityConfig();

export function formatAmapLoadError(err: unknown): string {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : err
          ? String(err)
          : "";

  const text = raw.toUpperCase();
  if (text.includes("INVALID_USER_DOMAIN") || text.includes("USER_DOMAIN")) {
    return "域名未在高德白名单：请在控制台为该 Key 添加当前访问域名（含 IP 与 www）";
  }
  if (text.includes("INVALID_USER_SCODE") || text.includes("SCODE")) {
    return "安全密钥校验失败：请确认 VITE_AMAP_SECURITY_JS_CODE 与 Key 匹配";
  }
  if (text.includes("INVALID_USER_KEY") || text.includes("USER_KEY")) {
    return "Key 无效或过期：请确认申请的是 Web端(JS API) Key";
  }
  if (text.includes("USERKEY_PLAT_NOMATCH") || text.includes("PLAT_NOMATCH")) {
    return "Key 平台不符：请使用 Web端(JS API) 类型的 Key，不要用 Web服务 Key";
  }
  if (
    text.includes("FAILED TO FETCH") ||
    text.includes("NETWORK") ||
    text.includes("LOAD") ||
    text.includes("TIMEOUT") ||
    text.includes("ERR_CONNECTION") ||
    text.includes("ERR_SSL") ||
    text.includes("ERR_NAME")
  ) {
    return "浏览器无法访问 webapi.amap.com（代理/VPN/网络拦截）。请关闭代理后重试，或换网络访问";
  }
  if (raw) {
    return `高德加载失败：${raw}`;
  }
  return "高德地图加载失败，请检查 Key、安全密钥、域名白名单与网络";
}

export async function loadAmap(): Promise<AMapNamespace> {
  const key = getAmapKey();
  if (!key) {
    throw new Error("MISSING_AMAP_KEY");
  }

  applySecurityConfig();

  return AMapLoader.load({
    key,
    version: "2.0",
    // ToolBar loaded after map create — avoids hard-failing the whole map if plugin stalls
    plugins: [],
  });
}
