import { Link } from "react-router-dom";
import { PROBLEM_IDS } from "./problems.js";
import { useLang } from "./i18n.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { Vignette } from "./pixel/Vignette.jsx";

function Story({ story }) {
  return story.map((para, index) =>
    para ? <p key={index}>{para}</p> : <div key={index} className="gap" />,
  );
}

export function Home() {
  const { t } = useLang();
  return (
    <div className="home">
      <SiteHeader />
      <main className="chapters">
        <h2 className="home-title">{t.homeTitle}</h2>
        {PROBLEM_IDS.map((id, index) => {
          const text = t.problems[id];
          return (
            <Link key={id} to={`/${id}`} className="chapter">
              <div className="chapter-index">0{index + 1}</div>
              <h2>{text.title}</h2>
              <Vignette kind={id} />
              <div className="story">
                <Story story={text.story} />
              </div>
              <span className="enter">{t.enter}</span>
            </Link>
          );
        })}
      </main>
    </div>
  );
}
