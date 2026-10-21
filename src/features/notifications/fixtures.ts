// Every non-chat row in S-06's table once, with mixed read state and calendar-anchored times.
import type { NotificationItem } from './types';

function daysAgoAt(daysAgo: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export const SEED_NOTIFICATIONS_FARMER: readonly NotificationItem[] = [
  {
    id: 'n-f-01',
    type: 'hazard',
    title: 'تنبيه — 3 مشكلات حرجة بالقرب من موقعك',
    createdAt: minutesAgo(20),
    isRead: false,
    destination: { screen: 'OasisMap' },
  },
  {
    id: 'n-f-02',
    type: 'aiDiagnosis',
    title: 'اكتمل تشخيص الذكاء الاصطناعي لبلاغك #1043',
    createdAt: minutesAgo(45),
    isRead: false,
    destination: { screen: 'ReportTracker', reportId: '1043' },
  },
  {
    id: 'n-f-03',
    type: 'expertReviewed',
    title: 'سارة محمود راجعت بلاغك #1043',
    createdAt: minutesAgo(60),
    isRead: false,
    destination: { screen: 'ReportTracker', reportId: '1043' },
  },
  {
    id: 'n-f-04',
    type: 'comment',
    title: 'أحمد حسين رد على تعليقك في بلاغ #1043',
    createdAt: minutesAgo(180),
    isRead: true,
    destination: { screen: 'IssueDetails', reportId: '1043' },
  },
  {
    id: 'n-f-05',
    type: 'scheduling',
    title: 'تم جدولة فريق لإصلاح بلاغك #1043 — الأحد، 14 يونيو، 9 ص',
    createdAt: daysAgoAt(1, 17, 32),
    isRead: false,
    destination: { screen: 'ReportTracker', reportId: '1043' },
  },
  {
    id: 'n-f-06',
    type: 'confirmationRequest',
    title: 'هل تم إصلاح المشكلة في بلاغك #1038؟ يرجى التأكيد',
    createdAt: daysAgoAt(1, 14, 10),
    isRead: false,
    destination: { screen: 'ReportTracker', reportId: '1038' },
  },
  {
    id: 'n-f-07',
    type: 'resolved',
    title: 'تم حل البلاغ #1038 بنجاح',
    createdAt: daysAgoAt(1, 13, 30),
    isRead: true,
    destination: { screen: 'ReportTracker', reportId: '1038' },
  },
  {
    id: 'n-f-08',
    type: 'scheduling',
    title: 'تم تغيير الخبير المسؤول عن بلاغك #1041',
    createdAt: daysAgoAt(3, 10, 5),
    isRead: true,
    destination: { screen: 'ReportTracker', reportId: '1041' },
  },
  {
    id: 'n-f-09',
    type: 'resolved',
    title: 'تم إغلاق البلاغ #1037 بعد مراجعة الإدارة',
    createdAt: daysAgoAt(4, 9, 15),
    isRead: true,
    destination: { screen: 'ReportTracker', reportId: '1037' },
  },
  {
    id: 'n-f-10',
    type: 'comment',
    title: 'تم حذف تعليقك',
    createdAt: daysAgoAt(6, 11, 0),
    isRead: true,
    destination: { screen: 'IssueDetails', reportId: '1041' },
  },
];

export const SEED_NOTIFICATIONS_EXPERT: readonly NotificationItem[] = [
  {
    id: 'n-e-01',
    type: 'hazard',
    title: 'تنبيه — حالتان حرجتان تنتظران أكثر من 6 ساعات دون مراجعة',
    createdAt: minutesAgo(20),
    isRead: false,
    destination: { screen: 'ExpertInbox' },
  },
  {
    id: 'n-e-02',
    type: 'caseAssigned',
    title: 'تم تعيين حالة جديدة إليك — تسريب في القناة — #1043',
    createdAt: minutesAgo(45),
    isRead: false,
    destination: { screen: 'ExpertCaseReview', reportId: '1043' },
  },
  {
    id: 'n-e-03',
    type: 'aiDiagnosis',
    title: 'إحالة تلقائية — ثقة ذكاء اصطناعي منخفضة 61٪ في حالة #1041',
    createdAt: minutesAgo(60),
    isRead: false,
    destination: { screen: 'ExpertCaseReview', reportId: '1041' },
  },
  {
    id: 'n-e-04',
    type: 'resolved',
    title: 'محمود مصطفى أكّد الحل — الحالة #1043',
    createdAt: daysAgoAt(1, 13, 30),
    isRead: true,
    destination: { screen: 'ExpertCaseClosed', reportId: '1043' },
  },
  {
    id: 'n-e-05',
    type: 'rejectedReopened',
    title: 'أحمد حسين رفض الحل — أُعيد فتح الحالة #1037',
    createdAt: daysAgoAt(1, 13, 30),
    isRead: false,
    destination: { screen: 'ExpertCaseReview', reportId: '1037', state: 'reopened' },
  },
];
