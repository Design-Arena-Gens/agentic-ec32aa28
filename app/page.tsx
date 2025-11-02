"use client";

import { useCallback, useMemo, useState } from "react";

type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  domain?: string;
  photo_100?: string;
  about?: string;
  can_write_private_message?: number;
  city?: { id: number; title: string };
};

export default function HomePage() {
  const [platform, setPlatform] = useState<"vk" | "tg">("vk");
  const [vkToken, setVkToken] = useState<string>("");
  const [query, setQuery] = useState<string>("??????? ??????");
  const [city, setCity] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<VkUser[]>([]);
  const [message, setMessage] = useState<string>(
    "????????????! ?? ????????? ?????? ??? ???????? ????????/???????? ? ?????? ?? ?????????? ??????????????. ????????? ?????? ???????"
  );
  const [status, setStatus] = useState<string>("");
  const [tgUsernamesRaw, setTgUsernamesRaw] = useState<string>("");

  const canSearch = useMemo(() => {
    if (platform === "vk") return query.trim().length > 0;
    return true;
  }, [platform, query]);

  const handleSearch = useCallback(async () => {
    setStatus("");
    setLoading(true);
    try {
      if (platform === "vk") {
        const res = await fetch("/api/vk/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: vkToken || undefined, q: query, city }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "?????? ???????");
        setUsers(data.users || []);
        setStatus(`???????: ${data.users?.length || 0}`);
      }
    } catch (e: any) {
      setStatus(e.message || "??????");
    } finally {
      setLoading(false);
    }
  }, [platform, vkToken, query, city]);

  const handleSendTo = useCallback(
    async (userId: number) => {
      setStatus("");
      try {
        const res = await fetch("/api/vk/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: vkToken || undefined, userId, message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "?? ??????? ?????????");
        setStatus(`????????? ?????????? ???????????? ${userId}`);
      } catch (e: any) {
        setStatus(e.message || "?????? ????????");
      }
    },
    [vkToken, message]
  );

  const tgUsernames = useMemo(() => {
    return tgUsernamesRaw
      .split(/[\s,;\n]+/g)
      .map((u) => u.trim().replace(/^@+/, ""))
      .filter(Boolean);
  }, [tgUsernamesRaw]);

  return (
    <main>
      <div className="container">
        <h1>?????: ????? ???????? ????????/????????</h1>
        <p className="small">?????????: ?????????, Telegram (??????????? API ???????????).</p>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="row">
            <div className="col">
              <label className="label">?????????</label>
              <div className="row">
                <button
                  className={`btn ${platform === "vk" ? "" : "secondary"}`}
                  onClick={() => setPlatform("vk")}
                >
                  ?????????
                </button>
                <button
                  className={`btn ${platform === "tg" ? "" : "secondary"}`}
                  onClick={() => setPlatform("tg")}
                >
                  Telegram
                </button>
              </div>
            </div>
            <div className="col">
              <label className="label">?????? ?????????</label>
              <textarea
                className="input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          {platform === "vk" && (
            <div>
              <div className="hr" />
              <div className="row">
                <div className="col">
                  <label className="label">VK Token (?????????????)</label>
                  <input
                    className="input"
                    placeholder="???? ?? ?????? ? ????? ??????????? ?????????, ???? ????????"
                    value={vkToken}
                    onChange={(e) => setVkToken(e.target.value)}
                  />
                  <div className="small" style={{ marginTop: 8 }}>
                    ????? ?????: users, messages (user/community token).
                  </div>
                </div>
                <div className="col">
                  <label className="label">????????? ??????</label>
                  <input
                    className="input"
                    placeholder="????????: ???????, ?????? ????????"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="label">????? (?? ???????)</label>
                  <input
                    className="input"
                    placeholder="??????"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="toolbar">
                <button className="btn" onClick={handleSearch} disabled={!canSearch || loading}>
                  {loading ? "??????" : "????? ????????"}
                </button>
                <span className="small">{status}</span>
              </div>

              <div className="list">
                {users.map((u) => {
                  const canWrite = u.can_write_private_message === 1;
                  const profileUrl = u.domain ? `https://vk.com/${u.domain}` : `https://vk.com/id${u.id}`;
                  return (
                    <div className="item" key={u.id}>
                      <div style={{ display: "flex", gap: 12 }}>
                        {u.photo_100 && (
                          <img src={u.photo_100} alt="avatar" width={56} height={56} />
                        )}
                        <div>
                          <h4>
                            {u.first_name} {u.last_name}
                          </h4>
                          <div className="small">
                            {u.city?.title && <span className="badge">{u.city.title}</span>} {" "}
                            <a href={profileUrl} target="_blank" rel="noreferrer">
                              ???????
                            </a>
                          </div>
                        </div>
                      </div>
                      {u.about && (
                        <p className="small" style={{ marginTop: 8 }}>{u.about}</p>
                      )}
                      <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn" onClick={() => handleSendTo(u.id)} disabled={!canWrite}>
                          ????????? ?????????
                        </button>
                        <a className="btn secondary" href={`https://vk.com/im?sel=${u.id}`} target="_blank" rel="noreferrer">
                          ??????? ??????
                        </a>
                      </div>
                      {!canWrite && (
                        <div className="status small">?? ?????????? ????? API. ?????????? ??????? ??????.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {platform === "tg" && (
            <div>
              <div className="hr" />
              <div className="row">
                <div className="col">
                  <label className="label">?????? Telegram @??????????</label>
                  <textarea
                    className="input"
                    placeholder="@user1 @user2 @user3"
                    value={tgUsernamesRaw}
                    onChange={(e) => setTgUsernamesRaw(e.target.value)}
                  />
                  <div className="small" style={{ marginTop: 8 }}>
                    ????? ????????????? ????? ????????? API Telegram ?????????. ???????? @?????????.
                  </div>
                </div>
              </div>

              <div className="list">
                {tgUsernames.map((u) => (
                  <div className="item" key={u}>
                    <h4>@{u}</h4>
                    <div className="row">
                      <a className="btn" href={`https://t.me/${u}`} target="_blank" rel="noreferrer">
                        ??????? ???
                      </a>
                      <button
                        className="btn secondary"
                        onClick={() => navigator.clipboard.writeText(message)}
                      >
                        ??????????? ?????????
                      </button>
                    </div>
                    <div className="small" style={{ marginTop: 6 }}>
                      ???? ?? ????? ?????? ?????? ????????????. ???????? ??? ???????.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
