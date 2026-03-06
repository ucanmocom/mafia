# SEO i hreflang - instrukcja implementacji

## ✅ Poprawione problemy:

### 1. **Hreflang URLs - teraz absolutne** ✅
- Zaktualizowano na `https://mafia.ucanmo.com` 
- Dynamiczne aktualizowanie href przez JavaScript

### 2. **Sitemap.xml - relatywne URLs**
- Używa relatywnych paths (/pl, /en, /fr, /de)  
- Serwer automatycznie doda domenę

### 3. **Robots.txt - relatywny sitemap**
- `Sitemap: /sitemap.xml` zamiast hardcoded domain

### 4. **Dynamic og:locale**
- Automatyczne ustawianie: pl_PL, en_US, fr_FR, de_DE

### 5. **Improved hreflang management**
- Usuwa stare linki przed dodaniem nowych (bez duplikatów)
- Prawidłowe absolutne URLs

## 🔧 Do zmiany przed production:

1. **W index.html:** ✅ Zaktualizowano na `https://mafia.ucanmo.com`
2. **Opcjonalnie:** dodaj JSON-LD structured data
3. **Test:** sprawdź w Google Search Console

## 🎯 Struktura implementowanych SEO features:

```
/en → English version (default, x-default)
/en → English version  
/fr → Version française
/de → Deutsche Version
```

Każda strona ma:
- Canonical URL
- Hreflang links do wszystkich wersji
- Właściwy og:locale
- Zoptymalizowane meta descriptions