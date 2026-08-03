import apiClient from "./client";
import type { PageResult } from "../types";
import type {
  AlbumPhotoRequest,
  AlbumPhotoVO,
  AlbumPlaceDetailVO,
  AlbumPlaceRequest,
  AlbumPlaceVO,
  AlbumVideoRequest,
  AlbumVideoVO,
} from "../types/album";

export function listPublishedPlaces(page = 0, size = 20) {
  return apiClient.get("/album/places", { params: { page, size } }) as unknown as Promise<
    PageResult<AlbumPlaceVO>
  >;
}

export function getPublishedPlace(id: number) {
  return apiClient.get(`/album/places/${id}`) as unknown as Promise<AlbumPlaceDetailVO>;
}

export function adminListPlaces(page = 0, size = 20) {
  return apiClient.get("/admin/album/places", { params: { page, size } }) as unknown as Promise<
    PageResult<AlbumPlaceVO>
  >;
}

export function adminGetPlace(id: number) {
  return apiClient.get(`/admin/album/places/${id}`) as unknown as Promise<AlbumPlaceDetailVO>;
}

export function adminCreatePlace(body: AlbumPlaceRequest) {
  return apiClient.post("/admin/album/places", body) as unknown as Promise<AlbumPlaceDetailVO>;
}

export function adminUpdatePlace(id: number, body: AlbumPlaceRequest) {
  return apiClient.put(`/admin/album/places/${id}`, body) as unknown as Promise<AlbumPlaceDetailVO>;
}

export function adminDeletePlace(id: number) {
  return apiClient.delete(`/admin/album/places/${id}`) as unknown as Promise<void>;
}

export function adminAddPhoto(placeId: number, body: AlbumPhotoRequest) {
  return apiClient.post(`/admin/album/places/${placeId}/photos`, body) as unknown as Promise<AlbumPhotoVO>;
}

export function adminUpdatePhoto(photoId: number, body: AlbumPhotoRequest) {
  return apiClient.put(`/admin/album/photos/${photoId}`, body) as unknown as Promise<AlbumPhotoVO>;
}

export function adminDeletePhoto(photoId: number) {
  return apiClient.delete(`/admin/album/photos/${photoId}`) as unknown as Promise<void>;
}

export function adminAddVideo(placeId: number, body: AlbumVideoRequest) {
  return apiClient.post(`/admin/album/places/${placeId}/videos`, body) as unknown as Promise<AlbumVideoVO>;
}

export function adminUpdateVideo(videoId: number, body: AlbumVideoRequest) {
  return apiClient.put(`/admin/album/videos/${videoId}`, body) as unknown as Promise<AlbumVideoVO>;
}

export function adminDeleteVideo(videoId: number) {
  return apiClient.delete(`/admin/album/videos/${videoId}`) as unknown as Promise<void>;
}
