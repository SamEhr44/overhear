'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ListenSubMode } from '@overhear/shared';
import { EMPTY_CAPTIONS, reduceCaptions, type CaptionState } from './captions';
import { MicFailureError, MicStream } from './audio';
import { listenSpeech, unlockSpeech } from './tts';
import type { ApiConnection } from './useApiConnection';
import { holdWakeLock, releaseWakeLock } from './wakeLock';

export type ListenState =
  | 'idle' // not started yet (or stopped)
  | 'needs-tap' // browser wants a user gesture before audio can flow
  | 'starting'
  | 'live'
  | 'mic-denied'
  | 'mic-unavailable'
  | 'asr-error';

export interface ListenSession {
  state: ListenState;
  captions: CaptionState;
  providers: { asr: string; mt: string } | null;
  start: () => void;
  stop: () => void;
  setBoost: (on: boolean) => void;
  whisper: boolean;
  setWhisper: (on: boolean) => void;
  /** Speak a caption's English again (Replay). */
  speak: (text: string) => void;
}

/**
 * The live Listen session: mic → WS audio frames → captions back.
 * Auto-starts once the socket connects; honest states for every failure mode.
 * The sub-mode drives the mic profile: announcements/around-me capture raw
 * far-field audio (phone DSP would scrub distant PA speech as "noise"),
 * one-person uses close-talk tuning. Changing sub-mode restarts the stream.
 */
export function useListenSession(
  connection: ApiConnection,
  subMode: ListenSubMode = 'announcements',
): ListenSession {
  const [state, setState] = useState<ListenState>('idle');
  const [providers, setProviders] = useState<{ asr: string; mt: string } | null>(null);
  const [whisper, setWhisper] = useState(true);
  const [captions, dispatch] = useReducer(reduceCaptions, EMPTY_CAPTIONS);
  const micRef = useRef<MicStream | null>(null);
  const autoTriedRef = useRef(false);
  const whisperRef = useRef(whisper);
  const stateRef = useRef(state);
  const subModeRef = useRef(subMode);
  useEffect(() => {
    whisperRef.current = whisper;
  }, [whisper]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const speak = useCallback((text: string) => {
    if (text) listenSpeech.enqueue(text, 'en');
  }, []);

  /**
   * Interpreter mode wiring: turning whisper ON must speak synchronously
   * inside the tap (mobile unlocks TTS for later automatic playback only
   * from a gesture); turning it OFF drops any queued speech.
   */
  const setWhisperMode = useCallback((on: boolean) => {
    if (on) unlockSpeech('English audio on');
    else listenSpeech.clear();
    setWhisper(on);
  }, []);

  // Half-duplex duck: while English plays aloud, silence the mic in the raw
  // far-field modes so the caption stream never transcribes our own TTS
  // (close-talk relies on echo cancellation instead).
  useEffect(() => {
    return listenSpeech.onActivity((speaking) => {
      const farField = subModeRef.current !== 'one-person';
      micRef.current?.setMuted(speaking && farField);
    });
  }, []);

  // Server messages → captions + session state + whisper.
  useEffect(() => {
    return connection.subscribe((msg) => {
      switch (msg.type) {
        case 'caption.partial':
        case 'caption.final':
          dispatch(msg);
          if (msg.type === 'caption.final' && whisperRef.current && msg.caption.targetText) {
            speak(msg.caption.targetText);
          }
          break;
        case 'session.ready':
          setProviders(msg.providers);
          if (stateRef.current === 'starting') setState('live');
          break;
        case 'error':
          if (msg.code === 'asr_unavailable' || msg.code === 'asr_error') {
            setState('asr-error');
          }
          break;
      }
    });
  }, [connection, speak]);

  const stop = useCallback(() => {
    const mic = micRef.current;
    micRef.current = null;
    if (mic) void mic.stop();
    releaseWakeLock();
    connection.sendMessage({ type: 'session.stop' });
    listenSpeech.clear();
    setState('idle');
  }, [connection]);

  const start = useCallback(() => {
    if (stateRef.current === 'starting' || stateRef.current === 'live') return;
    const mode = subModeRef.current;
    const mic = new MicStream();
    const sent = connection.sendMessage({
      type: 'session.start',
      mode: 'listen',
      sourceLang: 'es',
      targetLang: 'en',
      subMode: mode,
      audio: { encoding: 'pcm16', sampleRate: mic.sampleRate, channels: 1 },
    });
    if (!sent) {
      // Socket is down — the chip explains; don't fake a session.
      setState('idle');
      return;
    }
    setState('starting');
    micRef.current = mic;
    holdWakeLock();
    mic
      .start(
        (chunk) => {
          connection.sendBinary(chunk);
        },
        mode === 'one-person' ? 'close-talk' : 'far-field',
      )
      .catch((err) => {
        micRef.current = null;
        void mic.stop();
        releaseWakeLock();
        if (err instanceof MicFailureError) {
          setState(
            err.reason === 'denied'
              ? 'mic-denied'
              : err.reason === 'no-mic'
                ? 'mic-unavailable'
                : 'needs-tap',
          );
        } else {
          setState('needs-tap');
        }
      });
  }, [connection]);

  // Auto-start once per visit when the socket is up.
  useEffect(() => {
    if (connection.status === 'connected' && !autoTriedRef.current) {
      autoTriedRef.current = true;
      start();
    }
    if (connection.status === 'offline' && stateRef.current === 'live') {
      // Socket dropped mid-session — stop the mic, the UI shows reconnecting.
      stop();
    }
  }, [connection.status, start, stop]);

  // Sub-mode switch while live → restart with the matching mic profile
  // and endpointing (the tabs actually change capture behavior).
  useEffect(() => {
    const previous = subModeRef.current;
    subModeRef.current = subMode;
    if (previous === subMode) return;
    if (stateRef.current === 'live' || stateRef.current === 'starting') {
      stop();
      start();
    }
  }, [start, stop, subMode]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const mic = micRef.current;
      micRef.current = null;
      if (mic) void mic.stop();
      releaseWakeLock();
      listenSpeech.clear();
    };
  }, []);

  const setBoost = useCallback((on: boolean) => {
    micRef.current?.setBoost(on);
  }, []);

  return {
    state,
    captions,
    providers,
    start,
    stop,
    setBoost,
    whisper,
    setWhisper: setWhisperMode,
    speak,
  };
}
