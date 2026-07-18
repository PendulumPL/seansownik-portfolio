import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { hasTmdbToken, searchTitles } from "./src/tmdb";
import { loadAppData, saveItems, saveWelcomeSeen } from "./src/storage";
import { buildWatchedNumbers, watchedTimestamp } from "./src/watchedOrder.mjs";
import { parseBackupText } from "./src/backup.mjs";
import { findDuplicate } from "./src/duplicates.mjs";

const statuses = [
  { key: "watched", label: "Obejrzane", icon: "checkmark-circle" },
  { key: "watching", label: "W trakcie", icon: "play-circle" },
  { key: "watchlist", label: "Do obejrzenia", icon: "bookmark" }
];
const platforms = ["Wszystkie", "Netflix", "Max", "Player", "Prime Video", "Disney+", "SkyShowtime", "Canal+", "Polsat Box Go", "TVP VOD"];
const details = {
  Wszystkie: { color: "#20232E", soft: "#ECEEF4", logo: null },
  Netflix: { color: "#E50914", soft: "#FFF0F2", logo: "https://image.tmdb.org/t/p/w185/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  Max: { color: "#4B1FA8", soft: "#F1ECFF", logo: "https://image.tmdb.org/t/p/w185/jbe4gVSfRlbPTdESXhEKpornsfu.jpg" },
  Player: { color: "#0B9FC7", soft: "#EAF9FD", logo: "https://image.tmdb.org/t/p/w185/jhMNVBV2UocEGepRkr9oFPD7Gpb.jpg" },
  "Prime Video": { color: "#00A8E1", soft: "#EAF8FF", logo: "https://image.tmdb.org/t/p/w185/pvske1MyAoymrs5bguRfVqYiM9a.jpg" },
  "Disney+": { color: "#18306F", soft: "#EBF0FF", logo: "https://image.tmdb.org/t/p/w185/97yvRBw1GzX7fXprcF80er19ot.jpg" },
  SkyShowtime: { color: "#D41270", soft: "#FFF0F8", logo: "https://image.tmdb.org/t/p/w185/h0ZYcYHicKQ4Ixm5nOjqvwni5NG.jpg" },
  "Canal+": { color: "#151515", soft: "#F0F0F0", logo: "https://image.tmdb.org/t/p/w185/yFjeEJFQqalphfmYivOYyatPVEd.jpg" },
  "Polsat Box Go": { color: "#C79000", soft: "#FFF8DA", logo: "https://image.tmdb.org/t/p/w185/2YCt92ETw8xLXxhkURtMjZnzfKT.jpg" },
  "TVP VOD": { color: "#14856E", soft: "#E7F6F1", logo: "https://image.tmdb.org/t/p/w185/mhsYsVY18PVcVh76y2XFrodqbBD.jpg" }
};
const androidTopInset = Platform.OS === "android" ? (NativeStatusBar.currentHeight || 24) : 0;
const androidBottomInset = Platform.OS === "android" ? 20 : 0;
const initials = (text = "?") => text.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const ratingText = (value) => Number(value).toFixed(1).replace(".0", "").replace(".", ",");

function Brand({ name, small = false }) {
  const item = details[name] || details.Wszystkie;
  const size = small ? 28 : 32;
  return <View style={[styles.brand, { width: size, height: size, borderRadius: small ? 9 : 10, backgroundColor: item.color }]}>
    {item.logo ? <Image source={{ uri: item.logo }} style={styles.brandImage} /> : <Text style={styles.brandAll}>ALL</Text>}
  </View>;
}

function Rating({ value, onChange }) {
  return <View style={styles.rating}>
    <View style={styles.stars}>{Array.from({ length: 10 }, (_, index) => {
      const star = index + 1;
      return <View key={star} style={styles.star}>
        <Text style={styles.starEmpty}>☆</Text>
        {value >= star && <Text style={styles.starFull}>★</Text>}
        {value === star - 0.5 && <View style={styles.starHalf}><Text style={styles.starFull}>★</Text></View>}
        <Pressable style={styles.starLeft} onPress={() => onChange(star - 0.5)} />
        <Pressable style={styles.starRight} onPress={() => onChange(star)} />
      </View>;
    })}</View>
    <View style={styles.ratingFooter}><Text style={styles.ratingValue}>{value ? ratingText(value) + " / 10" : "Bez oceny"}</Text>{value > 0 && <Pressable onPress={() => onChange(0)}><Text style={styles.ratingClear}>Wyczyść</Text></Pressable>}</View>
  </View>;
}

export default function App() {
  const [items, setItems] = useState([]);
  const itemsRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [tab, setTab] = useState("home");
  const [status, setStatus] = useState("watched");
  const [platform, setPlatform] = useState("Wszystkie");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [editor, setEditor] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState(null);
  const [platformDraft, setPlatformDraft] = useState(null);
  const [ratingDraft, setRatingDraft] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [undo, setUndo] = useState(null);

  useEffect(() => {
    loadAppData()
      .then(({ items: savedItems, welcomeSeen }) => {
        setItems(savedItems);
        setWelcome(!welcomeSeen);
      })
      .catch(() => {
        setItems([]);
        setWelcome(true);
        setStorageError("Nie udało się odczytać zapisanej listy.");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    itemsRef.current = items;
    if (ready) saveItems(items).then(() => setStorageError(null)).catch(() => setStorageError("Nie udało się zapisać zmian."));
  }, [items, ready]);

  useEffect(() => {
    const listener = AppState.addEventListener("change", (next) => {
      if (next !== "active") saveItems(itemsRef.current).catch(() => setStorageError("Nie udało się zapisać zmian."));
    });
    return () => listener.remove();
  }, []);

  useEffect(() => {
    const phrase = query.trim();
    if (!hasTmdbToken || phrase.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(!hasTmdbToken && phrase.length >= 2 ? "Dodaj token TMDB w pliku .env, aby korzystać z wyszukiwania." : null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        setResults(await searchTitles(phrase, { signal: controller.signal }));
      } catch (error) {
        if (error?.name !== "AbortError") {
          setResults([]);
          setSearchError("Nie udało się pobrać wyników. Sprawdź połączenie i spróbuj ponownie.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(timer);
  }, [undo]);

  const persist = (updater) => setItems((current) => {
    const next = updater(current);
    itemsRef.current = next;
    return next;
  });

  const openEditor = (item) => {
    setEditor(item);
    setTitleDraft(item.title || "");
    setStatusDraft(item.status || null);
    setPlatformDraft(item.platform || null);
    setRatingDraft(item.rating || 0);
    setNoteDraft(item.note || "");
  };
  const closeEditor = () => setEditor(null);

  const exportBackup = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error("Udostępnianie plików nie jest dostępne na tym urządzeniu.");
      const now = new Date();
      const stamp = now.toISOString().replace(/[:.]/g, "-");
      const fileUri = `${FileSystem.cacheDirectory}Seansownik-kopia-${stamp}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify({ version: 1, exportedAt: now.toISOString(), items }, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: "application/json", dialogTitle: "Zapisz kopię Seansownika", UTI: "public.json" });
    } catch (error) {
      Alert.alert("Nie udało się utworzyć kopii", error?.message || "Spróbuj ponownie za chwilę.");
    }
  };

  const applyImportedBackup = async (importedItems) => {
    try {
      await saveItems(importedItems);
      itemsRef.current = importedItems;
      setItems(importedItems);
      setEditor(null);
      setUndo(null);
      setTab("home");
      setStatus("watched");
      setPlatform("Wszystkie");
      setQuery("");
      setResults([]);
      setStorageError(null);
      Alert.alert("Kopia wczytana", `Przywrócono ${importedItems.length} ${importedItems.length === 1 ? "tytuł" : "tytułów"}.`);
    } catch {
      Alert.alert("Nie udało się wczytać kopii", "Dotychczasowa lista nie została zmieniona.");
    }
  };

  const importBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error("Nie udało się odczytać wybranego pliku.");
      if (asset.size && asset.size > 5 * 1024 * 1024) throw new Error("Plik kopii jest zbyt duży.");

      const text = await FileSystem.readAsStringAsync(asset.uri);
      const { items: importedItems } = parseBackupText(text);
      Alert.alert(
        "Wczytać kopię?",
        `Plik zawiera ${importedItems.length} ${importedItems.length === 1 ? "tytuł" : "tytułów"}. Obecna lista (${items.length}) zostanie zastąpiona.`,
        [
          { text: "Anuluj", style: "cancel" },
          { text: "Wczytaj", style: "destructive", onPress: () => applyImportedBackup(importedItems) }
        ]
      );
    } catch (error) {
      Alert.alert("Nie udało się wczytać kopii", error?.message || "Wybrany plik jest nieprawidłowy. Dotychczasowa lista nie została zmieniona.");
    }
  };
  const visible = useMemo(() => {
    const currentStatus = tab === "list" ? "watchlist" : status;
    const term = query.trim().toLocaleLowerCase("pl");
    const timestamp = currentStatus === "watched" ? watchedTimestamp : (item) => item.updatedAt || item.createdAt || 0;
    return items.filter((item) => item.status === currentStatus && (platform === "Wszystkie" || item.platform === platform) && (!term || item.title.toLocaleLowerCase("pl").includes(term))).sort((a, b) => timestamp(b) - timestamp(a));
  }, [items, platform, query, status, tab]);

  const watchedNumbers = useMemo(() => buildWatchedNumbers(items, platform), [items, platform]);

  const count = (key) => items.filter((item) => item.status === key).length;
  const resetSearch = () => { setQuery(""); setResults([]); };
  const showDuplicate = (existing) => {
    const category = statuses.find((item) => item.key === existing.status)?.label || "liście";
    Alert.alert(
      "Ten tytuł już jest na liście",
      `„${existing.title}” znajduje się w kategorii „${category}” na platformie ${existing.platform}.`,
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Otwórz wpis", onPress: () => { setTab("home"); setStatus(existing.status); setPlatform(existing.platform || "Wszystkie"); resetSearch(); openEditor(existing); } }
      ]
    );
  };
  const openNewTitle = (candidate) => {
    const duplicate = findDuplicate(items, candidate);
    if (duplicate) return showDuplicate(duplicate);
    openEditor(candidate);
  };
  const selectTab = (next) => {
    Keyboard.dismiss();
    setTab(next);
    resetSearch();
    if (next === "list") { setStatus("watchlist"); setPlatform("Wszystkie"); }
  };
  const addManual = () => {
    const title = query.trim();
    if (!title) return;
    openNewTitle({ id: "manual-" + Date.now(), title, type: "Film / serial", year: "", info: "Dodano ręcznie", createdAt: Date.now() });
  };
  const save = () => {
    const finalTitle = titleDraft.trim();
    if (!finalTitle) return Alert.alert("Brak tytułu", "Wpisz nazwę filmu albo serialu.");
    if (!statusDraft || !platformDraft) return Alert.alert("Wybierz miejsce", "Wybierz kategorię i platformę.");
    const editingExisting = items.some((item) => item.id === editor.id);
    const duplicate = findDuplicate(items, { ...editor, title: finalTitle }, editingExisting ? editor.id : null);
    if (duplicate) return showDuplicate(duplicate);
    const now = Date.now();
    const watchedAt = statusDraft === "watched"
      ? (editor.status === "watched" ? editor.watchedAt || editor.updatedAt || editor.createdAt || now : now)
      : null;
    const saved = { ...editor, title: finalTitle, status: statusDraft, platform: platformDraft, rating: ratingDraft || null, note: noteDraft.trim(), createdAt: editor.createdAt || now, updatedAt: now, watchedAt, info: editor.info || "Dodano z bazy TMDB" };
    persist((current) => [saved, ...current.filter((item) => item.id !== editor.id)]);
    setStatus(statusDraft);
    setPlatform(platformDraft);
    resetSearch();
    closeEditor();
  };
  const remove = () => {
    const target = editor;
    if (!target || !items.some((item) => item.id === target.id)) return;
    Alert.alert("Usunąć tytuł?", "Czy na pewno chcesz usunąć „" + target.title + "”?", [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: () => { persist((current) => current.filter((item) => item.id !== target.id)); setUndo(target); closeEditor(); } }
    ]);
  };
  const restore = () => { if (undo) persist((current) => current.some((item) => item.id === undo.id) ? current : [undo, ...current]); setUndo(null); };
  const dismissWelcome = () => { setWelcome(false); saveWelcomeSeen().catch(() => setStorageError("Nie udało się zapisać ustawień.")); };

  const currentStatus = tab === "list" ? "watchlist" : status;
  const currentLabel = statuses.find((item) => item.key === currentStatus).label;

  const card = (item) => <View key={item.id} style={styles.card}>
    {item.status === "watched" ? <View style={styles.watchNumber}><Text style={styles.watchNumberText}>{watchedNumbers.get(item.id)}</Text></View> : null}
    {item.poster ? <Image source={{ uri: item.poster }} style={styles.poster} /> : <View style={styles.posterFallback}><Text style={styles.posterFallbackText}>{initials(item.title)}</Text></View>}
    <View style={styles.cardCopy}>
      <View style={styles.cardTitleLine}>{item.rating ? <View style={styles.ratingPill}><Ionicons name="star" color="#996200" size={10} /><Text style={styles.ratingPillText}>{ratingText(item.rating)}</Text></View> : null}<Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text></View>
      <View style={styles.cardMetaLine}><Text style={styles.typeTag}>{item.type}</Text><Text numberOfLines={1} style={styles.cardMeta}>{item.year ? item.year + " · " : ""}{item.info || "Dodano z bazy TMDB"}</Text></View>
      {item.note ? <Text numberOfLines={1} style={styles.notePreview}>{item.note}</Text> : null}
    </View>
    <Brand name={item.platform} small />
    <Pressable onPress={() => openEditor(item)} accessibilityLabel={"Edytuj " + item.title} hitSlop={8} style={styles.gear}><Text style={styles.gearText}>⚙</Text></Pressable>
  </View>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <Modal visible={welcome} animationType="fade" statusBarTranslucent><View style={styles.welcome}>
      <View style={styles.orbOne} /><View style={styles.orbTwo} />
      <View style={styles.welcomeTop}><View style={styles.welcomeLogo}><Ionicons name="play" size={30} color="#171923" /></View><Text style={styles.welcomeName}>Seansownik</Text><Text style={styles.welcomeSub}>Twój prywatny przewodnik po seansach.</Text></View>
      <View style={styles.welcomeCard}><Text style={styles.welcomeCardTitle}>W kilka sekund:</Text><Text style={styles.welcomeLine}>• znajdziesz film lub serial</Text><Text style={styles.welcomeLine}>• zapiszesz gdzie go oglądasz</Text><Text style={styles.welcomeLine}>• wrócisz do listy kiedy chcesz</Text></View>
      <View><Pressable onPress={dismissWelcome} style={styles.welcomeButton}><Text style={styles.welcomeButtonText}>Zaczynamy</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable><Text style={styles.myszo}>✦ Appka zrobiona przez Myszo</Text></View>
    </View></Modal>

    <KeyboardAvoidingView style={styles.app} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: 14 + androidTopInset }]}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>{tab === "list" ? "TWOJA PÓŹNIEJSZA LISTA" : "DOBRY WIECZÓR"}</Text><Text style={styles.heading}>{tab === "list" ? "Moja lista" : "Co oglądamy?"}</Text></View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={importBackup} accessibilityLabel="Wczytaj kopię listy" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}><Ionicons name="download-outline" size={20} color="#171923" /></Pressable>
            <Pressable onPress={exportBackup} accessibilityLabel="Eksportuj kopię listy" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}><Ionicons name="share-outline" size={20} color="#171923" /></Pressable>
          </View>
        </View>
        <View style={styles.search}><Ionicons name="search" size={19} color="#858A96" /><TextInput value={query} onChangeText={setQuery} placeholder="Szukaj filmu lub serialu" placeholderTextColor="#999EAA" style={styles.searchInput} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} /></View>
        {tab === "home" && <View style={styles.statuses}>{statuses.map((item) => <Pressable key={item.key} onPress={() => setStatus(item.key)} style={[styles.statusButton, status === item.key && styles.statusButtonOn]}><Ionicons name={item.icon} size={14} color={status === item.key ? "#fff" : "#707581"} /><Text style={[styles.statusText, status === item.key && styles.statusTextOn]}>{item.label} {count(item.key)}</Text></Pressable>)}</View>}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {(searchError || storageError) && <View style={{ backgroundColor: "#FFF1F0", borderColor: "#FDA29B", borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 8 }}><Text style={{ color: "#B42318", fontSize: 12, fontWeight: "700" }}>{searchError || storageError}</Text></View>}
        {(searching || results.length > 0) && <View style={styles.results}>{searching ? <Text style={styles.resultsHint}>Szukam tytułów…</Text> : results.map((item) => <Pressable key={item.id} onPress={() => openNewTitle({ ...item, info: "Dodano z bazy TMDB" })} style={styles.result}><View>{item.poster ? <Image source={{ uri: item.poster }} style={styles.resultPoster} /> : <View style={styles.resultPosterFallback}><Text>{initials(item.title)}</Text></View>}</View><View style={styles.resultCopy}><Text numberOfLines={1} style={styles.resultTitle}>{item.title}</Text><Text style={styles.resultMeta}>{item.type}{item.year ? " · " + item.year : ""}</Text></View><Ionicons name="add-circle" color="#1B1E29" size={24} /></Pressable>)}</View>}
        {query.trim().length > 0 && <Pressable onPress={addManual} style={styles.manual}><Ionicons name="create-outline" color="#fff" size={17} /><Text style={styles.manualText}>Nie ma tytułu? Dodaj ręcznie</Text></Pressable>}

        <Text style={styles.platformLabel}>PLATFORMA</Text>
        <View style={styles.platforms}>{platforms.map((name) => { const selected = platform === name; const item = details[name]; return <Pressable key={name} onPress={() => setPlatform(name)} style={[styles.platform, selected && { backgroundColor: item.soft, borderColor: item.color }]}><Brand name={name} /><Text numberOfLines={1} style={[styles.platformText, selected && { color: item.color }]}>{name}</Text></Pressable>; })}</View>
        <View style={styles.section}><View><Text style={styles.sectionKicker}>{platform === "Wszystkie" ? "WSZYSTKIE PLATFORMY" : platform.toUpperCase()}</Text><Text style={styles.sectionTitle}>{currentLabel}</Text></View><View style={styles.counter}><Text style={styles.counterText}>{visible.length}</Text></View></View>
        {visible.length ? visible.map(card) : <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="film-outline" size={30} color="#727887" /></View><Text style={styles.emptyTitle}>Tu będzie Twoja lista</Text><Text style={styles.emptyText}>Wyszukaj film lub serial u góry i zapisz go w wybranej kategorii.</Text></View>}
        <Text style={{ color: "#9297A2", fontSize: 9, lineHeight: 13, textAlign: "center", marginTop: 16 }}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Text>
      </ScrollView>

      {undo && <View style={styles.undo}><Text numberOfLines={1} style={styles.undoLabel}>Usunięto: {undo.title}</Text><Pressable onPress={restore} style={styles.undoButton}><Text style={styles.undoButtonText}>Cofnij</Text></Pressable></View>}
      <View style={styles.nav}><Pressable onPress={() => selectTab("home")} style={[styles.navItem, tab === "home" && styles.navItemOn]}><Ionicons name="home-outline" size={19} color={tab === "home" ? "#171923" : "#7A808C"} /><Text style={[styles.navText, tab === "home" && styles.navTextOn]}>Start</Text></Pressable><Pressable onPress={() => selectTab("list")} style={[styles.navItem, tab === "list" && styles.navItemOn]}><Ionicons name="bookmark-outline" size={19} color={tab === "list" ? "#171923" : "#7A808C"} /><Text style={[styles.navText, tab === "list" && styles.navTextOn]}>Moja lista</Text></Pressable></View>
    </KeyboardAvoidingView>

    <Modal visible={Boolean(editor)} animationType="slide" onRequestClose={closeEditor} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.modal, { paddingTop: androidTopInset, paddingBottom: androidBottomInset }]}><StatusBar style="light" />
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.sheet}>{editor && <>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.sheetHeader}><Pressable onPress={closeEditor} style={styles.back}><Ionicons name="arrow-back" size={16} color="#fff" /><Text style={styles.backText}>Wróć</Text></Pressable><View style={styles.sheetTitleBox}><Text style={styles.sheetEyebrow}>EDYCJA TYTUŁU</Text>{String(editor.id).startsWith("manual-") ? <TextInput value={titleDraft} onChangeText={setTitleDraft} autoFocus placeholder="Wpisz tytuł" placeholderTextColor="#9096A4" style={styles.manualTitle} /> : <Text numberOfLines={2} style={styles.sheetTitle}>{editor.title}</Text>}</View>{editor.poster ? <Image source={{ uri: editor.poster }} style={styles.sheetPoster} /> : <View style={styles.sheetPosterFallback}><Text style={styles.sheetPosterText}>{initials(editor.title)}</Text></View>}</View>
              <Text style={styles.sheetLabel}>Gdzie chcesz go umieścić?</Text><View style={styles.editorStatuses}>{statuses.map((item) => <Pressable key={item.key} onPress={() => { setStatusDraft(item.key); if (!platformDraft) setPlatformDraft("Netflix"); }} style={[styles.editorStatus, statusDraft === item.key && styles.editorStatusOn]}><Ionicons name={item.icon} size={16} color={statusDraft === item.key ? "#171923" : "#EFF0F4"} /><Text style={[styles.editorStatusText, statusDraft === item.key && styles.editorStatusTextOn]}>{item.label}</Text></Pressable>)}</View>
              <Text style={styles.sheetLabel}>Oceń tytuł</Text><Rating value={ratingDraft} onChange={setRatingDraft} />
              <Text style={styles.sheetLabel}>Notatka</Text><TextInput value={noteDraft} onChangeText={setNoteDraft} multiline placeholder="np. obejrzeć w weekend" placeholderTextColor="#8B91A0" style={styles.noteInput} />
              <Text style={styles.sheetLabel}>Platforma</Text><View style={styles.editorPlatforms}>{platforms.filter((name) => name !== "Wszystkie").map((name) => { const item = details[name]; const selected = platformDraft === name; return <Pressable disabled={!statusDraft} key={name} onPress={() => setPlatformDraft(name)} style={[styles.editorPlatform, !statusDraft && styles.editorPlatformOff, selected && { backgroundColor: item.soft, borderColor: item.color }]}><Brand name={name} small /><Text numberOfLines={1} style={[styles.editorPlatformText, selected && { color: item.color }]}>{name}</Text></Pressable>; })}</View>
            </ScrollView>
            <View style={styles.sheetActions}><Pressable onPress={save} style={styles.save}><Ionicons name="checkmark" size={21} color="#171923" /><Text style={styles.saveText}>Zapisz zmiany</Text></Pressable>{items.some((item) => item.id === editor.id) && <Pressable onPress={remove} style={styles.remove}><Ionicons name="trash-outline" size={17} color="#FFB5BD" /><Text style={styles.removeText}>Usuń z listy</Text></Pressable>}</View>
          </>}</View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  watchNumber:{width:28,height:28,borderRadius:14,backgroundColor:"#EEF0F5",alignItems:"center",justifyContent:"center"},
  watchNumberText:{fontSize:12,fontWeight:"900",color:"#454B58"},
  safe:{flex:1,backgroundColor:"#F5F6FA"}, app:{flex:1,backgroundColor:"#F5F6FA"}, top:{paddingHorizontal:18,paddingTop:14,paddingBottom:8,backgroundColor:"#F5F6FA"}, header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}, eyebrow:{fontSize:10,letterSpacing:1.2,fontWeight:"900",color:"#858A96",marginBottom:4}, heading:{fontSize:31,letterSpacing:-1.1,fontWeight:"900",color:"#171923"}, avatar:{width:42,height:42,borderRadius:21,backgroundColor:"#171923",alignItems:"center",justifyContent:"center",elevation:4},avatarText:{color:"#fff",fontWeight:"900",fontSize:16}, search:{height:52,marginTop:18,backgroundColor:"#fff",borderRadius:16,borderWidth:1,borderColor:"#E5E7ED",paddingHorizontal:15,alignItems:"center",flexDirection:"row"},searchInput:{flex:1,marginLeft:9,color:"#1A1D28",fontSize:15,fontWeight:"600"},statuses:{flexDirection:"row",gap:7,marginTop:10},statusButton:{minHeight:38,flex:1,borderRadius:12,borderWidth:1,borderColor:"#E5E7ED",backgroundColor:"#fff",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:4},statusButtonOn:{backgroundColor:"#171923",borderColor:"#171923"},statusText:{fontSize:10,fontWeight:"800",color:"#6D727E"},statusTextOn:{color:"#fff"},body:{flex:1},bodyContent:{paddingHorizontal:18,paddingTop:6,paddingBottom:12},results:{backgroundColor:"#fff",borderRadius:16,borderWidth:1,borderColor:"#E5E7ED",overflow:"hidden",marginBottom:8},resultsHint:{padding:14,color:"#737986",fontSize:13,fontWeight:"700"},result:{minHeight:68,padding:8,gap:10,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderColor:"#F0F1F5"},resultPoster:{width:34,height:51,borderRadius:7,backgroundColor:"#E5E7ED"},resultPosterFallback:{width:34,height:51,borderRadius:7,backgroundColor:"#E5E7ED",alignItems:"center",justifyContent:"center"},resultCopy:{flex:1,minWidth:0},resultTitle:{color:"#1B1E29",fontSize:14,fontWeight:"800"},resultMeta:{color:"#818693",fontSize:11,marginTop:3,fontWeight:"600"},manual:{minHeight:44,backgroundColor:"#171923",borderRadius:13,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7,marginBottom:10},manualText:{color:"#fff",fontSize:13,fontWeight:"900"},platformLabel:{fontSize:10,letterSpacing:1.2,fontWeight:"900",color:"#858A96",marginTop:4,marginBottom:8},platforms:{flexDirection:"row",flexWrap:"wrap"},platform:{width:"22%",minHeight:67,alignItems:"center",justifyContent:"center",borderRadius:15,borderWidth:1,borderColor:"#E2E5EC",backgroundColor:"#fff",paddingVertical:7,paddingHorizontal:2,marginRight:"3%",marginBottom:8},brand:{alignItems:"center",justifyContent:"center",overflow:"hidden"},brandImage:{width:"100%",height:"100%",resizeMode:"contain"},brandAll:{color:"#fff",fontWeight:"900",fontSize:8},platformText:{marginTop:4,fontSize:8,fontWeight:"900",color:"#626874",maxWidth:"96%"},section:{marginTop:20,marginBottom:10,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between"},sectionKicker:{fontSize:10,letterSpacing:1,fontWeight:"900",color:"#858A96"},sectionTitle:{marginTop:3,color:"#171923",fontSize:24,letterSpacing:-0.6,fontWeight:"900"},counter:{minWidth:29,height:29,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:"#E6E9F0"},counterText:{fontSize:12,fontWeight:"900",color:"#3F4552"},card:{minHeight:96,flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"#fff",borderWidth:1,borderColor:"#EAEBF0",borderRadius:18,padding:9,marginBottom:9,elevation:1},poster:{width:55,height:76,borderRadius:12,backgroundColor:"#E6E9EF"},posterFallback:{width:55,height:76,borderRadius:12,backgroundColor:"#DCE2F0",alignItems:"center",justifyContent:"center"},posterFallbackText:{fontSize:16,fontWeight:"900",color:"#3C4353"},cardCopy:{flex:1,minWidth:0},cardTitleLine:{flexDirection:"row",alignItems:"center",gap:5},ratingPill:{backgroundColor:"#FFF4D5",borderRadius:7,paddingHorizontal:5,paddingVertical:3,flexDirection:"row",alignItems:"center",gap:2},ratingPillText:{fontSize:10,fontWeight:"900",color:"#905E00"},cardTitle:{flex:1,color:"#1A1D28",fontSize:15,fontWeight:"900"},cardMetaLine:{flexDirection:"row",alignItems:"center",gap:5,marginTop:6},typeTag:{fontSize:9,fontWeight:"800",color:"#5E6470",backgroundColor:"#EFF1F5",borderRadius:5,paddingHorizontal:5,paddingVertical:3},cardMeta:{flex:1,color:"#8B909B",fontSize:10,fontWeight:"600"},notePreview:{fontSize:11,fontStyle:"italic",color:"#6E7480",marginTop:5},gear:{width:36,height:36,borderRadius:12,backgroundColor:"#252936",alignItems:"center",justifyContent:"center",elevation:2},gearText:{fontSize:20,lineHeight:23,color:"#fff",fontWeight:"900"},empty:{alignItems:"center",backgroundColor:"#fff",borderRadius:20,borderWidth:1,borderColor:"#E5E8EF",paddingHorizontal:30,paddingVertical:36},emptyIcon:{width:55,height:55,borderRadius:18,backgroundColor:"#EEF1F6",alignItems:"center",justifyContent:"center",marginBottom:12},emptyTitle:{fontSize:16,fontWeight:"900",color:"#272B37"},emptyText:{fontSize:12,lineHeight:18,color:"#858B97",textAlign:"center",marginTop:6},undo:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"#242733",borderRadius:13,marginHorizontal:18,marginBottom:8,paddingLeft:12,paddingRight:6,paddingVertical:7},undoLabel:{flex:1,color:"#fff",fontSize:12,fontWeight:"700"},undoButton:{backgroundColor:"#fff",borderRadius:9,paddingHorizontal:12,paddingVertical:8},undoButtonText:{fontSize:12,fontWeight:"900",color:"#1B1E29"},nav:{minHeight:63,paddingHorizontal:18,paddingTop:7,paddingBottom:8,backgroundColor:"#fff",borderTopWidth:1,borderColor:"#E7E9EF",flexDirection:"row",gap:8},navItem:{flex:1,borderRadius:14,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7},navItemOn:{backgroundColor:"#EEF0F5"},navText:{fontSize:12,fontWeight:"800",color:"#7A808C"},navTextOn:{color:"#171923",fontWeight:"900"},modal:{flex:1,backgroundColor:"#191B24"},modalKeyboard:{flex:1},sheet:{flex:1,backgroundColor:"#191B24",overflow:"hidden"},sheetScroll:{flexShrink:1},sheetContent:{padding:18,paddingBottom:24},sheetActions:{paddingHorizontal:18,paddingTop:12,paddingBottom:14,borderTopWidth:1,borderColor:"#343844",backgroundColor:"#191B24"},sheetHeader:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:18},back:{height:36,paddingHorizontal:10,borderRadius:12,backgroundColor:"#2A2D38",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:5},backText:{color:"#fff",fontSize:12,fontWeight:"900"},sheetTitleBox:{flex:1,minWidth:0},sheetEyebrow:{fontSize:9,letterSpacing:1.1,fontWeight:"900",color:"#9298A6",marginBottom:4},sheetTitle:{fontSize:17,fontWeight:"900",color:"#fff"},manualTitle:{minHeight:38,borderBottomWidth:1,borderColor:"#5B6170",color:"#fff",fontSize:17,fontWeight:"900"},sheetPoster:{width:42,height:42,borderRadius:13},sheetPosterFallback:{width:42,height:42,borderRadius:13,backgroundColor:"#303542",alignItems:"center",justifyContent:"center"},sheetPosterText:{color:"#fff",fontSize:11,fontWeight:"900"},sheetLabel:{fontSize:12,fontWeight:"800",color:"#CFD2DB",marginTop:16,marginBottom:8},editorStatuses:{flexDirection:"row",gap:7},editorStatus:{flex:1,minHeight:48,borderRadius:12,borderWidth:1,borderColor:"#464B59",backgroundColor:"#252833",alignItems:"center",justifyContent:"center",gap:3},editorStatusOn:{backgroundColor:"#fff",borderColor:"#fff"},editorStatusText:{fontSize:10,fontWeight:"900",color:"#EFF0F4"},editorStatusTextOn:{color:"#171923"},rating:{borderRadius:15,backgroundColor:"#11131A",borderWidth:1,borderColor:"#343844",paddingHorizontal:7,paddingVertical:10},stars:{flexDirection:"row",justifyContent:"space-between"},star:{width:28,height:31,position:"relative",overflow:"hidden",alignItems:"center",justifyContent:"center"},starEmpty:{fontSize:25,lineHeight:30,color:"#737989"},starFull:{position:"absolute",fontSize:25,lineHeight:30,color:"#FFC43D"},starHalf:{position:"absolute",left:0,top:0,width:14,height:31,overflow:"hidden"},starLeft:{position:"absolute",left:0,top:0,bottom:0,width:"50%"},starRight:{position:"absolute",right:0,top:0,bottom:0,width:"50%"},ratingFooter:{marginTop:6,paddingHorizontal:3,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},ratingValue:{fontSize:12,fontWeight:"900",color:"#F1F2F6"},ratingClear:{fontSize:11,fontWeight:"900",color:"#FFC43D"},noteInput:{minHeight:74,borderWidth:1,borderColor:"#414755",backgroundColor:"#252833",borderRadius:13,color:"#fff",padding:11,textAlignVertical:"top",fontSize:13},editorPlatforms:{flexDirection:"row",flexWrap:"wrap",gap:7},editorPlatform:{width:"23.3%",minHeight:57,borderRadius:12,borderWidth:1,borderColor:"#424755",backgroundColor:"#252833",alignItems:"center",justifyContent:"center",paddingVertical:5,paddingHorizontal:2},editorPlatformOff:{opacity:0.35},editorPlatformText:{marginTop:3,fontSize:7,fontWeight:"900",color:"#ECEEF3",maxWidth:"96%"},save:{minHeight:52,marginTop:0,borderRadius:15,backgroundColor:"#fff",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7},saveText:{fontSize:14,fontWeight:"900",color:"#171923"},remove:{minHeight:48,marginTop:10,borderRadius:14,borderWidth:1,borderColor:"#713D46",backgroundColor:"#2C2025",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7},removeText:{fontSize:13,fontWeight:"900",color:"#FFB5BD"},welcome:{flex:1,backgroundColor:"#F6F7FB",paddingHorizontal:26,paddingTop:76,paddingBottom:34,justifyContent:"space-between",overflow:"hidden"},orbOne:{position:"absolute",width:260,height:260,borderRadius:130,backgroundColor:"#DDE8FF",top:-95,right:-70},orbTwo:{position:"absolute",width:210,height:210,borderRadius:105,backgroundColor:"#F3DCF9",bottom:45,left:-105},welcomeTop:{alignItems:"center"},welcomeLogo:{width:84,height:84,borderRadius:29,backgroundColor:"#fff",alignItems:"center",justifyContent:"center",elevation:5,marginBottom:20},welcomeName:{fontSize:35,letterSpacing:-1.2,fontWeight:"900",color:"#171923"},welcomeSub:{fontSize:15,fontWeight:"600",color:"#6D7280",marginTop:8,textAlign:"center"},welcomeCard:{backgroundColor:"rgba(255,255,255,0.82)",borderRadius:23,padding:19,borderWidth:1,borderColor:"#EAECF2"},welcomeCardTitle:{fontSize:15,fontWeight:"900",color:"#242733",marginBottom:12},welcomeLine:{fontSize:13,lineHeight:25,fontWeight:"600",color:"#696F7C"},welcomeButton:{minHeight:55,borderRadius:17,backgroundColor:"#171923",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},welcomeButtonText:{fontSize:15,fontWeight:"900",color:"#fff"},myszo:{fontSize:12,fontWeight:"700",color:"#737986",textAlign:"center",marginTop:18}
});
