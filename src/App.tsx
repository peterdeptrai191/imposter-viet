import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Users,
  Settings as SettingsIcon,
  History,
  Home,
  Plus,
  Trash2,
  Copy,
  Search,
  Download,
  Upload,
  Check,
  X,
  ChevronRight,
  Shield,
  Shuffle,
  Smartphone,
  WifiOff,
  EyeOff,
  Flag,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { builtin, topics, difficultyLabel } from "./data";
import {
  clean,
  norm,
  type Store,
  type Pair,
  type Game,
  type Settings,
} from "./types";
import {
  choosePair,
  createGame,
  filterPairs,
  maxImposters,
  secret,
  transition,
  validTargets,
  validateNames,
  type Action,
  civilianWord,
} from "./engine";
import { fresh, loadStore, previewImport, saveStore } from "./storage";
import { Countdown, RevealCard } from "./components";
type Page =
  | "home"
  | "players"
  | "setup"
  | "game"
  | "words"
  | "history"
  | "settings"
  | "guide";
const uid = () => crypto.randomUUID();
function BellaLogo({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "bella-sticker small" : "bella-sticker"}>
      <img src="/bella/logo.png" alt="BELLA TEAM" width="552" height="540" />
    </span>
  );
}
function App() {
  const [store, setStore] = useState<Store>(loadStore),
    [page, setPage] = useState<Page>(() =>
      store.game && store.game.stage !== "ended" ? "game" : "home",
    ),
    [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState<{ text: string; run: () => void } | null>(
      null,
    ),
    [historyGame, setHistoryGame] = useState<Game | null>(null);
  const live = useRef(store);
  live.current = store;
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setMessage(
        "Chưa thể chuẩn bị chế độ ngoại tuyến. Hãy giữ kết nối và tải lại sau.",
      ),
  });
  const [controlled, setControlled] = useState(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  const readyOffline = offlineReady || controlled;
  useEffect(() => {
    const updateControl = () =>
      setControlled(Boolean(navigator.serviceWorker?.controller));
    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      updateControl,
    );
    return () =>
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        updateControl,
      );
  }, []);
  useEffect(() => {
    if (!saveStore(store))
      setMessage(
        "Không lưu được trên thiết bị: bộ nhớ đầy hoặc trình duyệt chặn lưu. Ván vẫn chơi được khi đang mở app.",
      );
  }, [store]);
  useEffect(() => {
    if (store.notice) setMessage(store.notice);
  }, []);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 6500);
    return () => clearTimeout(id);
  }, [message]);
  const update = (fn: (s: Store) => Store) =>
    setStore((s) => {
      const next = fn(s);
      live.current = next;
      return next;
    });
  const act = (a: Omit<Action, "rev">) => {
    const old = live.current.game;
    if (!old) return;
    const next = transition(old, { ...a, rev: old.rev });
    if (next === old) return;
    const saved = {
      ...live.current,
      game: next,
      history:
        next.stage === "ended"
          ? [
              next,
              ...live.current.history.filter((h) => h.id !== next.id),
            ].slice(0, 50)
          : live.current.history,
    };
    live.current = saved;
    if (!saveStore(saved))
      setMessage("Không thể lưu tiến trình trên trình duyệt này.");
    setStore(saved);
  };
  const begin = () => {
    const s = live.current,
      err = validateNames(s.names);
    if (err) {
      setMessage(err);
      setPage("players");
      return;
    }
    try {
      const picked = choosePair(
        filterPairs([...builtin, ...s.custom], s.settings),
        s.used,
      );
      const g = createGame(s.names, s.settings, picked.pair, s.roles);
      const roles = { ...s.roles };
      g.players.forEach(
        (p) =>
          (roles[norm(p.name)] = p.imposter
            ? (roles[norm(p.name)] || 0) + 1
            : 0),
      );
      update((v) => ({
        ...v,
        game: g,
        used: [...picked.used, picked.pair.id],
        roles,
      }));
      setPage("game");
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const newGame = () => {
    if (store.game && store.game.stage !== "ended") {
      setConfirm({
        text: "Hủy ván đang chơi để bắt đầu ván mới? Tiến trình ván này sẽ mất.",
        run: () => {
          update((s) => ({ ...s, game: null }));
          setPage("players");
        },
      });
    } else setPage("players");
  };
  const navItems: { page: Page; label: string; icon: ReactNode }[] = [
    { page: "home", label: "Trang chủ", icon: <Home size={19} /> },
    { page: "words", label: "Kho từ", icon: <BookOpen size={19} /> },
    { page: "history", label: "Lịch sử", icon: <History size={19} /> },
    { page: "settings", label: "Cài đặt", icon: <SettingsIcon size={19} /> },
  ];
  const nav = (p: Page) => {
    setPage(p);
    setHistoryGame(null);
    window.scrollTo(0, 0);
  };
  const ongoing = store.game && store.game.stage !== "ended";
  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => nav("home")}>
          BELLA <span>/</span> IMPOSTER
          <small>CÙNG HỘI. CHÁY HẾT MÌNH!</small>
        </button>
        <nav>
          {navItems.map((n) => (
            <button
              key={n.page}
              className={page === n.page ? "nav active" : "nav"}
              onClick={() => nav(n.page)}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>
        <span className="local-badge">
          <span /> Chơi cùng nhau
        </span>
      </header>
      {message && (
        <div className="toast" role="status">
          {message}
          <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
            <X size={17} />
          </button>
        </div>
      )}
      {needRefresh && (
        <div className="update-banner">
          Đã có phiên bản mới.{" "}
          {ongoing ? (
            "Bạn có thể cập nhật sau khi kết thúc ván."
          ) : (
            <button onClick={() => void updateServiceWorker(true)}>
              Cập nhật ứng dụng →
            </button>
          )}
        </div>
      )}
      {page === "home" && (
        <main className="page home-page">
          <div className="hero-top">
            <span className="eyebrow">MỘT CHIẾC MÁY · CẢ HỘI CÙNG CHƠI</span>
            <button className="text-btn" onClick={() => nav("guide")}>
              Luật chơi <ArrowRight size={16} />
            </button>
          </div>
          <section className="hero">
            <div className="hero-copy">
              <h1>
                Cùng hội.
                <br />
                Cháy hết mình!
              </h1>
              <p>
                Một từ khác biệt. Một hội bạn đáng ngờ.
                <br />
                Ai sẽ bị lộ trước?
              </p>
              <div className="hero-tags">
                <span>
                  <Users size={15} /> 3–20 người
                </span>
                <span>
                  <Smartphone size={15} /> 1 thiết bị
                </span>
                <span>
                  <WifiOff size={15} /> Offline
                </span>
              </div>
            </div>
            <div className="hero-art">
              <span className="collage-card collage-pink" aria-hidden="true">
                SHHH…
              </span>
              <span className="collage-card collage-blue" aria-hidden="true">
                AI ĐÓ?
              </span>
              <BellaLogo />
            </div>
          </section>
          <section className="launch-grid">
            <button className="play-card" onClick={newGame}>
              <span className="play-icon">
                <Play fill="currentColor" size={28} />
              </span>
              <span>
                <strong>CHƠI NGAY</strong>
                <small>Tập hợp hội bạn. Bắt đầu nghi ngờ.</small>
              </span>
              <ArrowRight size={30} />
            </button>
            <button
              className="group-card"
              onClick={() => nav(ongoing ? "game" : "players")}
            >
              <span className="avatar-stack">
                <i>M</i>
                <i>?</i>
                <i>+</i>
              </span>
              <span>
                <strong>
                  {ongoing ? "Tiếp tục ván đang chơi" : "Hội bạn của bạn"}
                </strong>
                <small>
                  {ongoing
                    ? `Vòng ${store.game!.round} · ${store.game!.players.filter((p) => p.alive).length} người còn chơi`
                    : `${store.names.length} người · Sẵn sàng vào cuộc`}
                </small>
              </span>
              <ChevronRight size={21} />
            </button>
          </section>
          <section className="home-bottom">
            <div>
              <div className="section-heading">
                <h2>Đơn giản để chơi. Khó để tin.</h2>
                <span>03 BƯỚC</span>
              </div>
              <div className="steps">
                <div>
                  <span>01</span>
                  <EyeOff />
                  <h3>Nhận từ bí mật</h3>
                  <p>
                    Chuyền máy, vuốt để xem.
                    <br />
                    Chỉ mình bạn được biết.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <Users />
                  <h3>Nói ít, đoán nhiều</h3>
                  <p>
                    Mô tả từ bằng một câu.
                    <br />
                    Nghe kỹ ai đang khác biệt.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <Flag />
                  <h3>Bỏ phiếu tìm người</h3>
                  <p>
                    Tin trực giác của bạn.
                    <br />
                    Hay bạn vừa bị đánh lừa?
                  </p>
                </div>
              </div>
            </div>
            <button className="word-feature" onClick={() => nav("words")}>
              <span className="eyebrow">KHÔNG LO HẾT CHUYỆN</span>
              <BookOpen size={30} />
              <strong>
                {new Set(
                  builtin.flatMap((p) => [norm(p.a), norm(p.b)]),
                ).size.toLocaleString("vi-VN")}
                <span> từ & cụm từ</span>
              </strong>
              <p>
                {topics.length} chủ đề từ đời thường đến bất ngờ.
                <br />
                Mỗi ván là một lần thử lòng tin.
              </p>
              <span className="text-link">
                Khám phá kho từ <ArrowRight size={16} />
              </span>
            </button>
          </section>
          <footer>
            <span>✳ Càng thân, càng khó đoán.</span>
            <span>
              {readyOffline
                ? "Đã sẵn sàng ngoại tuyến"
                : "Dữ liệu lưu trên thiết bị của bạn"}
            </span>
          </footer>
        </main>
      )}
      {page === "players" && (
        <main className="page narrow">
          <Back onClick={() => nav("home")} />
          <Heading
            tag="01 / CHUẨN BỊ"
            title="Hội hôm nay có ai?"
            desc="Nhập tên để mỗi lượt chuyền máy đều đúng người."
          />
          <div className="panel">
            <div className="section-heading">
              <h2>
                <Users size={21} /> {store.names.length} người chơi
              </h2>
              <button
                className="text-btn"
                onClick={() =>
                  update((s) => ({
                    ...s,
                    names: s.names.map(
                      (n, i) => clean(n) || `Người chơi ${i + 1}`,
                    ),
                  }))
                }
              >
                Dùng tên nhanh
              </button>
            </div>
            <div className="name-grid">
              {store.names.map((n, i) => (
                <div className="name-input" key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <input
                    aria-label={`Tên người chơi ${i + 1}`}
                    placeholder={`Người chơi ${i + 1}`}
                    value={n}
                    maxLength={35}
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        names: s.names.map((v, j) =>
                          j === i ? e.target.value : v,
                        ),
                      }))
                    }
                  />
                  <button
                    aria-label={`Xóa người chơi ${i + 1}`}
                    disabled={store.names.length <= 3}
                    onClick={() =>
                      update((s) => {
                        const names = s.names.filter((_, j) => j !== i),
                          count = Math.min(
                            s.settings.imposters,
                            maxImposters(names.length),
                          );
                        if (count !== s.settings.imposters)
                          setMessage(
                            `Đã điều chỉnh còn ${count} imposter cho ${names.length} người.`,
                          );
                        return {
                          ...s,
                          names,
                          settings: { ...s.settings, imposters: count },
                        };
                      })
                    }
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn dashed full"
              disabled={store.names.length >= 20}
              onClick={() => update((s) => ({ ...s, names: [...s.names, ""] }))}
            >
              <Plus size={18} /> Thêm người chơi
            </button>
          </div>
          <GroupManager store={store} update={update} notify={setMessage} />
          <button
            className="btn primary full"
            onClick={() => {
              const err = validateNames(store.names);
              if (err) setMessage(err);
              else nav("setup");
            }}
          >
            Tiếp tục thiết lập <ArrowRight size={19} />
          </button>
        </main>
      )}
      {page === "setup" && (
        <main className="page narrow">
          <Back onClick={() => nav("players")} />
          <Heading
            tag="02 / THIẾT LẬP"
            title="Ván này chơi sao?"
            desc="Chọn cách chơi hợp với hội của bạn."
          />
          <Setup
            settings={store.settings}
            count={store.names.length}
            custom={store.custom}
            onChange={(settings) => update((s) => ({ ...s, settings }))}
          />
          <button
            className="btn primary full"
            disabled={
              !filterPairs([...builtin, ...store.custom], store.settings).length
            }
            onClick={begin}
          >
            Phát từ bí mật <ArrowRight size={20} />
          </button>
        </main>
      )}
      {page === "game" &&
        (store.game ? (
          <main className="page game-page">
            <div className="game-top">
              <button className="text-btn" onClick={() => nav("home")}>
                <ArrowLeft size={17} /> Trang chủ
              </button>
              <span>
                VÒNG {store.game.round} <i />{" "}
                {store.game.players.filter((p) => p.alive).length} NGƯỜI CÒN
                CHƠI
              </span>
              <button
                className="text-btn"
                onClick={() =>
                  setConfirm({
                    text: "Hủy ván này? Các từ đã dùng và lịch sử phân vai vẫn được giữ.",
                    run: () => {
                      update((s) => ({ ...s, game: null }));
                      nav("home");
                    },
                  })
                }
              >
                Hủy ván
              </button>
            </div>
            <GameView
              key={store.game.id}
              g={store.game}
              act={act}
              replay={begin}
              change={() => nav("setup")}
              home={() => nav("home")}
              rate={(v) =>
                update((s) => ({
                  ...s,
                  ratings: { ...s.ratings, [store.game!.pair.id]: v },
                }))
              }
              rating={store.ratings[store.game.pair.id]}
            />
          </main>
        ) : (
          <Empty
            title="Chưa có ván đang chơi"
            action="Bắt đầu một ván"
            onClick={newGame}
          />
        ))}
      {page === "words" && (
        <WordLibrary
          custom={store.custom}
          update={update}
          notify={setMessage}
          confirm={setConfirm}
        />
      )}
      {page === "guide" && (
        <main className="page narrow">
          <Back onClick={() => nav("home")} />
          <Heading
            tag="CẨM NANG HỘI BẠN"
            title="Chơi hết mình. Giấu thật kỹ."
          />
          <div className="panel prose">
            <h2>Một máy, hai từ, nhiều nghi ngờ</h2>
            <p>
              Đa số nhận cùng từ A; các imposter cùng nhận từ B có liên quan.
              Không ai được báo vai trò hoặc biết đồng đội.
            </p>
            <ol>
              <li>Nhập 3–20 người, chọn số imposter ít hơn dân thường.</li>
              <li>
                Chuyền máy đúng tên. Vuốt thẻ lên và giữ để xem từ, thả để che.
                Khi đóng kín, chọn Continue.
              </li>
              <li>
                Mỗi người còn sống mô tả bằng một câu ngắn, không nói trực tiếp
                từ bí mật. Nhóm thảo luận rồi chuyền máy bỏ phiếu kín.
              </li>
              <li>
                Không tự bầu. Người nhiều phiếu nhất bị loại và được công bố
                vai, chưa công bố từ. Người bị loại không mô tả hoặc bỏ phiếu
                nữa.
              </li>
            </ol>
            <h2>Ai thắng?</h2>
            <p>
              <strong>Dân thường thắng</strong> khi tất cả imposter đã bị loại.{" "}
              <strong>Imposter thắng</strong> khi số imposter còn sống lớn hơn
              hoặc bằng số dân thường còn sống.
            </p>
            <h2>Lượt đoán lật kèo</h2>
            <p>
              Nếu bật, chỉ imposter cuối cùng vừa bị loại được đoán từ dân
              thường đúng một lần. Đoán đúng, cả phe imposter thắng. Nhóm có thể
              xác nhận đáp án tương đương khi máy chưa nhận. Những người đã bị
              loại không được gợi ý.
            </p>
            <h2>Nếu hòa phiếu</h2>
            <p>
              Các ứng viên hòa giải thích thêm, sau đó mọi người còn sống bỏ
              phiếu lại chỉ giữa họ, vẫn không tự bầu. Nếu không có ai hợp lệ để
              bầu, lượt đó được bỏ qua. Hòa lần nữa: không loại ai, bắt đầu vòng
              mô tả mới.
            </p>
            <h2>Giữ bí mật cùng nhau</h2>
            <p>
              Để người trước thả tay và che từ trước khi chuyền máy. Đây là trò
              chơi trên thiết bị chung; sự công bằng cần tinh thần của cả nhóm.
            </p>
            <h2>Cài trên điện thoại</h2>
            <p>
              Mở bản đã triển khai bằng HTTPS. Trên Chrome Android chọn menu →
              Thêm vào màn hình chính/Cài đặt ứng dụng. Trên Safari iPhone chọn
              Chia sẻ → Thêm vào màn hình chính. Đợi lần tải đầu hoàn tất trước
              khi thử tắt mạng.
            </p>
          </div>
          <button className="btn primary full" onClick={newGame}>
            Đã hiểu, vào ván thôi <ArrowRight size={19} />
          </button>
        </main>
      )}
      {page === "history" && (
        <main className="page narrow">
          <Heading
            tag="NHỮNG LẦN THỬ LÒNG TIN"
            title="Lịch sử cuộc chơi"
            desc="Lưu tối đa 50 ván đã kết thúc trên trình duyệt này."
          />
          {historyGame ? (
            <>
              <Back onClick={() => setHistoryGame(null)} />
              <Results g={historyGame} />
            </>
          ) : store.history.length ? (
            <div className="list">
              {store.history.map((g) => (
                <button
                  className="history-row"
                  key={g.id}
                  onClick={() => setHistoryGame(g)}
                >
                  <span className="history-icon">
                    <Flag size={22} />
                  </span>
                  <span>
                    <strong>
                      {g.winner === "civilian" ? "Dân thường" : "Imposter"}{" "}
                      chiến thắng
                    </strong>
                    <small>
                      {new Date(g.createdAt).toLocaleString("vi-VN")} ·{" "}
                      {g.players.length} người · {g.round} vòng
                    </small>
                  </span>
                  <ChevronRight size={20} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="Chưa có ván nào kết thúc"
              desc="Những màn suy luận đáng nhớ sẽ ở đây."
              action="Bắt đầu ván đầu tiên"
              onClick={newGame}
            />
          )}
        </main>
      )}
      {page === "settings" && (
        <main className="page narrow">
          <Heading tag="THEO CÁCH CỦA HỘI BẠN" title="Cài đặt" />
          <div className="panel">
            <Toggle
              title="Âm thanh báo hết giờ"
              desc="Một tiếng báo nhẹ, không tự chuyển lượt."
              value={store.settings.sound}
              onChange={(sound) =>
                update((s) => ({ ...s, settings: { ...s.settings, sound } }))
              }
            />
            <div className="storage-info">
              <Shield size={25} />
              <div>
                <h3>Dữ liệu ở trên thiết bị này</h3>
                <p>
                  Nhóm bạn, tiến trình, lịch sử và từ tự tạo lưu trong trình
                  duyệt hiện tại. Không tự đồng bộ sang thiết bị khác. Chế độ ẩn
                  danh hoặc xóa dữ liệu trình duyệt có thể làm mất dữ liệu.
                </p>
              </div>
            </div>
            <div className="storage-info">
              <WifiOff size={25} />
              <div>
                <h3>
                  {readyOffline ? "Sẵn sàng ngoại tuyến" : "Chế độ ngoại tuyến"}
                </h3>
                <p>
                  Sau khi bản production tải và lưu cache thành công, bạn có thể
                  mở lại không cần mạng. Bản dev không hỗ trợ offline. Cập nhật
                  chỉ được áp dụng khi bạn chủ động chọn ngoài ván.
                </p>
              </div>
            </div>
            <button
              className="btn danger"
              onClick={() =>
                setConfirm({
                  text: "Xóa toàn bộ dữ liệu trên trình duyệt này, gồm nhóm, ván, lịch sử và cặp tự tạo? Không thể hoàn tác.",
                  run: () => {
                    update(() => fresh());
                    setMessage("Đã xóa dữ liệu và khôi phục mặc định.");
                  },
                })
              }
            >
              <Trash2 size={17} /> Xóa toàn bộ dữ liệu
            </button>
          </div>
          <button className="btn secondary full" onClick={() => nav("guide")}>
            <BookOpen size={19} /> Xem hướng dẫn chơi
          </button>
          <p className="tiny center">BELLA / IMPOSTER · PHIÊN BẢN 1.1</p>
        </main>
      )}
      <nav className="bottom-nav">
        {navItems.map((n) => (
          <button
            key={n.page}
            className={page === n.page ? "active" : ""}
            onClick={() => nav(n.page)}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {confirm && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">Bạn chắc chứ?</h2>
            <p>{confirm.text}</p>
            <div className="button-row">
              <button
                autoFocus
                className="btn secondary"
                onClick={() => setConfirm(null)}
              >
                Giữ lại
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  confirm.run();
                  setConfirm(null);
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function Heading({
  tag,
  title,
  desc,
}: {
  tag: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="heading">
      <span className="eyebrow">{tag}</span>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
  );
}
function Back({ onClick }: { onClick: () => void }) {
  return (
    <button className="text-btn back" onClick={onClick}>
      <ArrowLeft size={16} /> Quay lại
    </button>
  );
}
function Empty({
  title,
  desc,
  action,
  onClick,
}: {
  title: string;
  desc?: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="empty">
      <BellaLogo small />
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
      <button className="btn primary" onClick={onClick}>
        {action}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
function Toggle({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{title}</strong>
        {desc && <small>{desc}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function GroupManager({
  store,
  update,
  notify,
}: {
  store: Store;
  update: (f: (s: Store) => Store) => void;
  notify: (s: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="panel">
      <h3>Lưu hội bạn cho lần sau</h3>
      <div className="inline-form">
        <input
          aria-label="Tên nhóm bạn"
          placeholder="Ví dụ: Hội tối thứ bảy"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn secondary"
          onClick={() => {
            const err = validateNames(store.names);
            if (err) {
              notify(err);
              return;
            }
            if (!clean(name)) {
              notify("Hãy đặt tên cho nhóm.");
              return;
            }
            update((s) => ({
              ...s,
              groups: [
                ...s.groups,
                { id: uid(), name: clean(name), names: s.names.map(clean) },
              ],
            }));
            setName("");
            notify("Đã lưu nhóm bạn.");
          }}
        >
          Lưu nhóm
        </button>
      </div>
      {store.groups.map((g) => (
        <div className="saved-group" key={g.id}>
          <button
            className="text-btn"
            onClick={() => {
              update((s) => ({
                ...s,
                names: g.names,
                settings: {
                  ...s.settings,
                  imposters: Math.min(
                    s.settings.imposters,
                    maxImposters(g.names.length),
                  ),
                },
              }));
              notify(
                `Đã chọn nhóm ${g.name}. Số imposter được điều chỉnh nếu cần.`,
              );
            }}
          >
            <Users size={16} />
            {g.name} <small>{g.names.length} người</small>
          </button>
          <button
            className="icon-btn"
            aria-label={`Xóa nhóm ${g.name}`}
            onClick={() =>
              update((s) => ({
                ...s,
                groups: s.groups.filter((v) => v.id !== g.id),
              }))
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
function Setup({
  settings: s,
  count,
  custom,
  onChange,
}: {
  settings: Settings;
  count: number;
  custom: Pair[];
  onChange: (s: Settings) => void;
}) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...s, [key]: value });
  const available = filterPairs([...builtin, ...custom], s).length;
  return (
    <>
      <div className="panel">
        <div className="summary">
          <Users size={22} />
          <strong>
            {count} người · {s.imposters} imposter · {count - s.imposters} dân
            thường
          </strong>
        </div>
        <label className="field">
          Số imposter{" "}
          <select
            value={s.imposters}
            onChange={(e) => set("imposters", +e.target.value)}
          >
            {Array.from({ length: maxImposters(count) }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} imposter
              </option>
            ))}
          </select>
        </label>
        <p className="callout">
          Dân thường thắng khi loại hết imposter. Imposter thắng khi số người
          còn sống của phe mình bằng hoặc vượt dân thường.
        </p>
      </div>
      <div className="panel">
        <h2>Cặp từ cho ván này</h2>
        <div className="two-cols">
          <label className="field">
            Độ khó
            <select
              value={s.difficulty}
              onChange={(e) =>
                set("difficulty", e.target.value as Settings["difficulty"])
              }
            >
              {Object.entries(difficultyLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nguồn từ
            <select
              value={s.source}
              onChange={(e) =>
                set("source", e.target.value as Settings["source"])
              }
            >
              <option value="builtin">Có sẵn</option>
              <option value="custom">Tự tạo</option>
              <option value="both">Kết hợp</option>
            </select>
          </label>
        </div>
        <div className="section-heading">
          <h3>Chủ đề</h3>
          <button className="text-btn" onClick={() => set("topics", [])}>
            Chọn tất cả
          </button>
        </div>
        <div className="chips">
          <button
            className={!s.topics.length ? "chip selected" : "chip"}
            onClick={() => set("topics", [])}
          >
            Tất cả
          </button>
          {[...new Set([...topics, ...custom.map((p) => p.topic)])].map((t) => (
            <button
              className={s.topics.includes(t) ? "chip selected" : "chip"}
              key={t}
              onClick={() =>
                set(
                  "topics",
                  s.topics.includes(t)
                    ? s.topics.filter((v) => v !== t)
                    : [...s.topics, t],
                )
              }
            >
              {t}
            </button>
          ))}
        </div>
        <p className={available ? "pool-count" : "error"}>
          {available ? (
            <>
              <Check size={16} /> {available} cặp từ phù hợp · Tự tránh lặp đến
              khi dùng hết
            </>
          ) : (
            "Không có cặp phù hợp. Chọn thêm chủ đề, đổi độ khó/nguồn từ hoặc thêm cặp tự tạo."
          )}
        </p>
      </div>
      <div className="panel">
        <h2>Nhịp độ cuộc chơi</h2>
        <Toggle
          title="Đồng hồ đếm ngược"
          value={s.timers}
          onChange={(v) => set("timers", v)}
        />
        {s.timers && (
          <div className="two-cols">
            <label className="field">
              Mô tả (giây/người)
              <input
                type="number"
                min="5"
                max="180"
                value={s.describeSeconds}
                onChange={(e) =>
                  set(
                    "describeSeconds",
                    Math.max(5, Math.min(180, +e.target.value)),
                  )
                }
              />
            </label>
            <label className="field">
              Thảo luận (giây)
              <input
                type="number"
                min="15"
                max="600"
                value={s.discussSeconds}
                onChange={(e) =>
                  set(
                    "discussSeconds",
                    Math.max(15, Math.min(600, +e.target.value)),
                  )
                }
              />
            </label>
          </div>
        )}
        <Toggle
          title="Đoán từ để lật kèo"
          desc="Chỉ imposter cuối cùng vừa bị loại được đoán một lần."
          value={s.lastGuess}
          onChange={(v) => set("lastGuess", v)}
        />
        <Toggle
          title="Giảm lặp vai imposter"
          desc="Giảm xác suất nhận vai liên tiếp, không bảo đảm miễn vai."
          value={s.reduceRepeat}
          onChange={(v) => set("reduceRepeat", v)}
        />
      </div>
    </>
  );
}
function GameView({
  g,
  act,
  replay,
  change,
  home,
  rate,
  rating,
}: {
  g: Game;
  act: (a: Omit<Action, "rev">) => void;
  replay: () => void;
  change: () => void;
  home: () => void;
  rate: (s: string) => void;
  rating?: string;
}) {
  const [open, setOpen] = useState(false),
    [target, setTarget] = useState(""),
    [answer, setAnswer] = useState("");
  const guard = useRef(false);
  useEffect(() => {
    setOpen(false);
    setTarget("");
    guard.current = false;
  }, [g.rev]);
  const name = (id: string) => g.players.find((p) => p.id === id)?.name || "";
  const eliminated = g.players.find((p) => p.id === g.eliminated);
  const ballot = () => {
    if (guard.current || !target) return;
    guard.current = true;
    act({ type: "ballot", target });
  };
  if (g.stage === "reveal")
    return (
      <>
        <div className="progress-label">
          PHÁT TỪ BÍ MẬT{" "}
          <span>
            {g.cursor + 1} / {g.players.length}
          </span>
        </div>
        <div className="progress">
          <i style={{ width: `${(g.cursor / g.players.length) * 100}%` }} />
        </div>
        <RevealCard
          key={g.cursor}
          name={g.players[g.cursor].name}
          word={secret(g, g.players[g.cursor].id)}
          onContinue={() => act({ type: "seen" })}
          last={g.cursor === g.players.length - 1}
        />
      </>
    );
  if (g.stage === "ended")
    return (
      <div className="narrow center">
        <Results g={g} />
        <div className="panel">
          <h3>Cặp từ này thế nào?</h3>
          <div className="chips centered">
            {["Quá dễ", "Vừa hay", "Quá khó"].map((v) => (
              <button
                key={v}
                className={rating === v ? "chip selected" : "chip"}
                onClick={() => rate(v)}
              >
                {rating === v && <Check size={14} />} {v}
              </button>
            ))}
          </div>
        </div>
        <button className="btn primary full" onClick={replay}>
          <Shuffle size={19} /> Chơi lại
        </button>
        <div className="button-row">
          <button className="btn secondary" onClick={change}>
            Đổi thiết lập
          </button>
          <button className="btn secondary" onClick={home}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  return (
    <div className="narrow center">
      <>
        {g.stage === "describe" && (
          <>
            <Heading
              tag={`MÔ TẢ · LƯỢT ${g.cursor + 1}/${g.order.length}`}
              title={name(g.order[g.cursor])}
              desc="Một câu ngắn thôi. Đừng nói ra từ bí mật."
            />
            <div className="phase-art">
              <EyeOff size={62} />
            </div>
            <Countdown
              value={g.timer}
              enabled={g.settings.timers}
              sound={g.settings.sound}
              onPause={() => act({ type: "pause" })}
            />
            <button
              className="btn primary full"
              onClick={() => act({ type: "next" })}
            >
              {g.cursor === g.order.length - 1
                ? "Bắt đầu thảo luận"
                : "Người tiếp theo"}{" "}
              <ArrowRight size={19} />
            </button>
          </>
        )}
        {g.stage === "discuss" && (
          <>
            <Heading
              tag="LẮNG NGHE · NGHI NGỜ · SUY LUẬN"
              title="Ai đang nói khác?"
              desc="So sánh những lời mô tả. Giữ kín từ của mình."
            />
            <div className="phase-art">
              <Users size={62} />
            </div>
            <Countdown
              value={g.timer}
              enabled={g.settings.timers}
              sound={g.settings.sound}
              onPause={() => act({ type: "pause" })}
            />
            <button
              className="btn primary full"
              onClick={() => act({ type: "vote" })}
            >
              Bắt đầu bỏ phiếu <ArrowRight size={19} />
            </button>
          </>
        )}
        {g.stage === "vote" && (
          <>
            <Heading
              tag={`${g.runoff ? "BỎ PHIẾU LẠI" : "BỎ PHIẾU KÍN"} · ${g.cursor + 1}/${g.order.length}`}
              title={name(g.order[g.cursor])}
              desc={
                open
                  ? "Bạn nghi ngờ ai? Không thể bầu chính mình."
                  : "Chuyền máy cho đúng người. Chưa ai được xem lựa chọn."
              }
            />
            {g.runoff && (
              <p className="callout">
                Chỉ bầu ứng viên hòa. Nếu một người không có lựa chọn hợp lệ,
                lượt của họ đã được bỏ qua.
              </p>
            )}
            {!open ? (
              <div className="panel vote-cover">
                <Shield size={55} />
                <p>Phiếu của bạn sẽ được giữ kín.</p>
                <button
                  className="btn primary full"
                  onClick={() => setOpen(true)}
                >
                  Tôi là {name(g.order[g.cursor])} <ArrowRight size={19} />
                </button>
              </div>
            ) : (
              <>
                <div className="candidate-grid">
                  {validTargets(g, g.order[g.cursor]).map((p) => (
                    <button
                      className={
                        target === p.id ? "candidate selected" : "candidate"
                      }
                      key={p.id}
                      onClick={() => setTarget(p.id)}
                    >
                      <span className="avatar">{p.name.slice(0, 1)}</span>
                      {p.name}
                      {target === p.id ? (
                        <Check size={18} />
                      ) : (
                        <span className="radio" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  className="btn primary full"
                  disabled={!target}
                  onClick={ballot}
                >
                  Xác nhận & che phiếu <Check size={18} />
                </button>
                <p className="tiny">
                  Có thể đổi lựa chọn trước khi xác nhận. Phiếu đã xác nhận được
                  khóa.
                </p>
              </>
            )}
          </>
        )}
        {g.stage === "voteResult" && (
          <>
            <Heading
              tag="KẾT QUẢ BỎ PHIẾU"
              title={
                g.candidates.length > 1
                  ? "Chưa thể phân định."
                  : `${name(g.candidates[0])} nhiều phiếu nhất.`
              }
            />
            <VoteCounts g={g} />
            {g.candidates.length > 1 ? (
              <>
                <p className="callout">
                  {g.runoff
                    ? "Vẫn hòa phiếu. Không ai bị loại; cả nhóm bắt đầu vòng mô tả mới."
                    : `Các ứng viên hòa (${g.candidates.map(name).join(", ")}) hãy giải thích thêm trước khi bỏ phiếu lại.`}
                </p>
                <button
                  className="btn primary full"
                  onClick={() => act({ type: "runoff" })}
                >
                  {g.runoff
                    ? "Bắt đầu vòng mới"
                    : "Các ứng viên đã giải thích · Bầu lại"}{" "}
                  <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <button
                className="btn primary full"
                onClick={() => act({ type: "resolve" })}
              >
                Công bố người bị loại <ArrowRight size={18} />
              </button>
            )}
          </>
        )}
        {g.stage === "eliminated" && (
          <>
            <Heading
              tag="MỘT NGƯỜI RỜI CUỘC CHƠI"
              title={eliminated!.name}
              desc={`Là ${eliminated!.imposter ? "imposter" : "dân thường"}. Chưa tiết lộ từ bí mật.`}
            />
            <div className="phase-art">
              <Flag size={60} />
            </div>
            <p className="muted">Người bị loại dừng mô tả và bỏ phiếu.</p>
            <button
              className="btn primary full"
              onClick={() => act({ type: "continue" })}
            >
              Vòng mô tả mới <ArrowRight size={19} />
            </button>
          </>
        )}
        {g.stage === "guess" && (
          <>
            <Heading
              tag="CƠ HỘI LẬT KÈO CUỐI CÙNG"
              title={`${eliminated!.name}, đoán nào!`}
              desc="Bạn là imposter cuối cùng vừa bị loại. Đoán từ của dân thường đúng một lần để cả phe chiến thắng."
            />
            <p className="callout">
              Những người đã bị loại không được gợi ý. Chưa ai được xem đáp án.
            </p>
            <form
              className="panel"
              onSubmit={(e) => {
                e.preventDefault();
                if (!clean(answer) || guard.current) return;
                guard.current = true;
                act({ type: "guess", answer });
              }}
            >
              <label className="field">
                Từ của dân thường là gì?
                <input
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={150}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Nhập một đáp án duy nhất"
                />
              </label>
              <button className="btn primary full" disabled={!clean(answer)}>
                Chốt đáp án <Check size={18} />
              </button>
            </form>
          </>
        )}
        {g.stage === "guessReview" && (
          <>
            <Heading
              tag="NHÓM CÙNG XÁC NHẬN"
              title="Chưa khớp đáp án"
              desc={`Đáp án đã chốt: “${g.guess}”. Không thể nhập lần nữa.`}
            />
            <p className="callout">
              Máy chưa nhận đáp án. Nếu nhóm chắc chắn đây là cách gọi tương
              đương từ dân thường, hãy xác nhận. Đáp án chính xác vẫn được giữ
              kín đến khi chốt kết quả.
            </p>
            <button
              className="btn secondary full"
              onClick={() => act({ type: "acceptGuess" })}
            >
              Nhóm xác nhận đáp án tương đương
            </button>
            <button
              className="btn primary full"
              onClick={() => act({ type: "rejectGuess" })}
            >
              Đáp án sai · Dân thường thắng <ArrowRight size={18} />
            </button>
          </>
        )}
      </>
      <div className="roster">
        <span className="eyebrow">
          HỘI BẠN · {g.players.filter((p) => p.alive).length} CÒN CHƠI
        </span>
        <div className="chips centered">
          {g.players.map((p) => (
            <span key={p.id} className={`person ${!p.alive ? "out" : ""}`}>
              {!p.alive && <X size={13} />} {p.name}
              {!p.alive ? " · Đã loại" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
function VoteCounts({
  g,
  event = g.events.at(-1)!,
}: {
  g: Game;
  event?: Game["events"][number];
}) {
  return (
    <div className="panel vote-counts">
      {Object.entries(event.counts)
        .sort((a, b) => b[1] - a[1])
        .map(([id, c]) => (
          <div key={id}>
            <span>{g.players.find((p) => p.id === id)?.name}</span>
            <div className="vote-bar">
              <i style={{ width: `${(c / g.players.length) * 100}%` }} />
            </div>
            <strong>{c} phiếu</strong>
          </div>
        ))}
    </div>
  );
}
function Results({ g }: { g: Game }) {
  return (
    <>
      <div className="winner-card">
        <Heading
          tag="HẠ MÀN · LÒNG TIN ĐÃ ĐƯỢC THỬ"
          title={`${g.winner === "civilian" ? "Dân thường" : "Imposter"} chiến thắng!`}
          desc={g.reason}
        />
        <BellaLogo small />
      </div>
      <div className="result-words">
        <div>
          <small>TỪ CỦA DÂN THƯỜNG</small>
          <strong>{civilianWord(g)}</strong>
        </div>
        <div>
          <small>TỪ CỦA IMPOSTER</small>
          <strong>{g.swapped ? g.pair.a : g.pair.b}</strong>
        </div>
      </div>
      <div className="panel">
        <h3>Những imposter của ván này</h3>
        <div className="chips centered">
          {g.players
            .filter((p) => p.imposter)
            .map((p) => (
              <span className="chip selected" key={p.id}>
                <EyeOff size={15} />
                {p.name}
              </span>
            ))}
        </div>
      </div>
      {g.events.length > 0 && (
        <details className="panel timeline">
          <summary>Diễn biến bỏ phiếu · {g.events.length} lần</summary>
          {g.events.map((e, i) => (
            <div key={i}>
              <h3>
                Vòng {e.round}
                {e.runoff ? " · Bầu lại" : ""}
              </h3>
              <VoteCounts g={g} event={e} />
              <p>
                {e.eliminated
                  ? `${g.players.find((p) => p.id === e.eliminated)?.name} bị loại · ${e.role ? "Imposter" : "Dân thường"}`
                  : e.tied.length > 1
                    ? "Hòa phiếu"
                    : "Chưa loại người"}
              </p>
            </div>
          ))}
        </details>
      )}
    </>
  );
}
function WordLibrary({
  custom,
  update,
  notify,
  confirm,
}: {
  custom: Pair[];
  update: (f: (s: Store) => Store) => void;
  notify: (s: string) => void;
  confirm: (c: { text: string; run: () => void }) => void;
}) {
  const [query, setQuery] = useState(""),
    [topic, setTopic] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [onlyCustom, setOnlyCustom] = useState(false),
    [limit, setLimit] = useState(30),
    [editing, setEditing] = useState<Pair | null>(null),
    [preview, setPreview] = useState<ReturnType<typeof previewImport> | null>(
      null,
    ),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const all = [...builtin, ...custom],
    filtered = all.filter(
      (p) =>
        (!query || norm(`${p.a} ${p.b} ${p.topic}`).includes(norm(query))) &&
        (!topic || p.topic === topic) &&
        (!difficulty || p.difficulty === difficulty) &&
        (!onlyCustom || p.source === "custom"),
    );
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, pairs: custom }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "imposter-tu-tu-tao.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <main className="page">
      <Heading
        tag="KHOẢNG CÁCH GIỮA HAI TỪ"
        title="Quen mà khó đoán."
        desc={`${new Set(all.flatMap((p) => [norm(p.a), norm(p.b)])).size.toLocaleString("vi-VN")} từ riêng biệt · ${all.length} cặp · ${new Set(all.map((p) => p.topic)).size} chủ đề`}
      />
      <div className="library-toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Tìm kiếm kho từ"
            placeholder="Tìm một từ, một chủ đề…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(30);
            }}
          />
        </div>
        <button
          className="btn primary"
          onClick={() => {
            setError("");
            setEditing({
              id: uid(),
              a: "",
              b: "",
              topic: "Tự tạo",
              difficulty: "easy",
              source: "custom",
              aliasesA: [],
              aliasesB: [],
            });
          }}
        >
          <Plus size={18} /> Thêm cặp từ
        </button>
        <button
          className="btn secondary"
          onClick={() => input.current?.click()}
        >
          <Upload size={17} /> Nhập JSON
        </button>
        <button className="btn secondary" onClick={exportData}>
          <Download size={17} /> Xuất {custom.length} cặp
        </button>
        <input
          hidden
          type="file"
          accept=".json,application/json"
          ref={input}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 3_000_000)
                throw Error("Tệp quá lớn. Giới hạn 3 MB.");
              setPreview(previewImport(await file.text(), all));
            } catch (err) {
              notify((err as Error).message);
            }
            e.target.value = "";
          }}
        />
      </div>
      <div className="filter-row">
        <select
          aria-label="Lọc chủ đề"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setLimit(30);
          }}
        >
          <option value="">Tất cả chủ đề</option>
          {[...new Set(all.map((p) => p.topic))].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          aria-label="Lọc độ khó"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setLimit(30);
          }}
        >
          <option value="">Mọi độ khó</option>
          {["easy", "medium", "hard"].map((v) => (
            <option key={v} value={v}>
              {difficultyLabel[v as keyof typeof difficultyLabel]}
            </option>
          ))}
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={onlyCustom}
            onChange={(e) => setOnlyCustom(e.target.checked)}
          />{" "}
          Chỉ từ tự tạo
        </label>
        <span className="muted">{filtered.length} cặp</span>
      </div>
      <div className="word-grid">
        {filtered.slice(0, limit).map((p) => (
          <article className="word-card" key={p.id}>
            <div>
              <span className="word-topic">{p.topic}</span>
              <span className={`difficulty ${p.difficulty}`}>
                {difficultyLabel[p.difficulty]}
              </span>
            </div>
            <h3>
              {p.a}
              <span>↔</span>
              {p.b}
            </h3>
            <div className="word-actions">
              <small>{p.source === "builtin" ? "Có sẵn" : "Tự tạo"}</small>
              {p.source === "builtin" ? (
                <button
                  className="text-btn"
                  aria-label={`Sao chép ${p.a} và ${p.b}`}
                  onClick={() => {
                    setError("");
                    setEditing({ ...p, id: uid(), source: "custom" });
                  }}
                >
                  <Copy size={14} /> Tạo bản riêng
                </button>
              ) : (
                <>
                  <button
                    className="text-btn"
                    onClick={() => {
                      setError("");
                      setEditing({ ...p });
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Xóa cặp ${p.a} và ${p.b}`}
                    onClick={() =>
                      confirm({
                        text: `Xóa cặp tự tạo “${p.a} / ${p.b}”? Ván đang chơi dùng bản lưu riêng nên không bị ảnh hưởng.`,
                        run: () =>
                          update((s) => ({
                            ...s,
                            custom: s.custom.filter((v) => v.id !== p.id),
                          })),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <Search size={40} />
          <h3>Chưa có cặp phù hợp</h3>
          <p>Thử từ khóa khác hoặc mở rộng bộ lọc.</p>
        </div>
      )}
      {filtered.length > limit && (
        <button
          className="btn secondary more"
          onClick={() => setLimit((v) => v + 30)}
        >
          Xem thêm {Math.min(30, filtered.length - limit)} cặp{" "}
          <Plus size={16} />
        </button>
      )}
      {editing && (
        <div className="modal-backdrop">
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !norm(editing.a) ||
                !norm(editing.b) ||
                !norm(editing.topic)
              ) {
                setError("Hãy nhập đủ hai từ và chủ đề.");
                return;
              }
              if (norm(editing.a) === norm(editing.b)) {
                setError("Hai từ phải khác nhau.");
                return;
              }
              const duplicate = custom.some(
                (p) =>
                  p.id !== editing.id &&
                  [norm(p.a), norm(p.b)].sort().join("|") ===
                    [norm(editing.a), norm(editing.b)].sort().join("|"),
              );
              if (duplicate) {
                setError("Cặp tự tạo này đã có, kể cả khi đảo chiều.");
                return;
              }
              const value = {
                ...editing,
                a: clean(editing.a),
                b: clean(editing.b),
                topic: clean(editing.topic),
              };
              update((s) => ({
                ...s,
                custom: [...s.custom.filter((p) => p.id !== value.id), value],
              }));
              setEditing(null);
              notify("Đã lưu cặp tự tạo.");
            }}
          >
            <h2 id="edit-title">Cặp từ của bạn</h2>
            <p className="muted">Hai từ có điểm chung, đủ khác để suy luận.</p>
            {(["a", "b", "topic"] as const).map((key) => (
              <label className="field" key={key}>
                {key === "a" ? "Từ A" : key === "b" ? "Từ B" : "Chủ đề"}
                <input
                  autoFocus={key === "a"}
                  required
                  maxLength={100}
                  value={editing[key]}
                  onChange={(e) =>
                    setEditing({ ...editing, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label className="field">
              Độ khó
              <select
                value={editing.difficulty}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    difficulty: e.target.value as Pair["difficulty"],
                  })
                }
              >
                {["easy", "medium", "hard"].map((v) => (
                  <option key={v} value={v}>
                    {difficultyLabel[v as keyof typeof difficultyLabel]}
                  </option>
                ))}
              </select>
            </label>
            {(["aliasesA", "aliasesB"] as const).map((key, i) => (
              <label className="field" key={key}>
                Cách gọi tương đương từ {i ? "B" : "A"} (ngăn bằng dấu phẩy)
                <input
                  value={(editing[key] || []).join(", ")}
                  onChange={(e) =>
                    setEditing({ ...editing, [key]: e.target.value.split(",") })
                  }
                  onBlur={() =>
                    setEditing({
                      ...editing,
                      [key]: (editing[key] || []).map(clean).filter(Boolean),
                    })
                  }
                />
              </label>
            ))}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="button-row">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setEditing(null)}
              >
                Hủy
              </button>
              <button className="btn primary">
                Lưu cặp từ <Check size={17} />
              </button>
            </div>
          </form>
        </div>
      )}
      {preview && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
          >
            <h2 id="import-title">Xem trước bộ từ nhập</h2>
            <p>
              {preview.pairs.length} cặp sẽ được thêm · {preview.duplicates} cặp
              trùng sẽ bỏ qua · {preview.conflicts} ID trùng được cấp ID mới.
              Không ghi đè cặp đang có.
            </p>
            <div className="import-preview">
              {preview.pairs.slice(0, 30).map((p) => (
                <p key={p.id}>
                  {p.a} ↔ {p.b} <small>· {p.topic}</small>
                </p>
              ))}
              {preview.pairs.length > 30 && (
                <p>Và {preview.pairs.length - 30} cặp khác…</p>
              )}
            </div>
            <div className="button-row">
              <button
                className="btn secondary"
                onClick={() => setPreview(null)}
              >
                Hủy nhập
              </button>
              <button
                className="btn primary"
                disabled={!preview.pairs.length}
                onClick={() => {
                  update((s) => ({
                    ...s,
                    custom: [...s.custom, ...preview.pairs],
                  }));
                  notify(`Đã nhập ${preview.pairs.length} cặp tự tạo.`);
                  setPreview(null);
                }}
              >
                Xác nhận nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
export default App;
