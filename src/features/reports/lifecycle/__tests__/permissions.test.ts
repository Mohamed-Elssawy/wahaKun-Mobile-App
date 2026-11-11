import { canWrite, writePermission } from '../permissions';

import type { Actor } from '../statuses';

const ACTORS: readonly Actor[] = ['farmer', 'expert', 'system', 'admin'];

/** §10.7, cell by cell. Each row lists only the actors with a permission; the rest must be none. */
describe('§10.7 write-permission matrix', () => {
  it.each([
    ['evidence', { farmer: 'create' }],
    ['location', { system: 'create' }],
    ['transcript', { system: 'create' }],
    ['title', { system: 'create' }],
    ['aiOutput', { system: 'create' }],
    ['severity', { expert: 'override', system: 'create' }],
    ['correctedDiagnosis', { expert: 'write' }],
    [
      'publicComment',
      { farmer: 'write', expert: 'write', system: 'remove', admin: 'moderate' },
    ],
    ['chatMessage', { farmer: 'write', expert: 'write', system: 'write' }],
    ['corroboration', { farmer: 'write' }],
    ['appointment', { expert: 'set' }],
    ['repairPhotoAndNotes', { expert: 'write' }],
    ['statusResolved', { farmer: 'write' }],
    ['statusReopened', { farmer: 'write' }],
    ['statusAdminClosed', { admin: 'write' }],
    ['assignedExpert', { system: 'set', admin: 'reassign' }],
  ] as const)('%s', (field, expected) => {
    ACTORS.forEach(actor => {
      const granted = (expected as Partial<Record<Actor, string>>)[actor] ?? 'none';

      expect(writePermission(field, actor)).toBe(granted);
    });
  });
});

describe('the rows that are the product', () => {
  it('gives the farmer both status moves and the expert neither', () => {
    expect(canWrite('statusResolved', 'farmer')).toBe(true);
    expect(canWrite('statusReopened', 'farmer')).toBe(true);
    expect(canWrite('statusResolved', 'expert')).toBe(false);
    expect(canWrite('statusReopened', 'expert')).toBe(false);
  });

  it('gives severity to the expert as an override, never to the farmer', () => {
    expect(writePermission('severity', 'expert')).toBe('override');
    expect(canWrite('severity', 'farmer')).toBe(false);
  });

  // §3.1: routing sets the expert, and only an Admin may change it afterwards.
  it('lets the system assign an expert and only the Admin reassign one', () => {
    expect(writePermission('assignedExpert', 'system')).toBe('set');
    expect(writePermission('assignedExpert', 'admin')).toBe('reassign');
    expect(canWrite('assignedExpert', 'expert')).toBe(false);
  });

  // §3.1 splits §10.7's grouped first row; the farmer creates evidence and nothing else.
  it('does not let the farmer write the title or the AI output', () => {
    expect(canWrite('evidence', 'farmer')).toBe(true);
    expect(canWrite('title', 'farmer')).toBe(false);
    expect(canWrite('aiOutput', 'farmer')).toBe(false);
    expect(canWrite('location', 'farmer')).toBe(false);
  });
});
