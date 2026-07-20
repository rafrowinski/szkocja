# Kontekst projektu

Planer wycieczki po UK/Irlandii (25.07–08.08.2026): Edynburg+Highlands → Belfast → Liverpool.
Trzy siostrzane repo hostowane na GitHub Pages: `szkocja`, `irlandia`, `anglia` (rafrowinski/*).
Każde repo = jeden samowystarczalny `index.html` (inline CSS+JS, po polsku, dark theme, Leaflet 1.9.4 z cdnjs, kafelki OSM).

## Architektura wspólnego "silnika" (identyczna we wszystkich trzech plikach)

- **Zakładki**: `showTab(n)` przełącza `#tabN` + `.tabbtn.on`; po przełączeniu `mapX.invalidateSize()` (mapy w ukrytych divach mają rozmiar 0!).
- **Markery**: `mk(map, lat, lng, name, info, cat, img, ...)` — `cat` ∈ food/attr/shop/hist (kolory w `C`), rejestruje się w `REG` (filtry) i `IMGREG` (miniaturki tabel).
- **Filtry**: paski `.fbar` renderowane z `FBAR_HTML` (2–3 sztuki, zsynchronizowane przez `syncChk/syncQ` po `data-role`); tryby `setMode`: all / rated / <specjalny dla miasta>; `applyFilter()` chowa markery przez `map.removeLayer`.
- **Zdjęcia — łańcuch `resolveThumb(wiki, qname, lat, lng)`**: zdjęcie HLO (blog Hand Luggage Only, `IMGB`) → REST summary Wikipedii → szukajka Wikimedia Commons po nazwie → **geosearch Commons po współrzędnych** (500 m, potem 2 km). Cache w `THUMB_CACHE`.
- **Dymki**: placeholder `PH` ("ładowanie zdjęcia…"); `wikiThumb()` po pierwszym otwarciu podmienia treść przez `marker.setPopupContent(html.replace(PH, img))` — NIE wstrzykiwać w DOM dymka po id, bo Leaflet odtwarza treść przy każdym otwarciu (to był bug "zdjęcie dopiero za drugim razem").
- **Linki w dymkach**: `linkRow()` = Mapy (Google Maps query) / WWW (DuckDuckGo `!ducky` → strona oficjalna) / 📷 Grafika (Google Images) / Wiki / Instagram+`▶ podgląd` (post źródłowy użytkownika, panel `showIG` z iframe `/embed/`) albo "IG szukaj".
- **Miniaturki w tabelach**: `decorateTables()` dopasowuje `td b` do `IMGREG` (exact + fuzzy startsWith 14 znaków), wstawia 96×64 z placeholderem "ładowanie…"/"brak zdjęcia".
- **Tooltip**: duży podgląd (960px / w=900) przy hoverze na dowolny `img` w `td` lub dymku; czyści poprzedni obrazek i pokazuje "ładowanie…" do `onload`; fallback `onerror` → miniatura.
- **Trasy dzienne**: `stops(...)` — numerowane kółka `divIcon .rnum` w `L.layerGroup`, przełączane checkboxami `L.control.layers` na mapie.

## Konwencje i pułapki

- Współrzędne weryfikujemy geokoderem **photon.komoot.io** (były liczne przesunięcia z pamięci modelu). Tytuły Wikipedii weryfikować przez REST summary (404/no-thumbnail → poprawić lub usunąć).
- Rozmiary miniatur Wikimedia: tylko dozwolone szerokości (np. 960px OK, 440px = błąd) — nie wymyślać własnych.
- Nazwy markerów = klucze lookupów (`WIKI`, `IG`/`IGL`/`IGB`) — zmiana nazwy wymaga zmiany klucza.
- Test po edycji: wyciąć ostatni `<script>` → `node --check` + smoke-test z zastubowanym `L`/`document` (obie/trzy mapy mają się zainicjalizować).
- Committy po polsku; użytkownik sam robi `git push` (GitHub Pages).
- Źródła danych: prywatne kolekcje IG użytkownika (czytane przez jego zalogowaną przeglądarkę), lista TripAdvisor, artykuły handluggageonly.co.uk, rekomendacje wg gustu: ukryte puby, mroczna historia/ghost tours, lokacje filmowe (HP/GoT/Outlander), baśniowa natura, antykwariaty/vintage, whisky, seafood, alpine coastery, szkockie krowy.

## Specyfika tego repo (szkocja)

- Zakładki: 🏙️ Edynburg (`m1`/`map-edi`) i 🌄 Highlands/reszta (`m2`/`map-scot`).
- Filtr specjalny: 🥘 tylko haggis.
- Trasy dzienne na m1 (checkboxy): 26.07 spacer pod zamkiem (d1, pomarańcz), 27.07 Royal Mile (d2, zieleń, 3 opcje haggisu), 28.07 wariant A krowy+Rosslyn (d3a, niebieski) i B krowy+Morningside (d3b, fiolet, domyślnie wyłączony).
- Plan: 25–28.07 Edynburg (nocleg 18 Holyrood Park Rd), 29–30.07 auto: Ballachulish (Aos Si Lodges) → Glen Coe/Glenfinnan → nocleg Broughty Ferry (Dundee), 31.07 powrót, oddanie auta, lot do Belfastu.
- Osobny plik pomocniczy w sesji Cowork: `edynburg-dzien1-spacer.html` (mapka spaceru; scalona też do index).
- IG kolekcja źródłowa: instagram.com/straszniedluganazwa/saved/scotland/… (67 postów, kody w lookupie `IG`).
