/** The seeded feed and threads the mock serves. Kept out of the service so the shapes read. */
// Deliberately uneven: the frame's four cards plus the edges a real feed produces — a voice
// report, a text-only report, a resolved one, zero counters, a missing photo, no fix at all.
import type { Comment, FeedPost } from './types';

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/900/600`;

export const SEED_POSTS: readonly FeedPost[] = [
  {
    issueId: '1043',
    title: 'تسريب كبير في القناة الرئيسية',
    description:
      'تسريب كبير في القناة الرئيسية قرب مزرعة النخيل — المياه تفقد بشكل ملحوظ',
    photoUrl: photo('wahakun-canal'),
    hasVoice: true,
    status: 'Reported',
    tier: 'critical',
    createdAt: hoursAgo(0.75),
    latitude: 29.2048,
    longitude: 25.5203,
    reporterId: 'u-1',
    reporterName: 'محمود مصطفى',
    confirmations: 4,
    commentCount: 7,
    shareCount: 2,
    hasConfirmed: false,
  },
  {
    // Already confirmed by this farmer: the frame's filled button state.
    issueId: '1044',
    title: 'انخفاض في ضغط المياه',
    description: 'انخفاض ملحوظ في ضغط المياه في القطاع الشرقي، يؤثر على الري الصباحي',
    photoUrl: photo('wahakun-pump'),
    hasVoice: false,
    status: 'Diagnosed',
    tier: 'medium',
    createdAt: hoursAgo(2),
    latitude: 29.2131,
    longitude: 25.5312,
    reporterId: 'u-2',
    reporterName: 'سيد حسن',
    confirmations: 5,
    commentCount: 4,
    shareCount: 2,
    hasConfirmed: true,
  },
  {
    // No photo and no voice: the card falls back to its description alone.
    issueId: '1045',
    title: 'تلف في بوابة التحكم الرئيسية',
    description: 'تلف في بوابة التحكم الرئيسية — المدخل الغربي',
    hasVoice: false,
    status: 'Scheduled',
    tier: 'low',
    createdAt: hoursAgo(26),
    latitude: 29.2122,
    longitude: 25.5288,
    reporterId: 'u-3',
    reporterName: 'فاطمة سالم',
    confirmations: 3,
    commentCount: 5,
    shareCount: 3,
    hasConfirmed: false,
  },
  {
    // Resolved: no severity badge and no confirm row.
    issueId: '1046',
    title: 'تشقق في جدار القناة الرئيسية',
    description: 'تشقق في جدار القناة الرئيسية — قرب نقطة التحويل',
    photoUrl: photo('wahakun-crack'),
    hasVoice: false,
    status: 'Completed',
    tier: 'resolved',
    createdAt: hoursAgo(72),
    latitude: 29.199,
    longitude: 25.5155,
    reporterId: 'u-4',
    reporterName: 'أحمد حسين',
    confirmations: 6,
    commentCount: 8,
    shareCount: 4,
    hasConfirmed: false,
  },
  {
    // Voice-only, and every counter at zero: a report filed a minute ago.
    issueId: '1047',
    title: 'صوت غريب من مضخة الغرب',
    hasVoice: true,
    status: 'Reported',
    tier: 'medium',
    createdAt: hoursAgo(5),
    latitude: 29.2205,
    longitude: 25.5401,
    reporterId: 'u-5',
    reporterName: 'عبد الرحمن الشيخ',
    confirmations: 0,
    commentCount: 0,
    shareCount: 0,
    hasConfirmed: false,
  },
  {
    // Long title and long description with no photo: the overflow case.
    issueId: '1048',
    title:
      'انسداد كامل في المصرف الفرعي الممتد بين مزرعة النخيل الشرقية وحدود أراضي عائلة الشيخ ناصر',
    description:
      'المصرف الفرعي الممتد بين مزرعة النخيل الشرقية وحدود أراضي عائلة الشيخ ناصر مسدود بالكامل منذ ثلاثة أيام، والمياه راكدة فوق سطح الأرض وبدأت رائحة كريهة تنتشر في المنطقة. حاولنا فتحه يدويًا أكثر من مرة دون جدوى، ونخشى أن يمتد الأثر إلى الحقول المجاورة إذا استمر الوضع على ما هو عليه.',
    hasVoice: false,
    status: 'Assigned',
    tier: 'critical',
    createdAt: hoursAgo(9),
    latitude: 29.2312,
    longitude: 25.5498,
    reporterId: 'u-6',
    reporterName: 'ناصر عبد العظيم',
    confirmations: 11,
    commentCount: 13,
    shareCount: 6,
    hasConfirmed: false,
  },
  {
    // No coordinates at all: the distance line has to disappear, not read "NaN كم".
    issueId: '1049',
    title: 'ملوحة مرتفعة في مياه الري',
    description: 'المياه طعمها مالح من أول أمس والزرع بدأ يصفرّ.',
    photoUrl: photo('wahakun-salinity'),
    hasVoice: false,
    status: 'Diagnosed',
    tier: 'medium',
    createdAt: hoursAgo(31),
    reporterId: 'u-7',
    reporterName: 'سعاد المرسي',
    confirmations: 2,
    commentCount: 1,
    shareCount: 0,
    hasConfirmed: false,
  },
  {
    // No reporter name either, so the card falls back to the placeholder author.
    issueId: '1050',
    title: 'كسر في خط التغذية الفرعي',
    description: 'كسر في خط التغذية الفرعي خلف محطة الرفع.',
    photoUrl: photo('wahakun-pipe'),
    hasVoice: false,
    status: 'Repaired',
    tier: 'resolved',
    createdAt: hoursAgo(120),
    latitude: 29.2077,
    longitude: 25.5229,
    confirmations: 9,
    commentCount: 3,
    shareCount: 1,
    hasConfirmed: false,
  },
];

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const SEED_COMMENTS: readonly Comment[] = [
  {
    id: 'c-1',
    issueId: '1043',
    authorId: 'u-2',
    authorName: 'سيد حسن',
    isExpert: false,
    text: 'لاحظت نفس الشيء في القناة الفرعية القريبة أيضاً، يبدو أن المشكلة تمتد.',
    createdAt: minutesAgo(30),
  },
  {
    id: 'c-2',
    issueId: '1043',
    authorId: 'u-4',
    authorName: 'أحمد حسين',
    isExpert: false,
    text: 'مررت من هناك الصبح، التسريب زاد عن أمس بوضوح.',
    createdAt: minutesAgo(26),
  },
  {
    id: 'c-3',
    issueId: '1043',
    authorId: 'u-9',
    authorName: 'سارة محمود',
    isExpert: true,
    text: 'تم استلام البلاغ وسيتم حل المشكلة ميدانياً خلال 24-48 ساعة. يُرجى عدم محاولة الإصلاح بشكل شخصي.',
    createdAt: minutesAgo(18),
  },
  {
    id: 'c-4',
    issueId: '1043',
    authorId: 'u-3',
    authorName: 'فاطمة سالم',
    isExpert: false,
    text: 'شكراً للخبيرة سارة. هل يمكن معرفة موعد الإصلاح تحديداً؟',
    createdAt: minutesAgo(12),
  },
  {
    // Long enough to wrap several lines, which is what stretches the bubble.
    id: 'c-5',
    issueId: '1043',
    authorId: 'u-6',
    authorName: 'ناصر عبد العظيم',
    isExpert: false,
    text: 'أنا عندي نفس المشكلة في الطرف التاني من القناة، وكلمت الوحدة المحلية مرتين من أسبوع وماحدش جه. لو الإصلاح هيتم دلوقتي ياريت يشوفوا الجزء اللي عندي كمان، لأنه على نفس الخط وهيفضل يسرب حتى لو صلحوا الجزء ده.',
    createdAt: minutesAgo(9),
  },
  {
    id: 'c-6',
    issueId: '1043',
    authorId: 'u-5',
    authorName: 'عبد الرحمن الشيخ',
    isExpert: false,
    text: 'ربنا يسهل، الموسم على الأبواب.',
    createdAt: minutesAgo(5),
  },
  {
    id: 'c-7',
    issueId: '1043',
    authorId: 'u-7',
    authorName: 'سعاد المرسي',
    isExpert: false,
    text: 'تمام، منتظرين.',
    createdAt: minutesAgo(2),
  },
  {
    id: 'c-8',
    issueId: '1044',
    authorId: 'u-1',
    authorName: 'محمود مصطفى',
    isExpert: false,
    text: 'الضغط ضعيف عندي كمان من امبارح.',
    createdAt: minutesAgo(45),
  },
  {
    id: 'c-9',
    issueId: '1046',
    authorId: 'u-9',
    authorName: 'سارة محمود',
    isExpert: true,
    text: 'تم إغلاق البلاغ بعد إصلاح الجدار ومراجعة الخط بالكامل. شكراً لتعاونكم.',
    createdAt: minutesAgo(600),
  },
];

/** F-04's voice player and transcript, keyed by issue: only some issues carry a recording. */
export const SEED_VOICE: Readonly<Record<string, { url: string; transcript: string }>> = {
  '1043': {
    url: 'https://download.samplelib.com/mp3/sample-6s.mp3',
    transcript:
      'عندي مشكلة في قناة الميه، باين إنها بتسرب. المياه مش بتوصل لآخر الأرض، والمحصول هناك بدأ يعطش.',
  },
  '1047': {
    url: 'https://download.samplelib.com/mp3/sample-9s.mp3',
    transcript:
      'المضخة بتطلع صوت عالي وغريب من الصبح، وكل شوية بتقف لوحدها وترجع تشتغل.',
  },
};
