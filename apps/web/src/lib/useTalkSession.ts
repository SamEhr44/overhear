'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Caption } from '@overhear/shared';
import { MicFailureError, MicStream } from './audio';
import { cancelSpeech, speak } from './tts';
import type { ApiConnection } from './useApiConnection';

export type Speaker = 'me' | 'them';

export type TalkPhase =
  | 'idle'
  | 'recording'
  | 'processing' // mic stopped, waiting for the flushed final
  | 'mic-denied'
  | 'mic-unavailable'
  | 'asr-error';

export interface TalkEntry {
  id: string;
  speaker: Speaker;
  /** What was said, in the speaker's language. */
  sourceText: string;
  /** The translation the other side reads. */
  targetText: string;
  at: number;
}

const PROCESSING_TIMEOUT_MS = 4_000;

/**
 * Two-way conversation session. Each turn is a single utterance:
 * my turn = EN speech → ES text (spoken aloud for the stranger),
 * their turn = ES speech → EN text for me. Zero typing.
 */
export function useTalkSession(connection: ApiConnection) {
  const [turn, setTurn] = useState<Speaker>('me');
  const [phase, setPhase] = useState<TalkPhase>('idle');
  const [entries, setEntries] = useState<TalkEntry[]>([]);
  const [livePartial, setLivePartial] = useState<Caption | null>(null);
  const micRef = useRef<MicStream | null>(null);
  const phaseRef = useRef(phase);
  const turnRef = useRef(turn);
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const teardownMic = useCallback(() => {
    const mic = micRef.current;
    micRef.current = null;
    if (mic) void mic.stop();
  }, []);

  const finishTurn = useCallback(() => {
    teardownMic();
    connection.sendMessage({ type: 'session.stop' });
    if (processingTimer.current) clearTimeout(processingTimer.current);
    setLivePartial(null);
    setPhase('idle');
  }, [connection, teardownMic]);

  // Server messages → live partial + turn completion on final.
  useEffect(() => {
    return connection.subscribe((msg) => {
      if (msg.type === 'caption.partial') {
        if (phaseRef.current === 'recording') setLivePartial(msg.caption);
        return;
      }
      if (msg.type === 'caption.final') {
        if (phaseRef.current !== 'recording' && phaseRef.current !== 'processing') return;
        const speaker = turnRef.current;
        const entry: TalkEntry = {
          id: msg.caption.id,
          speaker,
          sourceText: msg.caption.sourceText,
          targetText: msg.caption.targetText,
          at: Date.now(),
        };
        setEntries((prev) => [...prev, entry]);
        // Speak my Spanish aloud for the stranger.
        if (speaker === 'me' && entry.targetText) void speak(entry.targetText, 'es');
        finishTurn();
        return;
      }
      if (msg.type === 'error' && (msg.code === 'asr_unavailable' || msg.code === 'asr_error')) {
        teardownMic();
        setPhase('asr-error');
      }
    });
  }, [connection, finishTurn, teardownMic]);

  /** Begin recording the current turn's single utterance. */
  const startRecording = useCallback(() => {
    if (phaseRef.current === 'recording' || phaseRef.current === 'processing') return;
    cancelSpeech();
    const speaking = turnRef.current;
    setPhase('recording');
    setLivePartial(null);
    const mic = new MicStream();
    micRef.current = mic;
    connection.sendMessage({
      type: 'session.start',
      mode: 'talk',
      sourceLang: speaking === 'me' ? 'en' : 'es',
      targetLang: speaking === 'me' ? 'es' : 'en',
      audio: { encoding: 'pcm16', sampleRate: mic.sampleRate, channels: 1 },
    });
    mic
      .start((chunk) => {
        connection.sendBinary(chunk);
      })
      .catch((err) => {
        micRef.current = null;
        void mic.stop();
        connection.sendMessage({ type: 'session.stop' });
        if (err instanceof MicFailureError && err.reason === 'denied') setPhase('mic-denied');
        else if (err instanceof MicFailureError && err.reason === 'no-mic')
          setPhase('mic-unavailable');
        else setPhase('idle');
      });
  }, [connection]);

  /** Done talking — flush the final (entry lands via caption.final). */
  const stopRecording = useCallback(() => {
    if (phaseRef.current !== 'recording') return;
    setPhase('processing');
    teardownMic();
    connection.sendMessage({ type: 'session.stop' });
    processingTimer.current = setTimeout(() => {
      if (phaseRef.current === 'processing') {
        setLivePartial(null);
        setPhase('idle');
      }
    }, PROCESSING_TIMEOUT_MS);
  }, [connection, teardownMic]);

  /** Hand the phone over / take it back. */
  const switchTurn = useCallback(
    (next: Speaker) => {
      if (phaseRef.current === 'recording') finishTurn();
      setTurn(next);
      setPhase((p) => (p === 'mic-denied' || p === 'mic-unavailable' ? p : 'idle'));
    },
    [finishTurn],
  );

  /** Tap-to-reply / phrase deck: no ASR — straight to the stream + TTS. */
  const sayPhrase = useCallback((phrase: { es: string; en: string }) => {
    const entry: TalkEntry = {
      id: crypto.randomUUID(),
      speaker: 'me',
      sourceText: phrase.en,
      targetText: phrase.es,
      at: Date.now(),
    };
    setEntries((prev) => [...prev, entry]);
    void speak(phrase.es, 'es');
  }, []);

  const replay = useCallback((entry: TalkEntry) => {
    void speak(
      entry.speaker === 'me' ? entry.targetText : entry.sourceText,
      'es',
    );
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      teardownMic();
      cancelSpeech();
      if (processingTimer.current) clearTimeout(processingTimer.current);
    };
  }, [teardownMic]);

  return {
    turn,
    phase,
    entries,
    livePartial,
    startRecording,
    stopRecording,
    switchTurn,
    sayPhrase,
    replay,
  };
}
