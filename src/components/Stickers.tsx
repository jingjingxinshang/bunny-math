import { getT, useLang } from '../lib/i18n';
import { STICKERS } from '../lib/storage';
import { LangButton } from './Home';

export function Stickers({ owned, onBack }: { owned: string[]; onBack: () => void }) {
  const { lang } = useLang();
  const t = getT(lang);

  return (
    <section class="screen">
      <header class="topbar">
        <button class="puffy icon-btn" aria-label={t.back} onClick={onBack}>
          ◀
        </button>
        <span class="spacer" />
        <LangButton />
      </header>
      <div class="book-body">
        <h1 class="book-title">{t.myStickers}</h1>
        <p class="book-count">
          {t.stickersCount(owned.length, STICKERS.length)}
        </p>
        <div class="book">
          {STICKERS.map((s) =>
            owned.includes(s) ? (
              <div key={s} class="sticker" role="img" aria-label="sticker">
                {s}
              </div>
            ) : (
              <div key={s} class="sticker empty" aria-label="not found yet">
                ?
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
