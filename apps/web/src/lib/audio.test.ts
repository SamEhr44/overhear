import { describe, expect, it } from 'vitest';
import { constraintsForProfile } from './audio';

describe('constraintsForProfile', () => {
  it('close-talk keeps voice-call DSP on', () => {
    expect(constraintsForProfile('close-talk')).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });

  it('far-field captures raw so PA announcements are not scrubbed as noise', () => {
    expect(constraintsForProfile('far-field')).toMatchObject({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: true,
    });
  });
});
