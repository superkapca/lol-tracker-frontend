<script setup>
import { computed, onMounted, ref } from "vue";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Crosshair,
  Eye,
  Gem,
  Loader2,
  Search,
  Shield,
  Skull,
  Swords,
  Trophy,
  Zap
} from "lucide-vue-next";
import { championIcon, itemIcon, loadDataDragon, spellIcon } from "./lib/ddragon";
import { compact, dateTime, duration } from "./lib/format";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const path = window.location.pathname;
const isNotFound = path !== "/";

const form = ref({
  gameName: "",
  tagLine: "",
  count: "5"
});
const status = ref("empty");
const errorMessage = ref("");
const responseData = ref(null);
const expandedMatchId = ref(null);
const ddragon = ref({
  version: "15.10.1",
  summonerSpellsById: {},
  championsById: {}
});

onMounted(async () => {
  ddragon.value = await loadDataDragon();
});

const matches = computed(() => responseData.value?.matches || []);
const firstPlayer = computed(() => matches.value.find((match) => match.searched_player)?.searched_player);
const wins = computed(() => matches.value.filter((match) => match.searched_player?.win).length);
const losses = computed(() => matches.value.filter((match) => match.searched_player && !match.searched_player.win).length);

async function searchPlayer() {
  if (!form.value.gameName.trim() || !form.value.tagLine.trim()) {
    showError("Enter both a game name and a tag line.");
    return;
  }

  status.value = "loading";
  errorMessage.value = "";

  try {
    const params = new URLSearchParams({
      game_name: form.value.gameName.trim(),
      tag_line: form.value.tagLine.trim(),
      count: form.value.count
    });
    const res = await fetch(`${apiBaseUrl}/matches?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "The backend returned an error.");
    }

    responseData.value = data;
    expandedMatchId.value = data.matches?.[0]?.match_id || null;
    status.value = "dashboard";
  } catch (error) {
    showError(error.message || "Could not load match data.");
  }
}

function showError(message) {
  errorMessage.value = message;
  status.value = "error";
}

function toggleMatch(matchId) {
  expandedMatchId.value = expandedMatchId.value === matchId ? null : matchId;
}

function participantsFor(match, teamId) {
  return (match.participants || []).filter((participant) => participant.team_id === teamId);
}

function teamById(match, teamId) {
  return (match.teams || []).find((team) => team.team_id === teamId);
}

function champSrc(championName) {
  return championIcon(ddragon.value.version, championName);
}

function itemSrc(itemId) {
  return itemIcon(ddragon.value.version, itemId);
}

function spellSrc(spellId) {
  return spellIcon(ddragon.value.version, spellId, ddragon.value.summonerSpellsById);
}

function banSrc(championId) {
  const championName = ddragon.value.championsById[Number(championId)];
  return championName ? champSrc(championName) : "";
}
</script>

<template>
  <main class="screen">
    <section v-if="isNotFound" class="shell grid min-h-[calc(100vh-40px)] place-items-center">
      <div class="panel max-w-xl p-8 text-center">
        <div class="mx-auto mb-5 grid size-16 place-items-center rounded-lg border border-gold/60 bg-ink text-gold">
          <AlertTriangle :size="28" />
        </div>
        <p class="eyebrow">404 Page Not Found</p>
        <h1 class="mt-2 text-4xl font-black">Route unavailable</h1>
        <p class="muted mt-3">LOL Tracker is a single-screen dashboard. Return to the search screen to load match history.</p>
        <a class="gold-button mt-6" href="/">Return to tracker</a>
      </div>
    </section>

    <section v-else class="shell">
      <header class="panel flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="eyebrow">Stitch AI Match Tracker</p>
          <h1 class="mt-1 text-4xl font-black leading-none sm:text-6xl">LOL Tracker</h1>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <div class="panel-soft px-3 py-2">
            <span class="stat-label">Mode</span>
            <strong class="text-sm">Live API</strong>
          </div>
          <div class="panel-soft px-3 py-2">
            <span class="stat-label">Assets</span>
            <strong class="text-sm">Data Dragon</strong>
          </div>
          <div class="panel-soft px-3 py-2">
            <span class="stat-label">Keys</span>
            <strong class="text-sm">Server Only</strong>
          </div>
        </div>
      </header>

      <section class="panel mt-4 grid gap-5 p-5 xl:grid-cols-[0.8fr_2fr] xl:items-end">
        <div>
          <p class="eyebrow">Player Search</p>
          <h2 class="mt-1 text-2xl font-black">Find recent matches</h2>
          <p class="muted mt-2">Search with Riot ID. The backend handles the Riot API key and returns formatted player names, teams, builds, and objectives.</p>
        </div>

        <form class="grid gap-3 md:grid-cols-[1fr_140px_112px_140px]" @submit.prevent="searchPlayer">
          <label>
            <span class="field-label">Game Name</span>
            <input v-model="form.gameName" class="input" placeholder="Faker" autocomplete="off" />
          </label>
          <label>
            <span class="field-label">Tag Line</span>
            <input v-model="form.tagLine" class="input" placeholder="T1" autocomplete="off" />
          </label>
          <label>
            <span class="field-label">Matches</span>
            <select v-model="form.count" class="input">
              <option value="5">5</option>
              <option value="8">8</option>
              <option value="10">10</option>
            </select>
          </label>
          <button class="gold-button mt-0 md:mt-7" :disabled="status === 'loading'" type="submit">
            <Loader2 v-if="status === 'loading'" class="animate-spin" :size="18" />
            <Search v-else :size="18" />
            {{ status === "loading" ? "Loading" : "Search" }}
          </button>
        </form>
      </section>

      <section v-if="status === 'empty'" class="panel mt-4 grid min-h-[420px] place-items-center p-8 text-center">
        <div class="max-w-xl">
          <div class="mx-auto mb-5 grid size-20 place-items-center rounded-lg border border-gold/60 bg-ink text-gold">
            <Crosshair :size="34" />
          </div>
          <p class="eyebrow">Search Screen</p>
          <h2 class="mt-2 text-3xl font-black">No player loaded</h2>
          <p class="muted mt-3">Load a Riot ID to see match cards, icons, participant names, item builds, team objectives, and expanded game details.</p>
        </div>
      </section>

      <section v-if="status === 'loading'" class="panel mt-4 grid min-h-[420px] place-items-center p-8 text-center">
        <div>
          <Loader2 class="mx-auto mb-5 animate-spin text-gold" :size="54" />
          <p class="eyebrow">Loading Screen</p>
          <h2 class="mt-2 text-3xl font-black">Fetching match intelligence</h2>
          <p class="muted mt-3">Resolving the account, loading match IDs, and formatting the latest games.</p>
        </div>
      </section>

      <section v-if="status === 'error'" class="panel mt-4 border-loss/60 p-8 text-center">
        <AlertTriangle class="mx-auto mb-5 text-loss" :size="48" />
        <p class="eyebrow">Error Screen</p>
        <h2 class="mt-2 text-3xl font-black">Could not load matches</h2>
        <p class="muted mx-auto mt-3 max-w-2xl">{{ errorMessage }}</p>
      </section>

      <section v-if="status === 'dashboard'" class="mt-4 space-y-4">
        <div class="panel flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="eyebrow">Dashboard</p>
            <h2 class="mt-1 text-3xl font-black">{{ firstPlayer?.display_name || "Player loaded" }}</h2>
            <p class="muted mt-1">{{ responseData?.match_region || "-" }} routing region</p>
          </div>
          <div class="grid grid-cols-3 gap-2 sm:min-w-[420px]">
            <div class="stat-tile">
              <span class="stat-label">Matches</span>
              <strong class="text-xl">{{ matches.length }}</strong>
            </div>
            <div class="stat-tile">
              <span class="stat-label">Record</span>
              <strong class="text-xl">{{ wins }}W - {{ losses }}L</strong>
            </div>
            <div class="stat-tile">
              <span class="stat-label">Latest Pick</span>
              <strong class="text-xl">{{ firstPlayer?.champion_name || "-" }}</strong>
            </div>
          </div>
        </div>

        <article
          v-for="match in matches"
          :key="match.match_id"
          class="panel overflow-hidden border-l-4"
          :class="match.searched_player?.win ? 'border-l-win' : 'border-l-loss'"
        >
          <button class="grid w-full gap-4 p-4 text-left lg:grid-cols-[290px_1fr_auto] lg:items-center" type="button" @click="toggleMatch(match.match_id)">
            <div class="flex items-center gap-3">
              <div class="icon-frame size-16 rounded-lg">
                <img v-if="match.searched_player?.champion_name" class="size-full object-cover" :src="champSrc(match.searched_player.champion_name)" :alt="match.searched_player.champion_name" />
                <span v-else>CH</span>
              </div>
              <div class="min-w-0">
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-black" :class="match.searched_player?.win ? 'bg-win text-ink' : 'bg-loss text-ink'">
                  {{ match.searched_player?.win ? "Victory" : "Defeat" }}
                </span>
                <h3 class="mt-2 truncate text-lg font-black">{{ match.searched_player?.champion_name || "Unknown Champion" }}</h3>
                <p class="muted truncate">{{ match.searched_player?.display_name }} - {{ match.searched_player?.team_position || "FILL" }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
              <div class="stat-tile"><span class="stat-label">K/D/A</span><strong>{{ match.searched_player?.kills }}/{{ match.searched_player?.deaths }}/{{ match.searched_player?.assists }}</strong></div>
              <div class="stat-tile"><span class="stat-label">KDA</span><strong>{{ match.searched_player?.kda }}</strong></div>
              <div class="stat-tile"><span class="stat-label">CS</span><strong>{{ match.searched_player?.total_cs }}</strong></div>
              <div class="stat-tile"><span class="stat-label">Gold</span><strong>{{ compact(match.searched_player?.gold_earned) }}</strong></div>
              <div class="stat-tile"><span class="stat-label">Damage</span><strong>{{ compact(match.searched_player?.total_damage_dealt_to_champions) }}</strong></div>
              <div class="stat-tile"><span class="stat-label">Time</span><strong>{{ duration(match.duration_seconds) }}</strong></div>
            </div>

            <div class="flex items-center gap-2 lg:justify-end">
              <div class="grid gap-1">
                <div v-for="spellId in match.searched_player?.summoner_spell_ids || []" :key="spellId" class="icon-frame size-7 rounded">
                  <img v-if="spellSrc(spellId)" class="size-full object-cover" :src="spellSrc(spellId)" alt="Summoner spell" />
                </div>
              </div>
              <div class="grid grid-cols-4 gap-1">
                <div v-for="(itemId, index) in match.searched_player?.item_ids || []" :key="`${itemId}-${index}`" class="icon-frame size-8 rounded">
                  <img v-if="itemSrc(itemId)" class="size-full object-cover" :src="itemSrc(itemId)" alt="Item" />
                  <span v-else>-</span>
                </div>
              </div>
              <ChevronDown class="text-slate-400 transition" :class="expandedMatchId === match.match_id ? 'rotate-180' : ''" :size="22" />
            </div>
          </button>

          <div v-if="expandedMatchId === match.match_id" class="space-y-4 border-t border-line p-4">
            <div class="flex flex-wrap gap-2">
              <span class="rounded-full border border-line bg-ink px-3 py-1 text-xs font-bold">{{ match.queue_name }}</span>
              <span class="rounded-full border border-line bg-ink px-3 py-1 text-xs font-bold">{{ match.game_mode }}</span>
              <span class="rounded-full border border-line bg-ink px-3 py-1 text-xs font-bold">{{ dateTime(match.game_start_timestamp) }}</span>
              <span class="rounded-full border border-line bg-ink px-3 py-1 text-xs font-bold">{{ match.match_id }}</span>
            </div>

            <div class="grid gap-3 xl:grid-cols-2">
              <section v-for="teamId in [100, 200]" :key="teamId" class="panel-soft p-3">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <h3 class="font-black">Team {{ teamId }}</h3>
                  <span class="rounded-full px-3 py-1 text-xs font-black" :class="teamById(match, teamId)?.win ? 'bg-win text-ink' : 'bg-loss text-ink'">
                    {{ teamById(match, teamId)?.win ? "Win" : "Loss" }}
                  </span>
                </div>

                <div class="mb-3 grid grid-cols-3 gap-2 md:grid-cols-6">
                  <div v-for="(objective, name) in teamById(match, teamId)?.objectives || {}" :key="name" class="panel-soft px-2 py-2 text-center">
                    <component :is="{ champion: Skull, baron: Gem, dragon: Zap, tower: Shield, inhibitor: Shield, riftHerald: Swords }[name] || Trophy" class="mx-auto mb-1 text-gold" :size="16" />
                    <span class="stat-label">{{ name }}</span>
                    <strong>{{ objective?.kills ?? 0 }}</strong>
                  </div>
                </div>

                <div class="mb-3 flex flex-wrap gap-1">
                  <div v-for="ban in teamById(match, teamId)?.bans || []" :key="`${teamId}-${ban.championId}`" class="icon-frame size-8 rounded">
                    <img v-if="banSrc(ban.championId)" class="size-full object-cover grayscale" :src="banSrc(ban.championId)" alt="Ban" />
                    <span v-else>Ban</span>
                  </div>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="participant in participantsFor(match, teamId)"
                    :key="participant.display_name + participant.champion_name"
                    class="grid grid-cols-[40px_minmax(0,1fr)_72px] items-center gap-2 rounded-md border bg-ink/60 p-2 md:grid-cols-[40px_minmax(0,1fr)_76px_70px_70px_92px_140px]"
                    :class="participant.is_searched_player ? 'border-gold/80' : 'border-line'"
                  >
                    <div class="icon-frame size-10 rounded-md">
                      <img v-if="participant.champion_name" class="size-full object-cover" :src="champSrc(participant.champion_name)" :alt="participant.champion_name" />
                    </div>
                    <div class="min-w-0">
                      <strong class="block truncate">{{ participant.display_name }}</strong>
                      <span class="muted truncate">{{ participant.champion_name }} - {{ participant.team_position || "FILL" }}</span>
                    </div>
                    <strong>{{ participant.kills }}/{{ participant.deaths }}/{{ participant.assists }}</strong>
                    <span class="hidden text-sm text-slate-300 md:block">{{ participant.kda }} KDA</span>
                    <span class="hidden text-sm text-slate-300 md:block">{{ participant.total_cs }} CS</span>
                    <span class="hidden text-sm text-slate-300 md:block">{{ compact(participant.total_damage_dealt_to_champions) }} DMG</span>
                    <div class="hidden flex-wrap justify-end gap-1 md:flex">
                      <div v-for="(itemId, index) in participant.item_ids" :key="`${participant.display_name}-${itemId}-${index}`" class="icon-frame size-6 rounded">
                        <img v-if="itemSrc(itemId)" class="size-full object-cover" :src="itemSrc(itemId)" alt="Item" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
