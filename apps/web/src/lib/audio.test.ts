import { describe, expect, it } from 'vitest';
import { constraintsForProfile, gainPlanForProfile } from './audio';

describe('constraintsForProfile', () => {
  it('close-talk keeps voice-call DSP on', () => {
    expect(constraintsForProfile('close-talk')).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });

  it('far-field requests the fully raw capture path (all OS processing off)', () => {
    expect(constraintsForProfile('far-field')).toMatchObject({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    });
  });
});

describe('gainPlanForProfile', () => {
  it('far-field runs hot into the leveler so room speech clears the ASR floor', () => {
    expect(gainPlanForProfile('far-field')).toEqual({ base: 2.5, boosted: 6, compressor: true });
  });

  it('close-talk stays unity with a modest boost and no compressor', () => {
    expect(gainPlanForProfile('close-talk')).toEqual({ base: 1, boosted: 2.5, compressor: false });
  });
});
