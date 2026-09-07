import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';
import {
  resolveAttachmentUrl,
  toUtcTimestamp,
} from '@/features/reports/services/reportService';

import { describeTier, normalizeMapStatus } from '../tier';

import type { MapIssue, MapIssueWire } from '../types';

const BASE = API_BASE_URLS.map;

/** One page covers the oasis many times over, and the map has to hold the whole list anyway. */
export const MAP_PAGE_SIZE = 200;

/** Coordinates cross the wire as strings, and an issue filed without a fix sends null. */
function toCoordinate(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPhotoUrl(photoUrl: string | null): string | undefined {
  return photoUrl ? resolveAttachmentUrl(photoUrl) : undefined;
}

/** Returns null for anything the map cannot place, so no caller has to guess a location. */
export function normalizeMapIssue(wire: MapIssueWire): MapIssue | null {
  const latitude = toCoordinate(wire.latitude);
  const longitude = toCoordinate(wire.longitde);

  if (latitude === null || longitude === null) {
    return null;
  }

  const status = normalizeMapStatus(wire.status);

  return {
    id: wire.issueId,
    title: wire.title,
    latitude,
    longitude,
    photoUrl: toPhotoUrl(wire.photoUrl),
    status,
    tier: describeTier(wire.priority, status),
    createdAt: toUtcTimestamp(wire.createdAt),
  };
}

/** Both query values are always sent: omitting them pages by zero, and page=0 is a 500. */
export async function getMapIssues(): Promise<MapIssue[]> {
  const wire = await apiClient.get<MapIssueWire[]>(
    BASE,
    API_ENDPOINTS.map.all(MAP_PAGE_SIZE, 1),
    { authenticated: true },
  );

  // Filtered after mapping, so one unplaceable issue cannot drop the rest.
  return wire.map(normalizeMapIssue).filter((issue): issue is MapIssue => issue !== null);
}

export async function getMapIssueById(issueId: string): Promise<MapIssue | null> {
  const wire = await apiClient.get<MapIssueWire>(BASE, API_ENDPOINTS.map.byId(issueId), {
    authenticated: true,
  });
  return normalizeMapIssue(wire);
}
