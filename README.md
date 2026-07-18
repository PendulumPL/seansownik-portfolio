# Seansownik

Mobilna aplikacja do prowadzenia prywatnej listy filmów i seriali. Pozwala wyszukiwać tytuły w TMDB, przypisywać je do platform streamingowych, zmieniać status oglądania oraz zapisywać własne oceny i notatki.

## Jak wygląda aplikacja

| Biblioteka i lista do obejrzenia | Wyszukiwanie w TMDB |
|:---:|:---:|
| <img src="docs/screenshots/01-home-library.jpg" alt="Ekran główny z listą filmów i seriali" width="360"> | <img src="docs/screenshots/02-tmdb-search.jpg" alt="Wyniki wyszukiwania tytułu Diuna w TMDB" width="360"> |
| **Filtrowanie według platformy** | **Ocena i prywatna notatka** |
| <img src="docs/screenshots/03-platform-filter.png" alt="Lista obejrzanych tytułów dostępnych na Netflix" width="360"> | <img src="docs/screenshots/04-rating-and-note.png" alt="Edycja tytułu z oceną, notatką i platformą" width="360"> |

## Najważniejsze funkcje

- wyszukiwanie filmów i seriali przez TMDB API,
- listy: „Do obejrzenia”, „W trakcie” i „Obejrzane”,
- filtrowanie według platformy streamingowej,
- oceny od 0,5 do 10 oraz prywatne notatki,
- ręczne dodawanie tytułów,
- lokalny zapis danych na urządzeniu,
- cofnięcie przypadkowego usunięcia,
- numerowanie obejrzanych tytułów globalnie i osobno dla każdej platformy,
- wykrywanie duplikatów z możliwością otwarcia istniejącego wpisu,
- eksport i ponowne wczytanie kopii listy w formacie JSON,
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
npm test
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

- 13 testów logiki mapowania TMDB, importu kopii, numerowania i wykrywania duplikatów,
- GitHub Actions sprawdza instalację, testy oraz eksport Android przy każdym pushu i pull requeście,
- trwające zapytania wyszukiwania są anulowane po zmianie frazy,
- błędy sieciowe i błędy lokalnego zapisu są widoczne dla użytkownika,
- nieprawidłowa kopia zapasowa nie zastępuje dotychczasowej listy.

## Kierunki rozwoju

- podział głównego ekranu na mniejsze komponenty i hooki,
- migracja do TypeScript,
- szersze testy jednostkowe i testy komponentów,
- automatyczne kopie zapasowe lub opcjonalna synchronizacja,
- opcjonalna synchronizacja między urządzeniami.

## Autor

**Paweł Karolak**

GitHub: [PendulumPL](https://github.com/PendulumPL)

Kontakt: przywrocwspomnienia@gmail.com

Projekt powstał jako samodzielnie prowadzony eksperyment produktowy rozwijany iteracyjnie z wykorzystaniem narzędzi AI do implementacji i testowania.
