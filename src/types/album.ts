export interface AlbumPlaceVO {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  note: string;
  sortOrder: number;
  status: string;
  coverUrl: string;
  photoCount: number;
  videoCount: number;
  inDtm: number;
  updateDtm: number;
}

export interface AlbumPlaceDetailVO extends AlbumPlaceVO {
  photos: AlbumPhotoVO[];
  videos: AlbumVideoVO[];
}

export interface AlbumPlaceRequest {
  name: string;
  address?: string;
  city?: string;
  lat: number;
  lng: number;
  note?: string;
  sortOrder?: number;
  status?: string;
}

export interface AlbumPhotoVO {
  id: number;
  placeId: number;
  fileUrl: string;
  caption: string;
  sortOrder: number;
}

export interface AlbumPhotoRequest {
  fileUrl: string;
  caption?: string;
  sortOrder?: number;
}

export interface AlbumVideoVO {
  id: number;
  placeId: number;
  url: string;
  platform: string;
  title: string;
  sortOrder: number;
}

export interface AlbumVideoRequest {
  url: string;
  platform?: string;
  title?: string;
  sortOrder?: number;
}
