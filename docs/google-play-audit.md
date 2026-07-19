# Audyt Google Play — Seansownik

Stan na 18 lipca 2026 r.

## Już gotowe

- działająca aplikacja Android i stabilny identyfikator `com.seansownik.app`,
- numer wersji i rosnący `versionCode`,
- cztery pionowe zrzuty ekranu,
- brak kont użytkowników, reklam i analityki,
- lista oraz notatki przechowywane lokalnie,
- ręczny eksport i import kopii danych,
- testy automatyczne logiki aplikacji,
- repozytorium bez tokenu TMDB i danych użytkowników.

## Wymagane przed pierwszym wysłaniem

- konto Google Play Console i weryfikacja dewelopera,
- produkcyjny klucz wysyłania zamiast klucza testowego Android Debug,
- plik Android App Bundle (`.aab`),
- usunięcie zbędnych uprawnień do pamięci i nakładek systemowych,
- własna ikona aplikacji oraz grafika promocyjna,
- publiczna polityka prywatności i formularz Data safety,
- sekcja „O aplikacji” z logo i wymaganym tekstem TMDB,
- opis krótki, opis pełny, kategoria i dane kontaktowe,
- deklaracja grupy docelowej i klasyfikacja treści,
- sprawdzenie praw do sposobu prezentowania nazw i logotypów platform.

## Termin API

- Obecna wersja celuje w API 35.
- Od 31 sierpnia 2026 r. nowe aplikacje i aktualizacje telefoniczne muszą celować w API 36.
- Przed publikacją należy przejść z Expo SDK 53 do wersji obsługującej API 36 i ponownie przetestować interfejs Androida.

## Test zamknięty

Jeśli osobiste konto deweloperskie zostało utworzone po 13 listopada 2023 r., przed produkcją wymagany jest test zamknięty z co najmniej 12 testerami zapisanymi nieprzerwanie przez 14 dni.

## Ważne dla obecnej testerki

Aktualne APK jest podpisane kluczem testowym. Pierwsza prawidłowo podpisana wersja sklepowa może wymagać odinstalowania APK testowego. Przed tym testerka powinna wyeksportować kopię listy, a po instalacji wersji sklepowej ponownie ją wczytać.