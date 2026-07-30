'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Caption } from '@overhear/shared';
import { MicFailureError, MicStream } from './audio';
import { cancelSpeech, speak } from './tts';
import type { ApiConnection } from './useApiConnection';
import { holdWakeLock, releaseWakeLock } from './wakeLock';

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
  /** True when committed from a partial (connection hiccup) — best effort. */
  approximate?: boolean;
}

const PROCESSING_TIMEOUT_MS = 4_000;
const SESSION_READY_TIMEOUT_MS = 3_500;

/**
 * Two-way conversation session. Each turn is a single utterance:
 * my turn = EN speech → ES text (spoken aloud for the stranger),
 * their turn = ES speech → EN text for me. Zero typing.
 *
 * Field-hardened: mobile sockets flap (screen dim, radio handoff). Every
 * send is checked, session.ready is awaited with a deadline, a connection
 * drop mid-turn tears the mic down, and a lost final degrades to committing
 * the last partial instead of losing the utterance.
 */
export function useTalkSession(connection: ApiConnection) {
  const [turn, setTurn] = useState<Speaker>('me');
  const [phase, setPhase] = useState<TalkPhase>('idle');
  const [entries, setEntries] = useState<TalkEntry[]>([]);
  const [livePartial, setLivePartial] = useState<Caption | null>(null);
  const micRef = useRef<MicStream | null>(null);
  const phaseRef = useRef(phase);
  const turnRef = useRef(turn);
  const partialRef = useRef<Caption | null>(null);
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const setPartial = useCallback((c: Caption | null) => {
    partialRef.current = c;
    setLivePartial(c);
  }, []);

  const clearTimers = useCallback(() => {
    if (processingTimer.current) clearTimeout(processingTimer.current);
    if (readyTimer.current) clearTimeout(readyTimer.current);
    processingTimer.current = null;
    readyTimer.current = null;
  }, []);

  const teardownMic = useCallback(() => {
    const mic = micRef.current;
    micRef.current = null;
    if (mic) void mic.stop();
    releaseWakeLock();
  }, []);

  const finishTurn = useCallback(() => {
    teardownMic();
    connection.sendMessage({ type: 'session.stop' });
    clearTimers();
    setPartial(null);
    setPhase('idle');
  }, [clearTimers, connection, setPartial, teardownMic]);

  /** Best-effort recovery: commit the last partial as an approximate entry. */
  const commitPartialAsEntry = useCallback(() => {
    const partial = partialRef.current;
    if (!partial || !partial.sourceText) return false;
    const speaker = turnRef.current;
    const entry: TalkEntry = {
      id: partial.id,
      speaker,
      sourceText: partial.sourceText,
      targetText: partial.targetText,
      at: Date.now(),
      approximate: true,
    };
    setEntries((prev) => [...prev, entry]);
    if (speaker === 'me' && entry.targetText) void speak(entry.targetText, 'es');
    return true;
  }, []);

  // Server messages → live partial + turn completion on final.
  useEffect(() => {
    return connection.subscribe((msg) => {
      if (msg.type === 'session.ready') {
        if (readyTimer.current) {
          clearTimeout(readyTimer.current);
          readyTimer.current = null;
        }
        return;
      }
      if (msg.type === 'caption.partial') {
        if (phaseRef.current === 'recording') setPartial(msg.caption);
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
        clearTimers();
        setPartial(null);
        setPhase('asr-error');
      }
    });
  }, [clearTimers, connection, finishTurn, setPartial, teardownMic]);

  // A dropped socket mid-turn must not leave a zombie session: salvage the
  // partial if we have one, then reset. The connection chip explains why.
  useEffect(() => {
    if (connection.status === 'connected') return;
    if (phaseRef.current === 'recording' || phaseRef.current === 'processing') {
      commitPartialAsEntry();
      teardownMic();
      clearTimers();
      setPartial(null);
      setPhase('idle');
    }
  }, [clearTimers, commitPartialAsEntry, connection.status, setPartial, teardownMic]);

  /** Begin recording the current turn's single utterance. */
  const startRecording = useCallback(() => {
    if (phaseRef.current === 'recording' || phaseRef.current === 'processing') return;
    cancelSpeech();
    const speaking = turnRef.current;
    const mic = new MicStream();
    const sent = connection.sendMessage({
      type: 'session.start',
      mode: 'talk',
      sourceLang: speaking === 'me' ? 'en' : 'es',
      targetLang: speaking === 'me' ? 'es' : 'en',
      audio: { encoding: 'pcm16', sampleRate: mic.sampleRate, channels: 1 },
    });
    if (!sent) {
      // Socket is down — the chip already says so; don't fake a recording.
      setPhase('idle');
      return;
    }
    setPhase('recording');
    setPartial(null);
    micRef.current = mic;
    holdWakeLock();
    // If the server never acks (session.start lost on a dying socket),
    // fail honestly instead of recording into the void.
    readyTimer.current = setTimeout(() => {
      if (phaseRef.current === 'recording') {
        teardownMic();
        setPartial(null);
        setPhase('asr-error');
      }
    }, SESSION_READY_TIMEOUT_MS);
    mic
      .start((chunk) => {
        connection.sendBinary(chunk);
      })
      .catch((err) => {
        micRef.current = null;
        void mic.stop();
        releaseWakeLock();
        clearTimers();
        connection.sendMessage({ type: 'session.stop' });
        if (err instanceof MicFailureError && err.reason === 'denied') setPhase('mic-denied');
        else if (err instanceof MicFailureError && err.reason === 'no-mic')
          setPhase('mic-unavailable');
        else setPhase('idle');
      });
  }, [clearTimers, connection, setPartial, teardownMic]);

  /** Done talking — flush the final (entry lands via caption.final). */
  const stopRecording = useCallback(() => {
    if (phaseRef.current !== 'recording') return;
    teardownMic();
    const sent = connection.sendMessage({ type: 'session.stop' });
    if (!sent) {
      // Dead socket: salvage what we heard rather than dropping the turn.
      commitPartialAsEntry();
      clearTimers();
      setPartial(null);
      setPhase('idle');
      return;
    }
    setPhase('processing');
    processingTimer.current = setTimeout(() => {
      if (phaseRef.current === 'processing') {
        // Final never arrived (flaky link) — salvage the partial.
        commitPartialAsEntry();
        setPartial(null);
        setPhase('idle');
      }
    }, PROCESSING_TIMEOUT_MS);
  }, [clearTimers, commitPartialAsEntry, connection, setPartial, teardownMic]);

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
    void speak(entry.speaker === 'me' ? entry.targetText : entry.sourceText, 'es');
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      teardownMic();
      cancelSpeech();
      clearTimers();
    };
  }, [clearTimers, teardownMic]);

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
