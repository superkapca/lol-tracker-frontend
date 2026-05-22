<script setup>
import { computed, onMounted, ref } from "vue";
import { championIcon, itemIcon, loadDataDragon, spellIcon } from "./lib/ddragon";
import { compact, dateTime, duration } from "./lib/format";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const isNotFound = window.location.pathname !== "/";
const form = ref({ gameName: "", tagLine: "", count: "10" });
const lastSearch = ref({ gameName: "Faker", tagLine: "T1" });
const status = ref(isNotFound ? "404" : "search");
const activeSection = ref("history");
const pageLoading = ref(false);
const errorMessage = ref("");
const responseData = ref(null);
const utilityData = ref(null);
const selectedLeaderboardRegion = ref("euw1");
const expandedMatchId = ref(null);
const selectedQueueFilter = ref("All");
const selectedResultFilter = ref("All");
const selectedChampionFilter = ref("");
const nextStart = ref(0);
const isLoadingMore = ref(false);
const isPrefetchingMore = ref(false);
const ddragon = ref({ version: "15.10.1", summonerSpellsById: {}, championsById: {} });

onMounted(async () => {
  ddragon.value = await loadDataDragon();
  window.history.replaceState(currentHistoryState(), "", window.location.href);
  window.addEventListener("popstate", restoreHistoryState);
});

const matches = computed(() => responseData.value?.matches || []);
const queueOptions = computed(() => {
  const names = [...new Set(matches.value.map((match) => match.queue_name).filter(Boolean))];
  return ["All", ...names.sort()];
});
const filteredMatches = computed(() => {
  const championFilter = selectedChampionFilter.value.trim().toLowerCase();
  return matches.value.filter((match) => {
    const queueMatch = selectedQueueFilter.value === "All" || match.queue_name === selectedQueueFilter.value;
    const resultMatch =
      selectedResultFilter.value === "All" ||
      (selectedResultFilter.value === "Victory" ? match.searched_player?.win : !match.searched_player?.win);
    const championMatch =
      !championFilter ||
      match.searched_player?.champion_name?.toLowerCase().includes(championFilter);
    return queueMatch && resultMatch && championMatch;
  });
});
const player = computed(() => matches.value.find((match) => match.searched_player)?.searched_player);
const wins = computed(() => matches.value.filter((match) => match.searched_player?.win).length);
const losses = computed(() => matches.value.filter((match) => match.searched_player && !match.searched_player.win).length);
const winRate = computed(() => {
  const total = wins.value + losses.value;
  return total ? Math.round((wins.value / total) * 100) : 0;
});
const aggregateStats = computed(() => {
  const loaded = matches.value.map((match) => match.searched_player).filter(Boolean);
  const games = loaded.length || 1;
  const totals = loaded.reduce(
    (acc, entry) => {
      acc.kills += entry.kills || 0;
      acc.deaths += entry.deaths || 0;
      acc.assists += entry.assists || 0;
      acc.damage += entry.total_damage_dealt_to_champions || 0;
      acc.cs += entry.total_cs || 0;
      acc.gold += entry.gold_earned || 0;
      acc.vision += entry.vision_score || 0;
      return acc;
    },
    { kills: 0, deaths: 0, assists: 0, damage: 0, cs: 0, gold: 0, vision: 0 }
  );
  return {
    games: loaded.length,
    avgKda: totals.deaths === 0 ? totals.kills + totals.assists : ((totals.kills + totals.assists) / totals.deaths).toFixed(2),
    avgDamage: Math.round(totals.damage / games),
    avgCs: Math.round(totals.cs / games),
    avgGold: Math.round(totals.gold / games),
    avgVision: Math.round(totals.vision / games),
  };
});
const championStats = computed(() => {
  const totals = new Map();
  for (const match of matches.value) {
    const entry = match.searched_player;
    if (!entry?.champion_name) continue;
    const current = totals.get(entry.champion_name) || { champion: entry.champion_name, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0 };
    current.games += 1;
    current.wins += entry.win ? 1 : 0;
    current.kills += entry.kills || 0;
    current.deaths += entry.deaths || 0;
    current.assists += entry.assists || 0;
    current.damage += entry.total_damage_dealt_to_champions || 0;
    totals.set(entry.champion_name, current);
  }
  return [...totals.values()].sort((a, b) => b.games - a.games);
});

