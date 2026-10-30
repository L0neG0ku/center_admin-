import { useEffect, useState } from "react";
import Icon from "../icons/Icon.jsx";
import { API_BASE_URL } from "../api/config.js";
import "../styles/get-app.css";

/**
 * Where a centre sends a family to get the app.
 *
 * **Why a page and not the file.** The obvious thing is to attach the APK to
 * a WhatsApp message, and it works exactly once: the file is forwarded
 * between parents, goes stale the day a build ships, and there is no way to
 * reach anyone holding the old one. A link is the same effort to send and
 * always points at the current build.
 *
 * **Public, and it has to be.** The parent has not signed in — that is why
 * they are here. So this sits outside RequireAuth and calls /v1/app, which
 * is unauthenticated for the same reason.
 *
 * **The install warning is the most important thing on the page.** Android
 * shows a frightening dialog for anything not from Play: "unsafe app
 * blocked", "your phone is not allowed to install unknown apps". A parent
 * who was not warned reads that as the app being dangerous and stops. A
 * parent who was told to expect it taps through. The difference is most of
 * the families who never get past step one.
 */
export default function GetApp() {
  const [release, setRelease] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${API_BASE_URL}/app`, { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => {
        if (live) setRelease(body?.data ?? null);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const available = release?.available === true;

  return (
    <main className="getapp">
      <div className="getapp__card">
        <div className="getapp__brand">
          <span className="getapp__mark">
            <Icon name="baby" size={26} />
          </span>
          <strong>Kribble</strong>
        </div>

        <h1>Your child&rsquo;s day, as it happens</h1>
        <p className="getapp__lede">
          Your nursery uses Kribble to share meals, naps, photos and messages
          with you. Install the app, then sign in with the mobile number you
          gave them.
        </p>

        {failed ? (
          <p className="getapp__note getapp__note--warn">
            <Icon name="alertCircle" size={16} />
            We couldn&rsquo;t check for the latest version. Please try again in
            a moment, or ask your nursery to send you the app.
          </p>
        ) : null}

        {available ? (
          <>
            <a className="getapp__cta" href={`${API_BASE_URL}/app/android`}>
              <Icon name="download" size={18} />
              Download for Android
            </a>
            <p className="getapp__meta">
              {[
                release.version ? `Version ${release.version}` : null,
                release.size_mb ? `about ${release.size_mb} MB` : null,
                release.min_android ? `Android ${release.min_android}+` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        ) : !failed ? (
          <p className="getapp__note">
            <Icon name="clock" size={16} />
            The download is not ready yet. Your nursery will send you the app.
          </p>
        ) : null}

        <section className="getapp__steps">
          <h2>What to expect</h2>
          <ol>
            <li>
              <strong>Android will warn you.</strong> It says something like
              &ldquo;unsafe app blocked&rdquo; or asks permission to install
              unknown apps. That is normal for an app sent directly by your
              nursery rather than through the Play Store. Choose{" "}
              <em>Settings</em> and allow it, then go back.
            </li>
            <li>
              <strong>Sign in with your mobile number.</strong> Use the same
              number you gave the nursery. Any other number will not find your
              child.
            </li>
            <li>
              <strong>We text you a code.</strong> Type it in and you are done
              — there is no password to remember.
            </li>
          </ol>
        </section>

        <section className="getapp__help">
          <h2>If it doesn&rsquo;t work</h2>
          <p>
            <strong>&ldquo;We couldn&rsquo;t send a code&rdquo;</strong> — the
            number may not be the one your nursery has. Ask them to check it.
          </p>
          <p>
            <strong>Nothing arrives</strong> — texts can take a minute. Wait,
            then tap resend.
          </p>
          <p>
            <strong>The app will not install</strong> — you may be on an
            iPhone. Kribble for iPhone is coming; for now ask your nursery to
            keep sending you updates directly.
          </p>
        </section>

        <p className="getapp__foot">
          Having trouble? Speak to your nursery — they can see whether your
          number is registered.
        </p>
      </div>
    </main>
  );
}
