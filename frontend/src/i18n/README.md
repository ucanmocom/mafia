# System tłumaczeń (i18n)

## Struktura plików

```
src/
├── i18n/
│   └── translations.js       # Słownik tłumaczeń (PL, EN, ...)
├── contexts/
│   └── LanguageContext.jsx   # React Context + hook useLanguage()
└── components/
    └── LanguageSwitcher.jsx  # Przycisk 🌐 w lewym górnym rogu
```

---

## 1. `translations.js` — słownik tłumaczeń

Plik eksportuje obiekt `translations` oraz tablicę `LANGUAGES`.

### `translations`

Obiekt o kluczach będących kodami języków (`pl`, `en`, ...).  
Każdy język zawiera **zagnieżdżone sekcje** odpowiadające ekranom i komponentom:

```js
export const translations = {
  pl: {
    back: '← Wróć',
    you: 'ty',
    offline: 'offline',

    home: { ... },        // HomeScreen
    roles: { ... },       // nazwy ról (używane wszędzie)
    roleDesc: { ... },    // opisy ról (RoleRevealScreen)
    lobby: { ... },       // LobbyScreen
    phases: { ... },      // etykiety faz w GameHUD
    hud: { ... },         // GameHUD
    night: { ... },       // NightScreen
    day: { ... },         // DayScreen
    roleReveal: { ... },  // RoleRevealScreen
    nightResult: { ... }, // NightResultScreen
    voting: { ... },      // VotingScreen
    voteSummary: { ... }, // VoteSummaryScreen
    voteResult: { ... },  // VoteResultScreen
    gameOver: { ... },    // GameOverScreen
    chat: { ... },        // RoleChat
    toast: { ... },       // powiadomienia w App.jsx
  },
  en: {
    // identyczna struktura, inne wartości
  },
}
```

### `LANGUAGES`

Tablica dostępnych języków — używana przez `LanguageSwitcher` do renderowania listy:

```js
export const LANGUAGES = [
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  // dodaj tutaj nowe języki
]
```

---

## 2. `LanguageContext.jsx` — kontekst i hook

Dostarcza aktywny język i funkcję jego zmiany **całej aplikacji** przez React Context.

```jsx
// main.jsx — opakowanie całej apki
<LanguageProvider>
  <App />
</LanguageProvider>
```

### Wewnętrzna logika

```jsx
const [lang, setLang] = useState(() => {
  return localStorage.getItem('mafia_lang') || 'pl'
})
```

- Przy pierwszym uruchomieniu czyta język z `localStorage` (klucz `mafia_lang`).  
- Domyślny język: `pl`.

```jsx
const changeLang = (code) => {
  setLang(code)
  localStorage.setItem('mafia_lang', code)
}

const t = translations[lang] || translations['pl']
```

- `t` to gotowy słownik dla aktywnego języka — przekazywany przez kontekst.

### Użycie w komponencie

```jsx
import { useLanguage } from '../contexts/LanguageContext'

function MojKomponent() {
  const { t, lang, setLang } = useLanguage()

  return <p>{t.home.tagline}</p>
}
```

| Wartość   | Typ        | Opis                                   |
|-----------|------------|----------------------------------------|
| `t`       | `object`   | Słownik tłumaczeń aktywnego języka     |
| `lang`    | `string`   | Aktualny kod języka, np. `'pl'`        |
| `setLang` | `function` | Zmienia język i zapisuje w localStorage|

---

## 3. `LanguageSwitcher.jsx` — przycisk zmiany języka

Renderowany w `App.jsx` jako **pierwsza rzecz** w drzewie — zawsze widoczny w lewym górnym rogu (`position: fixed, top: 8, left: 8, zIndex: 1100`).

```jsx
// App.jsx
return (
  <>
    <LanguageSwitcher />
    <GameHUD state={state} />
    ...
  </>
)
```

Kliknięcie przycisku `🌐 PL` otwiera dropdown z listą z `LANGUAGES`.  
Kliknięcie poza dropdownem zamyka go (`mousedown` na `document`).

---

## 4. Obsługa `t` w `App.jsx` (toast messages)

Toasty są wysyłane wewnątrz `handleMessage` — callbacku `useCallback`, który jest tworzony raz przy montowaniu. Żeby unikać **stale closure** (zamrożenia starego `t`), używamy referencji:

```jsx
const tRef = useRef(t)
tRef.current = t   // aktualizowane przy każdym renderze

// wewnątrz handleMessage (useCallback bez t w deps):
showToast(tRef.current.toast.reconnected, 'success')
```

---

## 5. Jak dodać nowy język

1. Otwórz `src/i18n/translations.js`.
2. Skopiuj blok `en: { ... }` i nadaj nowy klucz, np. `de`.
3. Przetłumacz wszystkie wartości.
4. Dodaj wpis do tablicy `LANGUAGES`:

```js
export const LANGUAGES = [
  { code: 'pl', label: 'Polski',  flag: '🇵🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }, // ← nowy język
]
```

Gotowe — przycisk `🌐` automatycznie pokaże nową opcję.

---

## 6. Jak dodać nowy string do tłumaczenia

1. Znajdź odpowiednią sekcję w `translations.js` (lub dodaj nową).
2. Dodaj klucz w **obu** językach (i w każdym kolejnym):

```js
pl: {
  lobby: {
    myNewKey: 'Mój nowy tekst',
  }
},
en: {
  lobby: {
    myNewKey: 'My new text',
  }
}
```

3. W komponencie użyj:

```jsx
const { t } = useLanguage()
// ...
<p>{t.lobby.myNewKey}</p>
```
