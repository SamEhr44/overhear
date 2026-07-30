'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { EMPTY_CAPTIONS, reduceCaptions, type CaptionState } from './captions';
import { MicFailureError, MicStream } from './audio';
import type { ApiConnection } from './useApiConnection';

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
 */
export function useListenSession(connection: ApiConnection): ListenSession {
  const [state, setState] = useState<ListenState>('idle');
  const [providers, setProviders] = useState<{ asr: string; mt: string } | null>(null);
  const [whisper, setWhisper] = useState(true);
  const [captions, dispatch] = useReducer(reduceCaptions, EMPTY_CAPTIONS);
  const micRef = useRef<MicStream | null>(null);
  const autoTriedRef = useRef(false);
  const whisperRef = useRef(whisper);
  const stateRef = useRef(state);
  useEffect(() => {
    whisperRef.current = whisper;
  }, [whisper]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const speak = useCallback((text: string) => {
    if (typeof speechSynthesis === 'undefined' || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    speechSynthesis.speak(utterance);
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
    connection.sendMessage({ type: 'session.stop' });
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    setState('idle');
  }, [connection]);

  const start = useCallback(() => {
    if (stateRef.current === 'starting' || stateRef.current === 'live') return;
    setState('starting');
    const mic = new MicStream();
    micRef.current = mic;
    connection.sendMessage({
      type: 'session.start',
      mode: 'listen',
      sourceLang: 'es',
      targetLang: 'en',
      audio: { encoding: 'pcm16', sampleRate: mic.sampleRate, channels: 1 },
    });
    mic
      .start((chunk) => {
        connection.sendBinary(chunk);
      })
      .catch((err) => {
        micRef.current = null;
        void mic.stop();
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

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const mic = micRef.current;
      micRef.current = null;
      if (mic) void mic.stop();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    };
  }, []);

  const setBoost = useCallback((on: boolean) => {
    micRef.current?.setBoost(on);
  }, []);

  return { state, captions, providers, start, stop, setBoost, whisper, setWhisper, speak };
}
