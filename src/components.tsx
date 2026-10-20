import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Pause, Play, Timer as TimerIcon } from "lucide-react";
import { timeLeft } from "./engine";
import type { Timer } from "./types";
export function RevealCard({
  name,
  word,
  onContinue,
  last,
}: {
  name: string;
  word: string;
  onContinue: () => void;
  last: boolean;
}) {
  const [lift, setLift] = useState(0),
    [seen, setSeen] = useState(false),
    [closing, setClosing] = useState(false);
  const liftRef = useRef(0);
  const origin = useRef<number | null>(null),
    seenRef = useRef(false),
    locked = useRef(false),
    card = useRef<HTMLDivElement>(null),
    closeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const threshold = () =>
    Math.min(144, (card.current?.clientHeight || 300) * 0.47);
  const active = lift >= threshold();
  const close = () => {
    origin.current = null;
    if (liftRef.current === 0) return;
    liftRef.current = 0;
    setLift(0);
    setClosing(true);
    clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => {
      setClosing(false);
      if (seenRef.current) setSeen(true);
    }, 240);
  };
  useEffect(() => {
    const hide = () => close();
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
      clearTimeout(closeTimeout.current);
    };
  }, []);
  const move = (n: number) => {
    liftRef.current = n;
    setLift(n);
    if (n >= threshold()) seenRef.current = true;
  };
  return (
    <div className="reveal-wrap">
      <div className="eyebrow">ĐẾN LƯỢT</div>
      <h1 className="player-name">{name}</h1>
      <p className="muted">Đảm bảo chỉ bạn nhìn màn hình</p>
      <div
        ref={card}
        className="secret-zone"
        tabIndex={0}
        role="button"
        aria-label="Kéo lên và giữ để xem từ. Bàn phím: giữ phím cách hoặc mũi tên lên, thả để che."
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          origin.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
          setClosing(false);
          clearTimeout(closeTimeout.current);
        }}
        onPointerMove={(e) => {
          if (origin.current !== null)
            move(Math.max(0, Math.min(220, origin.current - e.clientY)));
        }}
        onPointerUp={close}
        onPointerCancel={close}
        onLostPointerCapture={close}
        onBlur={close}
        onKeyDown={(e) => {
          if ([" ", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            if (!e.repeat) {
              setClosing(false);
              clearTimeout(closeTimeout.current);
              move(threshold() + 30);
            }
          }
        }}
        onKeyUp={(e) => {
          if ([" ", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            close();
          }
        }}
      >
        <div className="secret-under" aria-live="off">
          {active && (
            <>
              <span>Từ của bạn</span>
              <strong
                style={
                  word.length > 26
                    ? { fontSize: word.length > 50 ? 18 : 23 }
                    : undefined
                }
                data-testid="secret-word"
              >
                {word}
              </strong>
              <small>Thả tay để che từ</small>
            </>
          )}
        </div>
        <div
          className={`secret-cover ${closing ? "closing" : ""}`}
          style={{ transform: `translateY(-${lift}px)` }}
        >
          <div className="mini-brand">
            imposter<span>✳</span>
          </div>
          <div className="fingerprint">
            <ArrowUp size={38} />
          </div>
          <strong>{seen ? "Vuốt lên để xem lại" : "Vuốt lên để xem từ"}</strong>
          <small>Kéo lên và giữ · Thả tay để che</small>
          <div className="grip" />
        </div>
      </div>
      {seen && !lift && !closing ? (
        <>
          <p className="seen">
            <Check size={16} /> Bạn đã xem từ
          </p>
          <button
            className="btn primary full"
            onClick={() => {
              if (locked.current) return;
              locked.current = true;
              onContinue();
            }}
          >
            {last ? "Bắt đầu chơi" : "Continue"} <span>→</span>
          </button>
        </>
      ) : (
        <p className="swipe-note">
          <ArrowUp size={15} />{" "}
          {active
            ? "Giữ tay để đọc từ"
            : "Vuốt thẻ lên, giữ và ghi nhớ từ của bạn"}
        </p>
      )}
      <p className="tiny">Bàn phím: giữ phím cách hoặc ↑ để xem, thả để che.</p>
    </div>
  );
}
export function Countdown({
  value,
  enabled,
  onPause,
  sound,
}: {
  value: Timer;
  enabled: boolean;
  onPause: () => void;
  sound: boolean;
}) {
  const [left, setLeft] = useState(() => timeLeft(value));
  const rang = useRef(false);
  useEffect(() => {
    rang.current = false;
    const tick = () => {
      const ms = timeLeft(value);
      setLeft(ms);
      if (ms === 0 && !rang.current && enabled && !value.paused) {
        rang.current = true;
        if (sound) {
          try {
            const Audio =
              window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new Audio();
            const o = ctx.createOscillator(),
              gain = ctx.createGain();
            gain.gain.value = 0.06;
            o.frequency.value = 660;
            o.connect(gain);
            gain.connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + 0.18);
            o.onended = () => void ctx.close();
          } catch {}
        }
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [value, enabled, sound]);
  if (!enabled)
    return (
      <div className="timer-off">
        <TimerIcon size={18} /> Không giới hạn thời gian
      </div>
    );
  const sec = Math.ceil(left / 1000);
  return (
    <div className={`countdown ${!left ? "expired" : ""}`}>
      <TimerIcon size={20} />
      <strong>
        {Math.floor(sec / 60)
          .toString()
          .padStart(2, "0")}
        :{(sec % 60).toString().padStart(2, "0")}
      </strong>
      <button
        className="icon-btn"
        aria-label={value.paused ? "Tiếp tục đồng hồ" : "Tạm dừng đồng hồ"}
        onClick={onPause}
      >
        {value.paused ? <Play size={20} /> : <Pause size={20} />}
      </button>
      {!left && (
        <small role="status">Hết giờ · Nhóm chủ động chuyển bước</small>
      )}
    </div>
  );
}
