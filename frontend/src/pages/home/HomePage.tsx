import PageShell from "../../components/PageShell";
import Icon from "../../components/Icon";
import type { Navigate } from "../../navigation";
import "./home.css";

export default function HomePage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <PageShell home onNavigate={onNavigate}>
      <section className="home-intro">
        <p className="eyebrow">A LITTLE PRACTICE, EVERY DAY</p>
        <h1>
          Your Japanese.
          <br />
          <em>Your own notebook.</em>
        </h1>
        <p>
          Collect the words you learn. Make room for the conversations ahead.
        </p>
      </section>
      <section className="home-modules" aria-label="Learning tools">
        <button
          className="module-card vocabulary-module"
          onClick={() => onNavigate("/vocabulary")}
        >
          <div className="module-top">
            <span className="module-icon">
              <Icon name="book" />
            </span>
            <span className="module-number">01 / COLLECT</span>
          </div>
          <div className="module-illustration" aria-hidden="true">
            <span lang="ja">言葉</span>
            <div>
              <span>WORDS TO REMEMBER</span>
              <i />
              <i />
            </div>
          </div>
          <h2>Vocabulary</h2>
          <p>
            A place for your words, readings, and little reminders. Organized
            your way.
          </p>
          <span className="module-action">
            Open your vocabulary
            <Icon name="arrow" />
          </span>
        </button>
        <button
          className="module-card practice-module"
          onClick={() => onNavigate("/scripts")}
        >
          <div className="module-top">
            <span className="module-icon">
              <Icon name="chat" />
            </span>
            <span className="module-number">02 / CONVERSATIONS</span>
          </div>
          <div className="practice-illustration" aria-hidden="true">
            <span>それ、わかりますか？</span>
            <span>はい、大丈夫です。</span>
          </div>
          <h2>Script Practice</h2>
          <p>
            Build classroom dialogues with your own roles and lines. Keep each
            conversation ready to revisit.
          </p>
          <span className="module-action">Open your scripts</span>
        </button>
      </section>
      <p className="home-closing">Small steps. A growing vocabulary.</p>
    </PageShell>
  );
}
