# Seansownik

Mobilna aplikacja do prowadzenia prywatnej listy filmów i seriali. Pozwala wyszukiwać tytuły w TMDB, przypisywać je do platform streamingowych, zmieniać status oglądania oraz zapisywać własne oceny i notatki.

![Ekran główny Seansownika](docs/screenshots/seansownik-home.png)

## Najważniejsze funkcje

- wyszukiwanie filmów i seriali przez TMDB API,
- listy: „Do obejrzenia”, „W trakcie” i „Obejrzane”,
- filtrowanie według platformy streamingowej,
- oceny od 0,5 do 10 oraz prywatne notatki,
- ręczne dodawanie tytułów,
- lokalny zapis danych na urządzeniu,
- cofnięcie przypadkowego usunięcia,
- eksport kopii listy przez systemowe menu udostępniania,
- obsługa pustych wyników i tytułów bez plakatu.

## Technologie

- React Native 0.79,
- Expo SDK 53,
- React 19,
- AsyncStorage,
- TMDB API,
- EAS Build.

## Uruchomienie lokalne

Wymagane są Node.js oraz bezpłatny token TMDB Read Access.

```bash
npm install
copy .env.example .env
npm run start
```

W pliku `.env` ustaw:

```env
EXPO_PUBLIC_TMDB_TOKEN=twoj_token_tmdb
```

Plik `.env` jest ignorowany przez Git i nie powinien być publikowany.

## Dostępne polecenia

```bash
npm run start
npm run android
npm run ios
```

## Architektura

Aplikacja działa w modelu local-first. Dane użytkownika są przechowywane w `AsyncStorage`, a zewnętrzne API służy wyłącznie do wyszukiwania metadanych o filmach i serialach. Szczegóły znajdują się w [dokumentacji architektury](docs/architecture.md).

## Zakres wersji demonstracyjnej

Jest to działające MVP przeznaczone dla jednego urządzenia. Projekt nie zawiera kont użytkowników ani synchronizacji w chmurze. Świadomie ograniczony zakres pozwala korzystać z aplikacji bez rejestracji i bez wysyłania prywatnych list na własny backend.

## Bezpieczeństwo i prywatność

- repozytorium nie zawiera tokenu TMDB ani innych danych dostępowych,
- prywatna lista i notatki pozostają lokalnie na urządzeniu,
- przed publikacją należy zapoznać się z warunkami oraz zasadami atrybucji TMDB,
- token umieszczony w aplikacji klienckiej należy traktować jako możliwy do odczytania; produkcyjna wersja wymagająca ukrycia poświadczeń powinna korzystać z własnego backendu.

## Kontrola jakości

- testy logiki mapowania odpowiedzi TMDB uruchamiane przez `node --test`,
- GitHub Actions sprawdza instalację, testy oraz eksport Android przy każdym pushu i pull requeście,
- trwające zapytania wyszukiwania są anulowane po zmianie frazy,
- błędy sieciowe i błędy lokalnego zapisu są widoczne dla użytkownika.

## Kierunki rozwoju

- podział głównego ekranu na mniejsze komponenty i hooki,
- migracja do TypeScript,
- szersze testy jednostkowe i testy komponentów,
- import wcześniej wyeksportowanej kopii listy,
- automatyczne kopie zapasowe lub opcjonalna synchronizacja,
- opcjonalna synchronizacja między urządzeniami.

## Autor

Projekt powstał jako samodzielnie prowadzony eksperyment produktowy rozwijany iteracyjnie z wykorzystaniem narzędzi AI do implementacji i testowania.
