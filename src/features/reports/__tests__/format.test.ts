import { formatReportReference } from '../format';

// Real ids from GetMyReports. Four of them share the tail `4c1a`, which is the whole point.
describe('formatReportReference', () => {
  const IDS = [
    '05533e56-d6d9-4d22-1f6e-08def6164c1a',
    '13e2f098-954c-4797-1f6f-08def6164c1a',
    '3ca38e84-c96b-492f-1f70-08def6164c1a',
    '98c073c7-067f-41fa-1f71-08def6164c1a',
  ];

  it('reads the head of the id', () => {
    expect(formatReportReference(IDS[0])).toBe('#0553');
  });

  it('uppercases it, because the frame shows a reference number', () => {
    expect(formatReportReference('3ca38e84-c96b-492f-1f70-08def6164c1a')).toBe('#3CA3');
  });

  it('tells apart reports the tail could not', () => {
    const references = IDS.map(formatReportReference);
    expect(new Set(references).size).toBe(IDS.length);
  });
});
