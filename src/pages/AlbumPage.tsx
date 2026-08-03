import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getPublishedPlace, listPublishedPlaces } from "../api/album";
import {
  CHINA_AMAP_BOUNDS,
  CHINA_CENTER_LNG_LAT,
  getAmapKey,
  loadAmap,
  type AMapNamespace,
} from "../lib/amap";
import { sortPlacesByDistance } from "../lib/geo";
import type { AlbumPlaceDetailVO, AlbumPlaceVO } from "../types/album";
import Spinner from "../components/Spinner";

type PlaceWithDistance = AlbumPlaceVO & { distanceKm?: number };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bubbleHtml(name: string, active: boolean, distanceKm?: number): string {
  const dist =
    distanceKm != null
      ? `<span class="album-bubble-sub">${distanceKm.toFixed(1)} km</span>`
      : "";
  return `<div class="album-bubble${active ? " album-bubble-active" : ""}"><span class="album-bubble-dot"></span><span class="album-bubble-label">${escapeHtml(name)}</span>${dist}</div>`;
}

export default function AlbumPage() {
  const [loading, setLoading] = useState(true);
  const [basePlaces, setBasePlaces] = useState<AlbumPlaceVO[]>([]);
  const [displayPlaces, setDisplayPlaces] = useState<PlaceWithDistance[]>([]);
  const [nearby, setNearby] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AlbumPlaceDetailVO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const detailRequestId = useRef(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapNamespace>(null);
  const AMapRef = useRef<AMapNamespace>(null);
  const markersRef = useRef<Map<number, AMapNamespace>>(new Map());
  const userMarkerRef = useRef<AMapNamespace>(null);
  const fittedRef = useRef(false);
  const selectPlaceRef = useRef<(id: number, opts?: { expandSheet?: boolean }) => void>(() => {});

  useEffect(() => {
    listPublishedPlaces(0, 200)
      .then((res) => {
        setBasePlaces(res.items);
        setDisplayPlaces(res.items);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!getAmapKey()) {
      setMapError("未配置高德 Key：请在 .env 中设置 VITE_AMAP_KEY 与 VITE_AMAP_SECURITY_JS_CODE");
      return;
    }

    let cancelled = false;
    let map: AMapNamespace;

    loadAmap()
      .then((AMap) => {
        if (cancelled || !mapContainerRef.current) return;
        AMapRef.current = AMap;
        const limitBounds = new AMap.Bounds(CHINA_AMAP_BOUNDS[0], CHINA_AMAP_BOUNDS[1]);
        map = new AMap.Map(mapContainerRef.current, {
          zoom: 4,
          center: CHINA_CENTER_LNG_LAT,
          viewMode: "2D",
          mapStyle: "amap://styles/whitesmoke",
          limitBounds,
          zooms: [3, 18],
        });
        map.addControl(
          new AMap.ToolBar({
            position: { right: "12px", bottom: "210px" },
          }),
        );
        mapRef.current = map;
        setMapReady(true);
        setMapError(null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) {
          setMapError("高德地图加载失败，请检查 Key、安全密钥与域名白名单");
        }
      });

    return () => {
      cancelled = true;
      markersRef.current.clear();
      userMarkerRef.current = null;
      map?.destroy?.();
      mapRef.current = null;
      AMapRef.current = null;
      setMapReady(false);
      fittedRef.current = false;
    };
  }, []);

  const selectedPlace = useMemo(
    () => displayPlaces.find((p) => p.id === selectedId) ?? null,
    [displayPlaces, selectedId],
  );

  const selectPlace = useCallback(async (id: number, opts?: { expandSheet?: boolean }) => {
    setSelectedId(id);
    if (opts?.expandSheet) {
      setSheetExpanded(true);
    }
    setDetail(null);
    setDetailLoading(true);
    const requestId = ++detailRequestId.current;
    try {
      const d = await getPublishedPlace(id);
      if (requestId !== detailRequestId.current) return;
      setDetail(d);
    } catch {
      if (requestId !== detailRequestId.current) return;
      toast.error("加载详情失败");
      setDetail(null);
    } finally {
      if (requestId === detailRequestId.current) {
        setDetailLoading(false);
      }
    }
    requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });
  }, []);

  selectPlaceRef.current = selectPlace;

  useEffect(() => {
    const map = mapRef.current;
    const AMap = AMapRef.current;
    if (!mapReady || !map || !AMap) return;

    const nextIds = new Set(displayPlaces.map((p) => p.id));
    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        map.remove(marker);
        markersRef.current.delete(id);
      }
    }

    for (const p of displayPlaces) {
      const content = bubbleHtml(p.name, selectedId === p.id, p.distanceKm);
      let marker = markersRef.current.get(p.id);
      if (!marker) {
        marker = new AMap.Marker({
          position: [p.lng, p.lat],
          content,
          offset: new AMap.Pixel(0, -8),
          anchor: "bottom-center",
        });
        marker.on("click", () => {
          selectPlaceRef.current(p.id, { expandSheet: true });
        });
        map.add(marker);
        markersRef.current.set(p.id, marker);
      } else {
        marker.setContent(content);
        marker.setPosition([p.lng, p.lat]);
      }
      marker.setzIndex(selectedId === p.id ? 200 : 100);
    }

    if (!fittedRef.current && displayPlaces.length > 0) {
      const overlays = [...markersRef.current.values()];
      map.setFitView(overlays, false, [110, 40, 260, 40], 13);
      fittedRef.current = true;
    }
  }, [mapReady, displayPlaces, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !selectedPlace) return;
    map.setCenter([selectedPlace.lng, selectedPlace.lat]);
  }, [mapReady, selectedPlace]);

  useEffect(() => {
    const map = mapRef.current;
    const AMap = AMapRef.current;
    if (!mapReady || !map || !AMap) return;

    if (!userPos) {
      if (userMarkerRef.current) {
        map.remove(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    const position: [number, number] = [userPos.lng, userPos.lat];
    if (!userMarkerRef.current) {
      userMarkerRef.current = new AMap.Marker({
        position,
        content: '<div class="album-user-dot" aria-hidden="true"></div>',
        offset: new AMap.Pixel(-9, -9),
        zIndex: 300,
      });
      map.add(userMarkerRef.current);
    } else {
      userMarkerRef.current.setPosition(position);
    }

    if (nearby) {
      map.setZoomAndCenter(12, position, true);
    }
  }, [mapReady, userPos, nearby]);

  const handleNearby = useCallback(() => {
    if (nearby) {
      setNearby(false);
      setUserPos(null);
      setDisplayPlaces(basePlaces);
      return;
    }

    if (!navigator.geolocation) {
      toast.error("浏览器不支持定位");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(origin);
        setNearby(true);
        setDisplayPlaces(sortPlacesByDistance(basePlaces, origin));
      },
      () => {
        toast.error("定位失败，已显示全部打卡");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, [nearby, basePlaces]);

  if (loading) {
    return (
      <div className="album-loading flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isEmpty = basePlaces.length === 0;
  const titleName = detail?.name ?? selectedPlace?.name;

  return (
    <div className="album-page absolute inset-0">
      <div ref={mapContainerRef} id="album-amap" className="album-map h-full w-full" />

      {mapError && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center pb-36">
          <div className="album-empty-card pointer-events-auto max-w-sm px-7 py-5 text-center">
            <p className="font-serif text-xl tracking-tight text-[var(--color-heading)]">地图未就绪</p>
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{mapError}</p>
          </div>
        </div>
      )}

      <div className="album-map-veil pointer-events-none absolute inset-x-0 top-0 z-[390] h-28" />

      {isEmpty && !mapError && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center pb-36">
          <div className="album-empty-card px-7 py-5 text-center">
            <p className="font-serif text-xl tracking-tight text-[var(--color-heading)]">暂无足迹</p>
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">还没有发布的打卡地点</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] px-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto flex max-w-[680px] items-stretch gap-2">
          <div className="album-glass album-top-card flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">
            <div className="album-mark shrink-0" aria-hidden="true">
              迹
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[17px] leading-none tracking-tight text-[var(--color-heading)]">
                足迹
              </p>
              <p className="mt-1 truncate text-[11px] tracking-wide text-[var(--color-text-muted)]">
                {nearby ? "按距离排序" : "中国地图"} · {basePlaces.length} 处
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNearby}
            className={`album-glass album-chip ${nearby ? "album-chip-on" : ""}`}
          >
            附近
          </button>
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            className={`album-glass album-chip ${sheetExpanded ? "album-chip-on" : ""}`}
          >
            {sheetExpanded ? "收起" : "列表"}
          </button>
        </div>
      </div>

      <section
        className={`album-sheet album-glass-sheet absolute inset-x-0 bottom-0 z-[500] mx-auto flex max-w-[680px] flex-col ${
          sheetExpanded ? "album-sheet-expanded" : "album-sheet-peek"
        }`}
      >
        <button
          type="button"
          aria-label={sheetExpanded ? "收起列表" : "展开列表"}
          className="grid shrink-0 place-items-center pb-1 pt-2.5"
          onClick={() => setSheetExpanded((v) => !v)}
        >
          <span className="album-handle" />
        </button>

        <div className="flex shrink-0 items-end justify-between px-5 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Places
            </p>
            <h2 className="font-serif text-xl leading-tight tracking-tight text-[var(--color-heading)]">
              {nearby ? "附近优先" : "全部打卡"}
            </h2>
          </div>
          <span className="pb-0.5 text-xs tabular-nums text-[var(--color-text-muted)]">
            {displayPlaces.length}
          </span>
        </div>

        {selectedId != null && (
          <div className="album-detail shrink-0 px-5 pb-3">
            <div className="album-detail-inner">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg tracking-tight text-[var(--color-heading)]">
                    {titleName}
                  </h3>
                  {(detail?.address || selectedPlace?.address) && (
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {detail?.city || selectedPlace?.city}
                      {(detail?.city || selectedPlace?.city) &&
                      (detail?.address || selectedPlace?.address)
                        ? " · "
                        : ""}
                      {detail?.address || selectedPlace?.address}
                    </p>
                  )}
                </div>
                {selectedPlace?.distanceKm != null && (
                  <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--color-accent)]">
                    {selectedPlace.distanceKm.toFixed(1)} km
                  </span>
                )}
              </div>
              {(detail?.note || (!detailLoading && selectedPlace?.note)) && (
                <p className="mb-3 text-sm leading-relaxed text-[var(--color-text)]">
                  {detail?.note || selectedPlace?.note}
                </p>
              )}
              {detailLoading ? (
                <div className="flex h-24 items-center justify-center">
                  <Spinner />
                </div>
              ) : detail ? (
                <>
                  {detail.photos.length > 0 && (
                    <div className="album-photo-rail mb-3 flex gap-2.5 overflow-x-auto pb-1">
                      {detail.photos.map((photo) => (
                        <figure key={photo.id} className="album-photo-card shrink-0">
                          <img
                            src={photo.fileUrl}
                            alt={photo.caption || detail.name}
                            className="h-full w-full object-cover"
                          />
                        </figure>
                      ))}
                    </div>
                  )}
                  {detail.videos.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {detail.videos.map((video) => (
                        <li key={video.id}>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="album-video-link"
                          >
                            <span className="album-video-ico" aria-hidden="true">
                              ▶
                            </span>
                            {video.title || "观看视频"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}

        <ul ref={listRef} className="album-list min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
          {isEmpty ? (
            <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">暂无足迹</li>
          ) : (
            displayPlaces.map((p, index) => (
              <li key={p.id}>
                <button
                  type="button"
                  data-id={p.id}
                  onClick={() => selectPlace(p.id)}
                  className={`album-place-row ${selectedId === p.id ? "album-place-row-active" : ""}`}
                >
                  <div className="album-thumb">
                    {p.coverUrl ? (
                      <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="album-thumb-fallback">{String(index + 1).padStart(2, "0")}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-medium tracking-tight text-[var(--color-heading)]">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {[p.city, p.address].filter(Boolean).join(" · ")}
                    </p>
                    {p.note && (
                      <p className="mt-1 line-clamp-1 text-xs leading-snug text-[var(--color-text)]">
                        {p.note}
                      </p>
                    )}
                  </div>
                  <div className="album-place-meta">
                    {p.distanceKm != null ? (
                      <span className="tabular-nums text-[var(--color-accent)]">
                        {p.distanceKm.toFixed(1)}
                        <span className="text-[10px] opacity-80"> km</span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">
                        {p.photoCount > 0 ? `${p.photoCount} 图` : "—"}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
