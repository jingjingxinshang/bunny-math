import { getT, useLang } from '../lib/i18n';
import { sounds } from '../lib/sound';
import type { Mode } from '../lib/types';
import { Bunny } from './Bunny';
import { LangButton } from './Home';

/** Shown on the first visit, and from the home screen to switch. */
export function ModePick({ current, onPick }: { current?: Mode; onPick: (m: Mode) => void }) {
  const { lang } = useLang();
  const t = getT(lang);
  const modeKeys: Mode[] = ['plus', 'all'];

  return (
    <section class="screen">
      <header class="topbar">
        <span class="spacer" />
        <LangButton />
      </header>
      <div class="mode-body">
        <div class="mode-hero">
          <Bunny mood="happy" />
          <h1 class="mode-title">{t.modePickTitle}</h1>
        </div>
        <div class="modes" role="radiogroup" aria-label={t.modePickAria}>
          {modeKeys.map((m) => {
            const info = t.modes[m];
            return (
              <button
                key={m}
                class={`mode-card m-${m}`}
                role="radio"
                aria-checked={current === m}
                onClick={() => {
                  sounds.tap();
                  onPick(m);
                }}
              >
                <span class="mode-signs" aria-hidden="true">
                  {info.signs.split(' ').map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </span>
                <span class="mode-name">{info.name}</span>
                <span class="mode-blurb">{info.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
