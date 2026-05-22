export const fallbackVersion = "15.10.1";

export async function loadDataDragon() {
  const result = {
    version: fallbackVersion,
    summonerSpellsById: {},
    championsById: {}
  };

  try {
    const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = await versionsResponse.json();
    result.version = versions[0] || fallbackVersion;

    const [spellsResponse, championsResponse] = await Promise.all([
      fetch(`https://ddragon.leagueoflegends.com/cdn/${result.version}/data/en_US/summoner.json`),
      fetch(`https://ddragon.leagueoflegends.com/cdn/${result.version}/data/en_US/champion.json`)
    ]);

    const spellData = await spellsResponse.json();
    const championData = await championsResponse.json();

    result.summonerSpellsById = Object.values(spellData.data || {}).reduce((acc, spell) => {
      acc[Number(spell.key)] = spell.id;
      return acc;
    }, {});

    result.championsById = Object.values(championData.data || {}).reduce((acc, champion) => {
      acc[Number(champion.key)] = champion.id;
      return acc;
    }, {});
  } catch {
    return result;
  }

  return result;
}

export function championIcon(version, championName) {
  return championName
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`
    : "";
}

export function itemIcon(version, itemId) {
  return itemId
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`
    : "";
}

export function spellIcon(version, spellId, spellMap) {
  const spellName = spellMap[Number(spellId)];
  return spellName
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellName}.png`
    : "";
}
