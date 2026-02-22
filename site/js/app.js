/**
 * Atlas Conquest Analytics — Main Application
 *
 * Loads static JSON data files and renders the dashboard.
 * No build step. No framework. Just data → DOM.
 */

const FACTION_COLORS = {
  skaal: '#C44536',
  grenalia: '#3A7D44',
  lucia: '#D4A843',
  neutral: '#A89078',
};

// ─── Data Loading ──────────────────────────────────────────────

async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadAllData() {
  const [metadata, commanderStats, cardStats, trends] = await Promise.all([
    loadJSON('data/metadata.json'),
    loadJSON('data/commander_stats.json'),
    loadJSON('data/card_stats.json'),
    loadJSON('data/trends.json'),
  ]);
  return { metadata, commanderStats, cardStats, trends };
}

// ─── Rendering ─────────────────────────────────────────────────

function renderMetadata(metadata) {
  if (!metadata) return;

  const el = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };

  el('hero-matches', `${metadata.total_matches.toLocaleString()} matches`);
  el('hero-players', `${metadata.total_players.toLocaleString()} players`);
  el('hero-updated', `Last updated: ${new Date(metadata.last_updated).toLocaleDateString()}`);
  el('stat-matches', metadata.total_matches.toLocaleString());
  el('stat-players', metadata.total_players.toLocaleString());
}

function factionBadge(faction) {
  return `<span class="faction-badge ${faction}">${faction}</span>`;
}

function winrateCell(rate) {
  const pct = (rate * 100).toFixed(1);
  let cls = 'winrate-neutral';
  if (rate > 0.52) cls = 'winrate-positive';
  else if (rate < 0.48) cls = 'winrate-negative';
  return `<span class="${cls}">${pct}%</span>`;
}

function renderCommanderTable(stats) {
  const tbody = document.querySelector('#commander-table tbody');
  if (!stats || !stats.length) return;

  tbody.innerHTML = stats
    .sort((a, b) => b.winrate - a.winrate)
    .map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${factionBadge(c.faction)}</td>
        <td>${c.matches}</td>
        <td>${c.wins}</td>
        <td>${winrateCell(c.winrate)}</td>
      </tr>
    `).join('');
}

function renderCommanderChart(stats) {
  const canvas = document.getElementById('commander-chart');
  if (!stats || !stats.length || !canvas) return;

  const sorted = [...stats].sort((a, b) => b.winrate - a.winrate);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sorted.map(c => c.name),
      datasets: [{
        label: 'Winrate',
        data: sorted.map(c => (c.winrate * 100).toFixed(1)),
        backgroundColor: sorted.map(c => FACTION_COLORS[c.faction] || '#888'),
        borderRadius: 6,
        barPercentage: 0.7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y}% winrate`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: v => v + '%',
            color: '#6E6E80',
            font: { family: 'Inter', size: 12 },
          },
          grid: { color: '#E5E5E5' },
        },
        x: {
          ticks: {
            color: '#6E6E80',
            font: { family: 'Inter', size: 12 },
          },
          grid: { display: false },
        },
      },
    },
  });
}

function renderCardTable(stats, faction) {
  const tbody = document.querySelector('#card-table tbody');
  if (!stats || !stats.length) return;

  const filtered = faction === 'all'
    ? stats
    : stats.filter(c => c.faction === faction);

  const sorted = filtered.sort((a, b) => b.play_rate - a.play_rate).slice(0, 30);

  tbody.innerHTML = sorted.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${factionBadge(c.faction)}</td>
      <td>${c.type}</td>
      <td>${(c.play_rate * 100).toFixed(1)}%</td>
      <td>${winrateCell(c.winrate)}</td>
    </tr>
  `).join('');
}

function renderMetaChart(trends) {
  const canvas = document.getElementById('meta-chart');
  if (!trends || !canvas) return;

  const datasets = Object.entries(trends.factions || {}).map(([faction, data]) => ({
    label: faction.charAt(0).toUpperCase() + faction.slice(1),
    data: data,
    borderColor: FACTION_COLORS[faction] || '#888',
    backgroundColor: 'transparent',
    tension: 0.3,
    pointRadius: 3,
    borderWidth: 2,
  }));

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: trends.dates || [],
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: '#6E6E80',
            font: { family: 'Inter', size: 12, weight: 500 },
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: v => v + '%',
            color: '#6E6E80',
            font: { family: 'Inter', size: 12 },
          },
          grid: { color: '#E5E5E5' },
        },
        x: {
          ticks: {
            color: '#6E6E80',
            font: { family: 'Inter', size: 12 },
            maxTicksLimit: 10,
          },
          grid: { display: false },
        },
      },
    },
  });
}

// ─── Filters ───────────────────────────────────────────────────

function initFilters(cardStats) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCardTable(cardStats, btn.dataset.faction);
    });
  });
}

// ─── Init ──────────────────────────────────────────────────────

async function init() {
  const data = await loadAllData();

  renderMetadata(data.metadata);
  renderCommanderTable(data.commanderStats);
  renderCommanderChart(data.commanderStats);
  renderCardTable(data.cardStats, 'all');
  renderMetaChart(data.trends);
  initFilters(data.cardStats || []);

  // Update unique cards stat
  if (data.cardStats) {
    const el = document.getElementById('stat-cards');
    if (el) el.textContent = data.cardStats.length.toLocaleString();
  }

  // Update top commander stat
  if (data.commanderStats && data.commanderStats.length) {
    const top = [...data.commanderStats].sort((a, b) => b.matches - a.matches)[0];
    const el = document.getElementById('stat-top-commander');
    if (el) el.textContent = top.name;
  }
}

document.addEventListener('DOMContentLoaded', init);
