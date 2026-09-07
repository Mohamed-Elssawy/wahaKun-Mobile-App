// A stand-in for reads, not a cache: ReportService has no GetMyIssues/GetIssueById today.

// The rows are assembled from analyze + create, so this device only ever sees its own reports.
// TODO: delete this file once ReportService re-exposes the three commented-out read endpoints.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Report } from '../types';

const KEY = 'wk.reports.mirror';

async function readAll(): Promise<Report[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Report[];
  } catch {
    // A truncated write is not worth crashing My Issues over.
    return [];
  }
}

async function writeAll(reports: Report[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(reports));
}

/** Newest first, matching how My Issues lists them. */
export async function listMirroredReports(): Promise<Report[]> {
  const reports = await readAll();
  return reports.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getMirroredReport(reportId: string): Promise<Report | null> {
  const reports = await readAll();
  return reports.find(report => report.id === reportId) ?? null;
}

/** Upsert, so re-saving a report the farmer already has replaces rather than duplicates. */
export async function saveMirroredReport(report: Report): Promise<void> {
  const reports = await readAll();
  const existing = reports.findIndex(item => item.id === report.id);

  if (existing === -1) {
    await writeAll([report, ...reports]);
    return;
  }

  reports[existing] = report;
  await writeAll(reports);
}

export async function removeMirroredReport(reportId: string): Promise<void> {
  const reports = await readAll();
  await writeAll(reports.filter(report => report.id !== reportId));
}

/** Test seam. Nothing in the app calls this. */
export async function resetReportMirror(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
