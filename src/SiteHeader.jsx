import { useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { GITHUB } from "./problems.js";
import { useLang } from "./i18n.jsx";
import { play, setSound, soundOn, subscribeSound } from "./sound.js";

export function SiteHeader({ title, onIntro }) {
  const navigate = useNavigate();
  const { lang, t, setLang } = useLang();
  const sound = useSyncExternalStore(subscribeSound, soundOn);
  return (
    <header className="topbar">
      <h1 className="brand">{title || t.site}</h1>
      <nav className="nav">
        <button className="text-btn" type="button" onClick={() => navigate("/")}>
          {t.home}
        </button>
        {onIntro ? (
          <button
            className="text-btn"
            type="button"
            onClick={() => {
              play("click");
              onIntro();
            }}
          >
            {t.intro}
          </button>
        ) : null}
        <a className="text-btn" href={GITHUB} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <button
          className={sound ? "icon-btn sound" : "icon-btn sound is-off"}
          type="button"
          aria-pressed={sound}
          aria-label={sound ? t.soundOn : t.soundOff}
          title={sound ? t.soundOn : t.soundOff}
          onClick={() => setSound(!sound)}
        />
        <button
          className="text-btn lang"
          type="button"
          lang={lang === "zh" ? "en" : "zh-CN"}
          title={t.langTitle}
          onClick={() => {
            play("click");
            setLang(lang === "zh" ? "en" : "zh");
          }}
        >
          {t.langSwitch}
        </button>
      </nav>
    </header>
  );
}
