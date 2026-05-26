import { useState, useCallback } from "react";
import "./App.css";
import { DATA, SECTION_KEYS } from "./data";

/* ─── Helpers ─── */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ─── CmdCard ─── */
function CmdCard({ cmd, desc, accent, isShortcut, query }) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    });
  }, [cmd]);

  return (
    <div className="cmd-card" onClick={handleClick} title="Click to copy">
      {copied ? (
        <span className="copied-flash">copied!</span>
      ) : (
        <span className="copy-hint">click to copy</span>
      )}

      {isShortcut ? (
        <span className="cmd-kbd">
          {cmd.split(" / ").map((part, i, arr) => (
            <span key={i}>
              <span className="kbd-key" style={{ color: accent }}>
                {part.trim()}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>
                  {" "}
                  /{" "}
                </span>
              )}
            </span>
          ))}
        </span>
      ) : (
        <span className="cmd-code" style={{ color: accent }}>
          <HighlightText text={cmd} query={query} />
        </span>
      )}

      <span className="cmd-desc">
        <HighlightText text={desc} query={query} />
      </span>
    </div>
  );
}

/* ─── Section view ─── */
function SectionView({ sectionKey, query }) {
  const section = DATA[sectionKey];
  const { accent, label, isShortcut, cats } = section;

  const filtered = Object.entries(cats)
    .map(([cat, cmds]) => {
      const matches = query
        ? cmds.filter(
            ([cmd, desc]) =>
              cmd.toLowerCase().includes(query) ||
              desc.toLowerCase().includes(query)
          )
        : cmds;
      return [cat, matches];
    })
    .filter(([, cmds]) => cmds.length > 0);

  const total = filtered.reduce((acc, [, cmds]) => acc + cmds.length, 0);

  return (
    <div>
      <div className="section-header">
        <span className="section-title">{label}</span>
        {query && (
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {total} result{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="no-results">
          No results for <strong>"{query}"</strong>
        </div>
      ) : (
        filtered.map(([cat, cmds]) => (
          <div key={cat}>
            <div className="cat-label">{cat}</div>
            <div className="cmd-grid">
              {cmds.map(([cmd, desc]) => (
                <CmdCard
                  key={cmd}
                  cmd={cmd}
                  desc={desc}
                  accent={accent}
                  isShortcut={isShortcut}
                  query={query}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Global search ─── */
function GlobalSearch({ query }) {
  const results = SECTION_KEYS.flatMap((key) => {
    const { cats, accent, label, isShortcut } = DATA[key];
    return Object.entries(cats).flatMap(([, cmds]) =>
      cmds
        .filter(
          ([cmd, desc]) =>
            cmd.toLowerCase().includes(query) ||
            desc.toLowerCase().includes(query)
        )
        .map(([cmd, desc]) => ({ key, cmd, desc, accent, label, isShortcut }))
    );
  });

  // group by section
  const grouped = SECTION_KEYS.reduce((acc, key) => {
    const matches = results.filter((r) => r.key === key);
    if (matches.length) acc[key] = matches;
    return acc;
  }, {});

  const total = results.length;

  if (total === 0) {
    return (
      <div>
        <div className="section-header">
          <span className="section-title">Search</span>
        </div>
        <div className="no-results">
          No results for <strong>"{query}"</strong>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Search results</span>
        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
          {total} match{total !== 1 ? "es" : ""} across{" "}
          {Object.keys(grouped).length} section
          {Object.keys(grouped).length !== 1 ? "s" : ""}
        </span>
      </div>

      {Object.entries(grouped).map(([key, items]) => (
        <div key={key}>
          <div className="cat-label">{DATA[key].label}</div>
          <div className="cmd-grid">
            {items.map(({ cmd, desc, accent, isShortcut }) => (
              <CmdCard
                key={cmd}
                cmd={cmd}
                desc={desc}
                accent={accent}
                isShortcut={isShortcut}
                query={query}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [activeSection, setActiveSection] = useState(SECTION_KEYS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const q = searchQuery.toLowerCase().trim();
  const isSearching = q.length >= 2;

  const handlePillClick = (key) => {
    setActiveSection(key);
    setSearchQuery("");
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          dev<span className="logo-slash">/</span>ref
        </div>
        <div className="tagline">Every command you use daily — one place</div>
      </header>

      {/* Search */}
      <div className="search-wrap" style={{ margin: "2rem 3rem 0" }}>
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search any command or description…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Nav */}
      <nav className="nav-row">
        {SECTION_KEYS.map((key) => {
          const { label, accent } = DATA[key];
          const isActive = key === activeSection && !isSearching;
          return (
            <button
              key={key}
              className={`nav-pill${isActive ? " active" : ""}`}
              style={{ "--pill-color": accent }}
              onClick={() => handlePillClick(key)}
            >
              <span
                className="nav-dot"
                style={{ background: accent }}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="main">
        {isSearching ? (
          <GlobalSearch query={q} />
        ) : (
          <SectionView sectionKey={activeSection} query="" />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        Click any card to copy &nbsp;·&nbsp; <span>devref</span> &nbsp;·&nbsp; built for developers
      </footer>
    </div>
  );
}
