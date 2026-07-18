# Architektura Seansownika

## Przepływ danych

1. Użytkownik wpisuje nazwę filmu lub serialu.
2. `src/tmdb.js` odpytuje TMDB Search API.
3. Wyniki są mapowane do uproszczonego modelu aplikacji.
4. Użytkownik wybiera status, platformę, ocenę i opcjonalną notatkę.
5. Dane są zapisywane jako JSON w `AsyncStorage`.
6. Po ponownym uruchomieniu aplikacja odtwarza listę z pamięci urządzenia.
7. Użytkownik może wyeksportować listę do pliku JSON i wczytać ją ponownie po potwierdzeniu.

## Główne elementy

- `App.js` — stan aplikacji, nawigacja widoków, edycja oraz prezentacja danych,
- `src/tmdb.js` — komunikacja z TMDB,
- `src/tmdbMapper.mjs` — czysta, testowalna funkcja mapowania odpowiedzi,
- `src/storage.js` — odczyt i zapis danych lokalnych,
- `src/backup.mjs` — walidacja importowanej kopii listy,
- `src/duplicates.mjs` — wykrywanie powtórzonych tytułów,
- `src/watchedOrder.mjs` — kolejność i numerowanie obejrzanych pozycji,
- `AsyncStorage` — lokalne utrwalanie listy oraz informacji o ekranie powitalnym,
- Expo/EAS — uruchamianie i przygotowywanie wersji Android.

## Świadome ograniczenia MVP

- brak kont i synchronizacji między urządzeniami,
- brak backendu przechowującego listy użytkowników,
- brak obsługi konfliktów danych,
- ręczne kopie zapasowe zamiast automatycznej synchronizacji,
- interfejs oraz logika są jeszcze skupione w jednym głównym komponencie.

## Następny krok techniczny

Najważniejszą zmianą byłoby wydzielenie komponentów ekranów, własnego hooka do trwałego zapisu oraz warstwy klienta API. Następnie projekt powinien zostać przeniesiony do TypeScript i objęty testami.