async function searchPlayer(gameName = form.value.gameName, tagLine = form.value.tagLine) {
  const cleanName = gameName.trim();
  const cleanTag = tagLine.trim();
  if (!cleanName || !cleanTag) {
    showError("Enter both a game name and a tag line.");
    return;
  }

  form.value.gameName = cleanName;
  form.value.tagLine = cleanTag;
  lastSearch.value = { gameName: cleanName, tagLine: cleanTag };
  status.value = "loading";
  errorMessage.value = "";

  try {
    const params = new URLSearchParams({ game_name: cleanName, tag_line: cleanTag, count: "10" });
    const res = await fetch(`${apiBaseUrl}/matches?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "The backend returned an error.");
    responseData.value = data;
    expandedMatchId.value = data.matches?.[0]?.match_id || null;
    nextStart.value = data.next_start || data.matches?.length || 0;
    activeSection.value = "history";
    status.value = "dashboard";
    pushInternalHistory();
    loadMoreMatches({ silent: true, countOverride: "10" });
  } catch (error) {
    showError(error.message || "Could not load match data.");
  }
}

async function loadMoreMatches({ silent = false, countOverride = form.value.count } = {}) {
  if (!lastSearch.value.gameName || !lastSearch.value.tagLine || isLoadingMore.value || isPrefetchingMore.value) return;
  if (silent) {
    isPrefetchingMore.value = true;
  } else {
    isLoadingMore.value = true;
  }
  errorMessage.value = "";

  try {
    const params = new URLSearchParams({
      game_name: lastSearch.value.gameName,
      tag_line: lastSearch.value.tagLine,
      count: countOverride,
      start: String(nextStart.value),
    });
    const res = await fetch(`${apiBaseUrl}/matches?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load more matches.");

    const existingIds = new Set(responseData.value?.match_ids || []);
    const newMatches = (data.matches || []).filter((match) => !existingIds.has(match.match_id));
    responseData.value = {
      ...data,
      match_ids: [...(responseData.value?.match_ids || []), ...newMatches.map((match) => match.match_id)],
      matches: [...matches.value, ...newMatches],
    };
    nextStart.value = data.next_start || nextStart.value + (data.match_ids?.length || 0);
  } catch (error) {
    if (!silent) {
      errorMessage.value = error.message || "Could not load more matches.";
    }
  } finally {
    if (silent) {
      isPrefetchingMore.value = false;
    } else {
      isLoadingMore.value = false;
    }
  }
}

function showError(message) {
  errorMessage.value = message;
  status.value = "error";
}

function backToSearch() {
  status.value = "search";
  errorMessage.value = "";
}

async function openPage(page) {
  if (page === "dashboard") {
    status.value = responseData.value ? "dashboard" : "search";
    pushInternalHistory();
    return;
  }

  status.value = page;
  pageLoading.value = true;
  errorMessage.value = "";

  try {
    const endpoint = {
      leaderboards: `/api/leaderboards?region=${selectedLeaderboardRegion.value}`,
      globalChampions: "/api/champions",
      proPlay: "/api/pro-play",
      settings: "/api/settings",
    }[page];
    const res = await fetch(`${apiBaseUrl}${endpoint}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load this page.");
    utilityData.value = data;
    pushInternalHistory();
  } catch (error) {
    utilityData.value = null;
    errorMessage.value = error.message || "Could not load this page.";
  } finally {
    pageLoading.value = false;
  }
}

function icon(name, extra = "") {
  return `<span class="material-symbols-outlined ${extra}">${name}</span>`;
}

function champSrc(name) {
  return championIcon(ddragon.value.version, name);
}

function itemSrc(id) {
  return itemIcon(ddragon.value.version, id);
}

function spellSrc(id) {
  return spellIcon(ddragon.value.version, id, ddragon.value.summonerSpellsById);
}

function banSrc(id) {
  const championName = ddragon.value.championsById[Number(id)];
  return championName ? champSrc(championName) : "";
}

function team(match, teamId) {
  return (match.teams || []).find((entry) => entry.team_id === teamId) || {};
}

function participants(match, teamId) {
  return (match.participants || []).filter((entry) => entry.team_id === teamId);
}

function toggleMatch(matchId) {
  expandedMatchId.value = expandedMatchId.value === matchId ? null : matchId;
}

function setSection(section) {
  activeSection.value = section;
  if (section === "live" && matches.value[0]) {
    expandedMatchId.value = matches.value[0].match_id;
  }
  pushInternalHistory();
}

function currentHistoryState() {
  return {
    app: "riftstats",
    status: status.value,
    activeSection: activeSection.value,
  };
}

function pushInternalHistory() {
  const state = currentHistoryState();
  const query = new URLSearchParams();
  query.set("view", state.status);
  if (state.status === "dashboard") query.set("tab", state.activeSection);
  window.history.pushState(state, "", `/?${query.toString()}`);
}

function restoreHistoryState(event) {
  const state = event.state;
  if (!state?.app || state.app !== "riftstats") return;
  status.value = state.status || "search";
  activeSection.value = state.activeSection || "history";
  if (activeSection.value === "live" && matches.value[0]) {
    expandedMatchId.value = matches.value[0].match_id;
  }
}

function searchParticipant(participant) {
  searchDisplayName(participant.display_name);
}

function searchDisplayName(displayName) {
  const [name, tag] = (displayName || "").split("#");
  if (!name || !tag) return;
  searchPlayer(name, tag);
}

function teamGold(match, teamId) {
  return compact(participants(match, teamId).reduce((sum, entry) => sum + (entry.gold_earned || 0), 0));
}

function teamObjective(teamData, key) {
  return teamData.objectives?.[key]?.kills ?? 0;
}

const trending = [
  ["Hide on bush", "KR1"],
  ["Chovy", "GEN"],
  ["Doran", "KR1"]
];
</script>

<template>
  <div class="min-h-screen bg-[#0B0B0C] text-on-surface antialiased">
    <header v-if="status !== 'dashboard'" class="bg-surface border-b border-outline-variant sticky top-0 z-50">
      <div class="mx-auto flex max-w-[1440px] items-center justify-between px-margin py-sm">
        <button class="font-display-lg text-display-lg font-black tracking-tighter text-primary" @click="openPage('dashboard')">RIFTSTATS</button>
        <nav class="hidden gap-md font-headline-md text-headline-md md:flex">
          <button :class="status === 'search' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'" @click="openPage('dashboard')">Dashboard</button>
          <button :class="status === 'leaderboards' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'" @click="openPage('leaderboards')">Leaderboards</button>
          <button :class="status === 'globalChampions' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'" @click="openPage('globalChampions')">Champions</button>
          <button :class="status === 'proPlay' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'" @click="openPage('proPlay')">Pro Play</button>
        </nav>
        <div class="flex items-center gap-sm text-on-surface-variant">
          <span class="material-symbols-outlined">notifications</span>
          <button class="hover:text-primary" @click="openPage('settings')"><span class="material-symbols-outlined">settings</span></button>
          <div class="grid size-8 place-items-center rounded-full border border-outline-variant bg-surface-container-high">
            <span class="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </div>
    </header>

    <main v-if="status === '404'" class="relative flex min-h-[calc(100vh-61px)] items-center justify-center overflow-hidden px-margin py-xl text-center">
      <div class="absolute inset-0 flex items-center justify-center opacity-10">
        <div class="size-[720px] rounded-full bg-gradient-to-tr from-error to-transparent blur-3xl"></div>
      </div>
      <section class="relative z-10 max-w-4xl">
        <h1 class="text-[140px] font-black leading-none tracking-tighter text-error opacity-90 md:text-[200px]">404</h1>
        <h2 class="font-display-lg text-display-lg uppercase tracking-wide">Nexus Destroyed</h2>
        <p class="mx-auto mt-sm max-w-md font-body-md text-body-md text-on-surface-variant">The data you are searching for has been lost to the void.</p>
        <a class="mt-xl inline-flex items-center gap-sm rounded bg-primary px-xl py-md font-headline-sm text-headline-sm text-on-primary transition hover:bg-primary-container" href="/">
          <span class="material-symbols-outlined">dashboard</span>
          Return to Dashboard
        </a>
      </section>
    </main>

    <main v-else-if="['leaderboards', 'globalChampions', 'proPlay', 'settings'].includes(status)" class="mx-auto min-h-[calc(100vh-61px)] w-full max-w-[1120px] px-margin py-lg">
      <section class="mb-md flex items-center justify-between rounded-lg border border-[#2C2E33] bg-level-1 p-md">
        <div>
          <p class="font-label-caps text-label-caps uppercase tracking-widest text-primary">RIFTSTATS</p>
          <h1 class="font-display-lg text-display-lg">
            {{ status === 'leaderboards' ? 'Leaderboards' : status === 'globalChampions' ? 'Champions' : status === 'proPlay' ? 'Pro Play' : 'Settings' }}
          </h1>
        </div>
        <button class="rounded bg-primary-container px-md py-sm font-headline-sm text-headline-sm text-[#17130c]" @click="openPage('dashboard')">Dashboard</button>
      </section>

      <section v-if="pageLoading" class="rounded-lg border border-[#2C2E33] bg-level-1 p-xl text-center">
        <span class="material-symbols-outlined animate-spin text-5xl text-primary">sync</span>
        <p class="mt-sm font-body-md text-body-md text-on-surface-variant">Loading page data...</p>
      </section>

      <section v-else-if="errorMessage" class="rounded-lg border border-error-container bg-level-1 p-xl text-center">
        <span class="material-symbols-outlined text-5xl text-error">error</span>
        <h2 class="mt-sm font-headline-md text-headline-md">Could not load page</h2>
        <p class="mt-xs font-body-md text-body-md text-on-surface-variant">{{ errorMessage }}</p>
      </section>

      <section v-else-if="status === 'leaderboards'" class="rounded-lg border border-[#2C2E33] bg-level-1 p-md">
        <div class="mb-md flex flex-col gap-sm border-b border-outline-variant pb-sm md:flex-row md:items-center md:justify-between">
          <div><h2 class="font-headline-md text-headline-md">{{ utilityData?.region_name }} Challenger</h2><p class="font-body-sm text-body-sm text-on-surface-variant">Ranked Solo/Duo top ladder</p></div>
          <select v-model="selectedLeaderboardRegion" class="rounded border border-[#2C2E33] bg-[#0B0B0C] px-sm py-sm text-on-surface" @change="openPage('leaderboards')">
            <option value="euw1">Europe West</option>
            <option value="eun1">Europe Nordic & East</option>
            <option value="na1">North America</option>
            <option value="kr">Korea</option>
          </select>
        </div>
        <div class="grid gap-xs">
          <button v-for="playerEntry in utilityData?.players || []" :key="playerEntry.rank" class="grid grid-cols-[48px_minmax(0,1fr)_96px_80px] items-center gap-sm rounded border border-[#2C2E33] bg-[#111214] p-sm text-left transition hover:border-primary hover:bg-level-2 disabled:cursor-not-allowed disabled:opacity-60" :disabled="!playerEntry.summoner_name?.includes('#')" type="button" @click="searchDisplayName(playerEntry.summoner_name)">
            <strong class="text-primary">#{{ playerEntry.rank }}</strong>
            <span class="truncate">{{ playerEntry.summoner_name || 'Hidden Summoner' }}</span>
            <span class="font-stat-sm text-stat-sm">{{ playerEntry.league_points }} LP</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">{{ playerEntry.win_rate }}%</span>
          </button>
        </div>
      </section>

      <section v-else-if="status === 'globalChampions'" class="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="champion in utilityData?.champions || []" :key="champion.id" class="rounded border border-[#2C2E33] bg-level-1 p-sm">
          <div class="flex items-center gap-sm">
            <img class="size-12 rounded-full border border-[#2C2E33]" :src="champion.icon_url" :alt="champion.name" />
            <div class="min-w-0"><strong class="block truncate">{{ champion.name }}</strong><span class="font-body-sm text-body-sm text-on-surface-variant">{{ champion.title }}</span></div>
          </div>
          <div class="mt-sm flex flex-wrap gap-xs"><span v-for="tag in champion.tags" :key="tag" class="rounded bg-level-2 px-2 py-1 font-label-caps text-label-caps text-primary">{{ tag }}</span></div>
        </article>
      </section>

      <section v-else-if="status === 'proPlay'" class="grid gap-sm md:grid-cols-2">
        <article v-for="pro in utilityData?.players || []" :key="pro.name" class="flex items-center justify-between rounded border border-[#2C2E33] bg-level-1 p-md">
          <div><strong class="font-headline-sm text-headline-sm text-primary">{{ pro.name }}</strong><p class="font-body-sm text-body-sm text-on-surface-variant">{{ pro.team }} · {{ pro.role }} · {{ pro.region }}</p></div>
          <button class="rounded bg-primary-container px-sm py-xs font-stat-sm text-stat-sm text-[#17130c]" @click="searchPlayer(pro.name, pro.tag_line)">Search</button>
        </article>
      </section>

      <section v-else class="grid gap-sm md:grid-cols-2">
        <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Riot API Key</span><strong class="mt-xs block text-primary">{{ utilityData?.riot_key_configured ? 'Configured' : 'Missing' }}</strong></div>
        <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Max Matches</span><strong class="mt-xs block">{{ utilityData?.max_match_count }}</strong></div>
        <div class="rounded border border-[#2C2E33] bg-level-1 p-md md:col-span-2"><span class="font-label-caps text-label-caps text-on-surface-variant">Leaderboard Regions</span><p class="mt-xs font-body-md text-body-md text-on-surface-variant">{{ Object.values(utilityData?.supported_leaderboard_regions || {}).join(', ') }}</p></div>
      </section>
    </main>

    <main v-else-if="status === 'search'" class="flex min-h-[calc(100vh-61px)] flex-col md:flex-row">
      <aside class="hidden h-[calc(100vh-61px)] w-64 shrink-0 flex-col gap-sm border-r border-outline-variant bg-surface-container-low p-md md:flex">
        <div class="mb-xl px-sm font-display-lg text-display-lg font-black tracking-tighter text-primary">RIFTSTATS</div>
        <div class="mb-lg flex items-center gap-sm border-b border-[#2C2E33] px-sm pb-md">
          <div class="grid size-12 place-items-center rounded-full border border-outline bg-surface-container-high">
            <span class="material-symbols-outlined text-on-surface-variant">person</span>
          </div>
          <div>
            <h2 class="font-headline-sm text-headline-sm">Summoner Profile</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Challenger Tier</p>
          </div>
        </div>
        <nav class="flex flex-1 flex-col gap-xs font-label-caps text-label-caps">
          <button class="nav-item nav-item-active" @click="openPage('dashboard')"><span class="material-symbols-outlined text-lg">sensors</span>Live Match</button>
          <button class="nav-item" @click="openPage('leaderboards')"><span class="material-symbols-outlined text-lg">history</span>Leaderboards</button>
          <button class="nav-item" @click="openPage('proPlay')"><span class="material-symbols-outlined text-lg">insights</span>Pro Play</button>
          <button class="nav-item" @click="openPage('globalChampions')"><span class="material-symbols-outlined text-lg">groups</span>Champions</button>
          <button class="nav-item mt-auto" @click="openPage('settings')"><span class="material-symbols-outlined text-lg">settings</span>Settings</button>
        </nav>
      </aside>

      <section class="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(200,155,60,0.05),transparent_70%)] px-margin py-xl pb-24 md:pb-xl">
        <span class="material-symbols-outlined pointer-events-none absolute text-[260px] text-primary opacity-10 md:text-[400px]">sports_esports</span>
        <div class="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
          <span class="material-symbols-outlined mb-sm block text-display-lg text-primary">search</span>
          <h1 class="font-display-lg text-display-lg">Find Your Summoner</h1>
          <p class="mx-auto mt-xs max-w-md font-body-md text-body-md text-on-surface-variant">Search for a player by Riot ID to view a larger recent match sample and stronger performance stats.</p>

          <form class="mt-lg flex w-full flex-col gap-xs rounded-lg border border-[#2C2E33] bg-level-1 p-sm shadow-lg md:flex-row" @submit.prevent="searchPlayer()">
            <div class="relative flex-1">
              <span class="material-symbols-outlined pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">person_search</span>
              <input v-model="form.gameName" class="search-input w-full rounded border border-[#2C2E33] bg-[#0B0B0C] py-sm pl-xl pr-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Game Name (e.g. Faker)" />
            </div>
            <div class="relative w-full md:w-32">
              <span class="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 font-stat-sm text-on-surface-variant">#</span>
              <input v-model="form.tagLine" class="search-input w-full rounded border border-[#2C2E33] bg-[#0B0B0C] py-sm pl-lg pr-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Tag Line" />
            </div>
            <select v-model="form.count" class="rounded border border-[#2C2E33] bg-[#0B0B0C] px-sm py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="25">25</option>
            </select>
            <button class="flex items-center justify-center gap-xs rounded bg-primary-container px-lg py-sm font-headline-sm text-headline-sm text-[#17130c] transition hover:bg-primary-fixed">
              <span class="material-symbols-outlined text-sm">search</span>
              <span class="hidden md:inline">Search</span>
            </button>
          </form>

          <div class="mt-md flex flex-col items-center">
            <span class="mb-sm font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">Trending Players</span>
            <div class="flex flex-wrap justify-center gap-sm">
              <button v-for="[name, tag] in trending" :key="name" class="flex items-center gap-xs rounded-full border border-[#2C2E33] bg-surface-container-high px-sm py-xs font-stat-sm text-stat-sm hover:border-primary hover:text-primary" @click="searchPlayer(name, tag)">
                <span class="inline-block size-2 rounded-full bg-primary"></span>
                {{ name }} <span class="text-on-surface-variant">#{{ tag }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <main v-else-if="status === 'loading'" class="flex min-h-[calc(100vh-61px)] overflow-hidden">
      <aside class="hidden h-[calc(100vh-61px)] w-64 shrink-0 flex-col gap-sm border-r border-outline-variant bg-surface-container-low p-md md:flex">
        <div class="flex items-center gap-sm px-2">
          <div class="size-12 rounded-full border border-outline-variant bg-surface-container-high shimmer"></div>
          <div>
            <h2 class="font-headline-sm text-headline-sm text-primary">Summoner Profile</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Challenger Tier</p>
          </div>
        </div>
        <nav class="mt-lg flex flex-1 flex-col gap-xs">
          <button class="nav-item"><span class="material-symbols-outlined">sensors</span>Live Match</button>
          <button class="nav-item nav-item-active"><span class="material-symbols-outlined">history</span>Match History</button>
          <button class="nav-item"><span class="material-symbols-outlined">insights</span>Performance</button>
        </nav>
      </aside>
      <section class="relative flex-1 overflow-hidden bg-background p-md md:p-xl">
        <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div class="relative mb-lg size-24">
            <svg class="absolute inset-0 size-full animate-spin text-primary" style="animation-duration:3s" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" stroke-dasharray="70 200" stroke-linecap="round" stroke-width="2" /></svg>
            <svg class="absolute inset-2 size-20 animate-spin text-secondary [animation-direction:reverse]" style="animation-duration:1.5s" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-dasharray="100 150" stroke-linecap="round" stroke-width="3" /></svg>
            <div class="absolute inset-0 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-4xl">swords</span></div>
          </div>
          <h2 class="font-headline-md text-headline-md text-primary">Fetching Match Data</h2>
          <p class="mt-2 font-body-md text-body-md text-on-surface-variant">Analyzing recent performance for <span class="font-semibold text-primary-fixed">{{ lastSearch.gameName }}#{{ lastSearch.tagLine }}</span></p>
          <div class="mt-6 h-2 w-64 overflow-hidden rounded-full border border-outline-variant bg-surface-container-high"><div class="h-full w-3/4 animate-pulse bg-primary"></div></div>
          <p class="mt-2 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">Fetching Match History...</p>
        </div>
        <div class="grid grid-cols-2 gap-sm opacity-30 md:grid-cols-4">
          <div v-for="i in 4" :key="i" class="rounded border border-outline-variant bg-surface-container-low p-sm"><div class="mb-2 h-4 w-24 rounded bg-surface-container-highest shimmer"></div><div class="h-8 w-16 rounded bg-surface-container-highest shimmer"></div></div>
        </div>
      </section>
    </main>

    <main v-else-if="status === 'error'" class="flex min-h-[calc(100vh-61px)] overflow-hidden">
      <aside class="hidden h-[calc(100vh-61px)] w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low p-md md:flex">
        <div class="mb-lg flex flex-col items-center pt-sm">
          <div class="mb-sm grid size-16 place-items-center rounded-full border border-outline-variant bg-surface-variant"><span class="material-symbols-outlined text-3xl text-on-surface-variant">help</span></div>
          <h2 class="font-headline-sm text-headline-sm">Summoner Profile</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Unknown Tier</p>
        </div>
      </aside>
      <section class="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-md text-center">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,0,10,0.12),#17130c_70%)]"></div>
        <div class="relative z-10 flex max-w-lg flex-col items-center">
          <div class="relative mb-lg"><div class="relative z-10 grid size-24 place-items-center rounded-full border border-error-container/30 bg-error-container/10"><span class="material-symbols-outlined text-5xl text-error">search_off</span></div><div class="absolute inset-0 rounded-full bg-error-container opacity-20 blur-xl"></div></div>
          <h1 class="font-display-lg text-display-lg">Summoner Not Found</h1>
          <p class="mt-sm max-w-md font-body-md text-body-md text-on-surface-variant">{{ errorMessage }}</p>
          <button class="mb-xl mt-xl flex items-center gap-2 rounded-lg bg-primary-container px-lg py-2 font-headline-sm text-headline-sm text-[#17130c]" @click="backToSearch"><span class="material-symbols-outlined text-sm">arrow_back</span>Back to Search</button>
          <div class="w-full rounded-xl border border-[#2C2E33] bg-level-1 p-lg">
            <h3 class="mb-md flex items-center justify-center gap-2 font-headline-sm text-headline-sm"><span class="material-symbols-outlined text-sm text-primary">trending_up</span>Trending Players</h3>
            <div class="flex flex-wrap justify-center gap-sm">
              <button v-for="[name, tag] in trending" :key="name" class="rounded-full border border-[#2C2E33] bg-level-2 px-4 py-1.5 font-stat-sm text-stat-sm hover:bg-surface-variant hover:text-primary" @click="searchPlayer(name, tag)">{{ name }} <span class="font-body-sm text-on-surface-variant">#{{ tag }}</span></button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <main v-else class="grid min-h-screen grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
      <header class="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface px-margin py-sm md:hidden">
        <div class="font-display-lg text-display-lg font-black tracking-tighter text-primary">RIFTSTATS</div>
        <div class="flex gap-sm text-primary"><span class="material-symbols-outlined">notifications</span><span class="material-symbols-outlined">settings</span></div>
      </header>

      <nav class="hidden h-screen w-80 shrink-0 flex-col gap-sm overflow-y-auto border-r border-outline-variant bg-surface-container-low p-md md:sticky md:top-0 md:flex">
        <div class="mb-lg">
          <div class="mb-md font-headline-md text-headline-md font-black text-primary">RIFTSTATS</div>
          <form class="flex overflow-hidden rounded-lg border border-[#2C2E33] bg-level-2 focus-within:border-primary-container" @submit.prevent="searchPlayer()">
            <input v-model="form.gameName" class="search-input w-full px-sm py-sm font-body-sm text-body-sm" placeholder="Game Name" />
            <div class="my-2 w-px bg-outline-variant"></div>
            <input v-model="form.tagLine" class="search-input w-16 px-sm py-sm text-center font-body-sm text-body-sm text-on-surface-variant" placeholder="#Tag" />
            <button class="bg-primary-container px-sm text-on-primary-container"><span class="material-symbols-outlined text-[18px]">search</span></button>
          </form>
        </div>
        <div class="mb-lg flex items-center gap-md rounded-lg border border-[#2C2E33] bg-level-1 p-sm">
          <div class="grid size-12 place-items-center overflow-hidden rounded-full border-2 border-primary-container bg-level-2"><span class="material-symbols-outlined text-primary">workspace_premium</span></div>
          <div class="min-w-0"><span class="block truncate font-headline-sm text-headline-sm text-primary">{{ player?.display_name?.split('#')[0] || 'Summoner' }}</span><span class="font-body-sm text-body-sm text-on-surface-variant">Challenger Tier</span></div>
        </div>
        <div class="flex flex-1 flex-col gap-xs">
          <button class="nav-item" :class="activeSection === 'live' ? 'nav-item-active' : ''" @click="setSection('live')"><span class="material-symbols-outlined">sensors</span><span class="font-label-caps text-label-caps">Live Match</span></button>
          <button class="nav-item" :class="activeSection === 'history' ? 'nav-item-active' : ''" @click="setSection('history')"><span class="material-symbols-outlined">history</span><span class="font-label-caps text-label-caps">Match History</span></button>
          <button class="nav-item" :class="activeSection === 'performance' ? 'nav-item-active' : ''" @click="setSection('performance')"><span class="material-symbols-outlined">insights</span><span class="font-label-caps text-label-caps">Performance</span></button>
          <button class="nav-item" :class="activeSection === 'champions' ? 'nav-item-active' : ''" @click="setSection('champions')"><span class="material-symbols-outlined">groups</span><span class="font-label-caps text-label-caps">Player Champions</span></button>
          <button class="nav-item mt-md" @click="openPage('leaderboards')"><span class="material-symbols-outlined">emoji_events</span><span class="font-label-caps text-label-caps">Leaderboards</span></button>
          <button class="nav-item" @click="openPage('globalChampions')"><span class="material-symbols-outlined">view_module</span><span class="font-label-caps text-label-caps">Champion DB</span></button>
          <button class="nav-item" @click="openPage('proPlay')"><span class="material-symbols-outlined">sports_score</span><span class="font-label-caps text-label-caps">Pro Play</span></button>
          <button class="nav-item mt-auto" @click="openPage('settings')"><span class="material-symbols-outlined">settings</span><span class="font-label-caps text-label-caps">Settings</span></button>
        </div>
      </nav>

      <section class="flex min-w-0 w-full flex-col px-margin pb-24 pt-20 md:px-lg md:pb-lg md:pt-md">
        <form class="mb-md flex h-10 overflow-hidden rounded-lg border border-[#2C2E33] bg-level-2 md:hidden" @submit.prevent="searchPlayer()">
          <input v-model="form.gameName" class="search-input w-full px-sm py-sm font-body-sm text-body-sm" placeholder="Name" />
          <div class="my-2 w-px bg-outline-variant"></div>
          <input v-model="form.tagLine" class="search-input w-16 px-sm py-sm text-center font-body-sm text-body-sm" placeholder="#Tag" />
          <button class="bg-primary-container px-sm text-on-primary-container"><span class="material-symbols-outlined text-[18px]">search</span></button>
        </form>

        <section class="mb-md flex w-full flex-col items-start justify-between gap-md rounded-lg border border-[#2C2E33] bg-level-1 p-md md:flex-row md:items-center">
          <div class="flex items-center gap-md">
            <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-primary-container bg-level-2"><span class="material-symbols-outlined text-3xl text-primary">workspace_premium</span></div>
            <div>
              <div class="flex items-baseline gap-xs"><h1 class="m-0 font-display-lg text-display-lg">{{ player?.display_name?.split('#')[0] || lastSearch.gameName }}</h1><span class="font-headline-sm text-headline-sm text-on-surface-variant">#{{ player?.display_name?.split('#')[1] || lastSearch.tagLine }}</span></div>
              <div class="mt-1 flex items-center gap-sm"><span class="rounded border border-[#2C2E33] bg-level-2 px-2 py-1 font-label-caps text-label-caps text-primary">{{ responseData?.match_region || 'REGION' }}</span><span class="font-body-sm text-body-sm text-on-surface-variant">Recent Match Analysis</span></div>
            </div>
          </div>
          <div class="w-full md:w-auto md:text-right">
            <div class="mb-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <span class="font-body-sm text-body-sm text-on-surface-variant">Displayed {{ filteredMatches.length }} of {{ matches.length }} Matches</span>
            </div>
            <div class="flex w-full items-center gap-xs md:w-48"><span class="font-stat-sm text-stat-sm">{{ wins }}W</span><div class="flex h-2 flex-grow overflow-hidden rounded-full bg-level-2"><div class="h-full bg-blue-500" :style="{ width: `${winRate}%` }"></div><div class="h-full bg-red-500" :style="{ width: `${100 - winRate}%` }"></div></div><span class="font-stat-sm text-stat-sm text-on-surface-variant">{{ losses }}L</span></div>
            <div class="mt-1 font-label-caps text-label-caps text-on-surface-variant">{{ winRate }}% Win Rate</div>
          </div>
        </section>

        <section class="mb-md rounded-lg border border-[#2C2E33] bg-level-1 p-md">
          <div class="flex w-full flex-col gap-md md:flex-row md:items-center md:justify-between">
            <div class="relative w-full md:w-48 flex-shrink-0">
              <label class="sr-only" for="queueFilter">Queue Type</label>
              <div class="bg-level-2 border border-[#2C2E33] rounded flex items-center justify-between px-md py-sm w-full transition-all duration-200">
                <span class="font-body-md text-body-md text-on-surface">{{ selectedQueueFilter === 'All' ? 'All Queues' : selectedQueueFilter }}</span>
                <span class="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
              </div>
              <select id="queueFilter" v-model="selectedQueueFilter" class="absolute inset-0 opacity-0 cursor-pointer">
                <option v-for="queueName in queueOptions" :key="queueName" :value="queueName">{{ queueName === 'All' ? 'All Queues' : queueName }}</option>
              </select>
            </div>

            <div class="flex w-full md:w-auto items-center bg-[#0B0B0C] border border-[#2C2E33] rounded p-[2px]">
              <button type="button" @click="selectedResultFilter = 'All'" :class="['flex-1 md:w-24 py-sm px-sm text-center font-stat-sm text-stat-sm transition-colors rounded', selectedResultFilter === 'All' ? 'bg-surface-container-high text-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-level-1']">All</button>
              <button type="button" @click="selectedResultFilter = 'Victory'" :class="['flex-1 md:w-24 py-sm px-sm text-center font-stat-sm text-stat-sm transition-colors rounded', selectedResultFilter === 'Victory' ? 'bg-surface-container-high text-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-level-1']">Victory</button>
              <button type="button" @click="selectedResultFilter = 'Defeat'" :class="['flex-1 md:w-24 py-sm px-sm text-center font-stat-sm text-stat-sm transition-colors rounded', selectedResultFilter === 'Defeat' ? 'bg-surface-container-high text-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-level-1']">Defeat</button>
            </div>

            <div class="relative w-full md:w-64 flex-shrink-0 bg-[#0B0B0C] border border-[#2C2E33] rounded overflow-hidden flex items-center">
              <span class="material-symbols-outlined absolute left-sm text-on-surface-variant text-sm z-10">search</span>
              <input
                v-model="selectedChampionFilter"
                class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-body-md pl-xl py-sm pr-sm placeholder:text-on-surface-variant/50"
                placeholder="Filter by Champion..."
                type="text"
              />
            </div>
          </div>
        </section>

        <section v-if="activeSection === 'live'" class="mb-md rounded-lg border border-[#2C2E33] bg-level-1 p-md">
          <div class="mb-sm flex items-center gap-sm border-b border-outline-variant pb-sm">
            <span class="material-symbols-outlined text-primary">sensors</span>
            <h2 class="font-headline-md text-headline-md">Live Match</h2>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant">Riot's public match API does not expose a guaranteed live-game endpoint for every player here, so this tab shows the most recent loaded match as the current tactical view.</p>
        </section>

        <section v-else-if="activeSection === 'performance'" class="mb-md grid gap-sm md:grid-cols-4">
          <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Win Rate</span><strong class="mt-xs block font-display-lg text-display-lg text-primary">{{ winRate }}%</strong><span class="font-body-sm text-body-sm text-on-surface-variant">{{ aggregateStats.games }} loaded games</span></div>
          <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Avg KDA</span><strong class="mt-xs block font-display-lg text-display-lg">{{ aggregateStats.avgKda }}</strong></div>
          <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Avg Damage</span><strong class="mt-xs block font-display-lg text-display-lg">{{ compact(aggregateStats.avgDamage) }}</strong></div>
          <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Avg CS</span><strong class="mt-xs block font-display-lg text-display-lg">{{ aggregateStats.avgCs }}</strong></div>
          <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Avg Gold</span><strong class="mt-xs block font-display-lg text-display-lg">{{ compact(aggregateStats.avgGold) }}</strong></div>
          <div class="rounded border border-[#2C2E33] bg-level-1 p-md"><span class="font-label-caps text-label-caps text-on-surface-variant">Avg Vision</span><strong class="mt-xs block font-display-lg text-display-lg">{{ aggregateStats.avgVision }}</strong></div>
        </section>

        <section v-else-if="activeSection === 'champions'" class="mb-md rounded-lg border border-[#2C2E33] bg-level-1 p-md">
          <div class="mb-sm flex items-center gap-sm border-b border-outline-variant pb-sm">
            <span class="material-symbols-outlined text-primary">groups</span>
            <h2 class="font-headline-md text-headline-md">Champions</h2>
          </div>
          <div class="grid gap-xs">
            <div v-for="entry in championStats" :key="entry.champion" class="flex items-center gap-sm rounded border border-[#2C2E33] bg-[#111214] p-sm">
              <div class="icon-slot size-10 rounded-full"><img class="size-full object-cover" :src="champSrc(entry.champion)" :alt="entry.champion" /></div>
              <div class="min-w-0 flex-1"><strong class="block truncate">{{ entry.champion }}</strong><span class="font-body-sm text-body-sm text-on-surface-variant">{{ entry.games }} games · {{ entry.wins }} wins</span></div>
              <div class="font-stat-sm text-stat-sm">{{ entry.kills }}/{{ entry.deaths }}/{{ entry.assists }}</div>
              <div class="font-stat-sm text-stat-sm text-on-surface-variant">{{ compact(entry.damage) }} DMG</div>
            </div>
          </div>
        </section>

        <div class="flex w-full flex-col gap-unit">
          <article v-for="match in filteredMatches" :key="match.match_id" v-show="activeSection === 'history' || activeSection === 'live'" class="flex flex-col overflow-hidden rounded-lg border border-[#2C2E33] bg-level-1 bg-opacity-50" :class="match.searched_player?.win ? 'win-border' : 'loss-border'">
            <button class="flex cursor-pointer flex-col items-start justify-between gap-md p-sm text-left transition hover:bg-level-2 md:p-md lg:flex-row lg:items-center" @click="toggleMatch(match.match_id)">
              <div class="flex w-full shrink-0 flex-row justify-between lg:w-32 lg:flex-col">
                <div><span class="font-headline-sm text-headline-sm" :class="match.searched_player?.win ? 'win-text' : 'loss-text'">{{ match.searched_player?.win ? 'Victory' : 'Defeat' }}</span><span class="block font-body-sm text-body-sm">{{ match.queue_name }}</span></div>
                <div class="text-right lg:mt-xs lg:text-left"><span class="block font-body-sm text-body-sm text-on-surface-variant">{{ duration(match.duration_seconds) }}</span><span class="block font-body-sm text-body-sm text-on-surface-variant">{{ dateTime(match.game_start_timestamp) }}</span></div>
              </div>
              <div class="hidden h-12 w-px bg-outline-variant lg:block"></div>
              <div class="flex w-full flex-grow items-center justify-between gap-md lg:w-auto lg:justify-start">
                <div class="relative size-14 shrink-0 overflow-hidden rounded-full border-2 bg-level-2" :class="match.searched_player?.win ? 'border-blue-500' : 'border-red-500'">
                  <img v-if="match.searched_player?.champion_name" class="size-full object-cover" :src="champSrc(match.searched_player.champion_name)" :alt="match.searched_player.champion_name" />
                  <div class="absolute bottom-0 right-0 grid size-5 place-items-center rounded-full border border-[#2C2E33] bg-level-2 text-[8px]">{{ match.searched_player?.champion_level }}</div>
                </div>
                <div class="min-w-[100px]"><div class="font-stat-lg text-stat-lg tracking-wide">{{ match.searched_player?.kills }} <span class="font-body-sm text-on-surface-variant">/</span> {{ match.searched_player?.deaths }} <span class="font-body-sm text-on-surface-variant">/</span> {{ match.searched_player?.assists }}</div><div class="font-body-sm text-body-sm text-on-surface-variant"><span class="text-on-surface">{{ match.searched_player?.kda }}</span> KDA</div></div>
                <div class="ml-xs hidden flex-col border-l border-outline-variant pl-md sm:flex"><div class="font-stat-sm text-stat-sm">Level {{ match.searched_player?.champion_level }}</div><div class="font-body-sm text-body-sm text-on-surface-variant">{{ match.searched_player?.total_cs }} CS</div><div class="mt-1 w-max rounded bg-level-2 px-2 py-0.5 font-label-caps text-label-caps text-on-surface-variant">{{ match.searched_player?.team_position || 'FILL' }}</div></div>
              </div>
              <div class="hidden h-12 w-px bg-outline-variant lg:block"></div>
              <div class="flex w-full flex-col items-center gap-xs lg:w-auto lg:items-start">
                <div class="flex gap-1"><div v-for="(itemId, index) in match.searched_player?.item_ids || []" :key="`${match.match_id}-${itemId}-${index}`" class="icon-slot size-7 rounded" :class="index === 6 ? 'rounded-full ml-1' : ''"><img v-if="itemSrc(itemId)" class="size-full object-cover" :src="itemSrc(itemId)" alt="Item" /></div></div>
                <div class="flex gap-1"><div v-for="spellId in match.searched_player?.summoner_spell_ids || []" :key="spellId" class="icon-slot size-6 rounded"><img v-if="spellSrc(spellId)" class="size-full object-cover" :src="spellSrc(spellId)" alt="Spell" /></div></div>
              </div>
              <span class="material-symbols-outlined ml-auto hidden text-on-surface-variant lg:flex" :class="expandedMatchId === match.match_id ? 'rotate-180' : ''">expand_more</span>
            </button>

            <section v-if="expandedMatchId === match.match_id" class="flex flex-col gap-md border-t border-outline-variant bg-[#111214] p-sm md:p-md xl:flex-row">
              <div v-for="teamId in [100, 200]" :key="teamId" class="flex min-w-0 flex-1 flex-col" :class="teamId === 200 ? 'border-t border-outline-variant pt-md xl:mt-0 xl:border-l xl:border-t-0 xl:pl-md xl:pt-0' : ''">
                <div class="mb-sm flex items-center justify-between border-b border-outline-variant px-sm pb-sm">
                  <span class="font-headline-sm text-headline-sm" :class="team(match, teamId).win ? 'win-text' : 'loss-text'">{{ team(match, teamId).win ? 'Victory' : 'Defeat' }} ({{ teamId === 100 ? 'Blue' : 'Red' }} Team)</span>
                  <div class="flex gap-sm font-label-caps text-label-caps text-on-surface-variant">
                    <span><span class="material-symbols-outlined text-[14px]">account_balance</span> {{ teamObjective(team(match, teamId), 'tower') }}</span>
                    <span><span class="material-symbols-outlined text-[14px]">local_fire_department</span> {{ teamObjective(team(match, teamId), 'dragon') }}</span>
                    <span><span class="material-symbols-outlined text-[14px]">android</span> {{ teamObjective(team(match, teamId), 'baron') }}</span>
                    <span class="font-stat-sm text-on-surface">{{ teamGold(match, teamId) }} G</span>
                  </div>
                </div>
                <div class="mb-1 hidden px-sm py-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant sm:flex"><div class="w-10"></div><div class="min-w-[100px] flex-1">Player</div><div class="w-24 text-center">KDA</div><div class="w-16 text-right">CS</div><div class="w-20 text-right">DMG</div><div class="ml-auto hidden w-32 md:block xl:w-40">Items</div></div>
                <div class="flex flex-col gap-1">
                  <button v-for="participant in participants(match, teamId)" :key="participant.display_name + participant.champion_name" class="group relative flex w-full items-center rounded px-sm py-1.5 text-left transition-colors hover:bg-level-2" :class="participant.is_searched_player ? 'border border-primary-container/30 bg-primary-container/10' : ''" type="button" @click="searchParticipant(participant)">
                    <div v-if="participant.is_searched_player" class="absolute bottom-0 left-0 top-0 w-1 bg-primary-container"></div>
                    <div class="mr-sm size-8 shrink-0 overflow-hidden rounded-full border border-[#2C2E33] bg-level-2" :class="participant.is_searched_player ? 'border-primary-container' : ''"><img v-if="participant.champion_name" class="size-full object-cover" :src="champSrc(participant.champion_name)" :alt="participant.champion_name" /></div>
                    <div class="min-w-[80px] flex-1 pr-2"><div class="truncate font-body-sm text-body-sm transition group-hover:text-primary" :class="participant.is_searched_player ? 'font-headline-sm text-[13px] text-primary' : ''">{{ participant.display_name }}</div></div>
                    <div class="w-24 text-center font-stat-sm text-stat-sm">{{ participant.kills }}/{{ participant.deaths }}/{{ participant.assists }}</div>
                    <div class="hidden w-16 text-right font-body-sm text-body-sm text-on-surface-variant sm:block">{{ participant.total_cs }}</div>
                    <div class="relative hidden w-20 overflow-hidden text-right font-body-sm text-body-sm text-on-surface-variant sm:block"><span class="relative z-10">{{ compact(participant.total_damage_dealt_to_champions) }}</span><div class="absolute bottom-0 right-0 top-0 z-0 rounded-l opacity-30" :class="participant.is_searched_player ? 'bg-primary-container w-full' : 'bg-secondary-container w-1/2'"></div></div>
                    <div class="ml-auto hidden justify-end gap-1 md:flex"><div v-for="(itemId, index) in participant.item_ids?.slice(0, 6)" :key="`${participant.display_name}-${itemId}-${index}`" class="icon-slot size-5 rounded"><img v-if="itemSrc(itemId)" class="size-full object-cover" :src="itemSrc(itemId)" alt="Item" /></div></div>
                  </button>
                </div>
                <div class="mt-sm flex items-center gap-sm border-t border-outline-variant px-sm pt-sm"><span class="font-label-caps text-label-caps text-on-surface-variant">BANS</span><div class="flex gap-1"><div v-for="ban in team(match, teamId).bans || []" :key="`${teamId}-${ban.championId}`" class="icon-slot size-6 rounded opacity-60 grayscale"><img v-if="banSrc(ban.championId)" class="size-full object-cover" :src="banSrc(ban.championId)" alt="Ban" /></div></div></div>
              </div>
            </section>
          </article>
        </div>
        <div v-if="activeSection === 'history' && matches.length" class="mt-md flex flex-col items-center gap-xs">
          <button class="rounded border border-primary-container bg-primary-container px-lg py-sm font-headline-sm text-headline-sm text-[#17130c] transition hover:bg-primary-fixed disabled:cursor-wait disabled:opacity-70" :disabled="isLoadingMore || isPrefetchingMore" @click="loadMoreMatches()">
            {{ isLoadingMore || isPrefetchingMore ? 'Loading More...' : 'Load More Matches' }}
          </button>
          <p v-if="isPrefetchingMore" class="font-body-sm text-body-sm text-on-surface-variant">Loading the next 10 matches in the background...</p>
          <p v-if="errorMessage" class="font-body-sm text-body-sm text-error">{{ errorMessage }}</p>
        </div>
      </section>

      <nav class="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface-container-highest px-margin pb-xs pt-xs shadow-xl md:hidden">
        <button class="bottom-nav-item" :class="activeSection === 'live' ? 'bottom-nav-active' : ''" @click="setSection('live')"><span class="material-symbols-outlined">home</span><span class="mt-1 font-label-caps text-label-caps">Home</span></button>
        <button class="bottom-nav-item" :class="activeSection === 'history' ? 'bottom-nav-active' : ''" @click="setSection('history')"><span class="material-symbols-outlined">reorder</span><span class="mt-1 font-label-caps text-label-caps">Matches</span></button>
        <button class="bottom-nav-item" :class="activeSection === 'performance' ? 'bottom-nav-active' : ''" @click="setSection('performance')"><span class="material-symbols-outlined">emoji_events</span><span class="mt-1 font-label-caps text-label-caps">Ranks</span></button>
        <button class="bottom-nav-item" :class="activeSection === 'champions' ? 'bottom-nav-active' : ''" @click="setSection('champions')"><span class="material-symbols-outlined">person</span><span class="mt-1 font-label-caps text-label-caps">Profile</span></button>
      </nav>
    </main>
  </div>
</template>
