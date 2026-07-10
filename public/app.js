const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const gridSize = 24;

const conditionCosts = {
  used: { 20: 2800, 40: 4200 },
  'cargo-worthy': { 20: 3800, 40: 6200 },
  'one-trip': { 20: 5200, 40: 8600 }
};

const state = {
  id: null,
  name: 'Starter container home',
  site: {
    landCost: 45000,
    sitePrep: 18000,
    foundation: 26000,
    permitEngineering: 12000,
    contingencyPercent: 12
  },
  systems: {
    electrical: 28000,
    plumbing: 24000,
    hvac: 18000,
    insulation: 22000,
    waterSewer: 30000,
    solarBattery: 0
  },
  houseComparison: {
    purchasePrice: 325000,
    downPaymentPercent: 10,
    closingCostPercent: 3,
    repairReserve: 15000
  },
  selectedId: 'container-1',
  containers: [
    {
      id: 'container-1',
      label: 'C1',
      size: '40',
      condition: 'cargo-worthy',
      level: 1,
      rotation: 0,
      x: 72,
      y: 96,
      modifications: { cutOpenings: true, reinforce: true, joinery: true }
    },
    {
      id: 'container-2',
      label: 'C2',
      size: '40',
      condition: 'cargo-worthy',
      level: 1,
      rotation: 0,
      x: 72,
      y: 168,
      modifications: { cutOpenings: true, reinforce: true, joinery: true }
    }
  ]
};

const el = {
  grid: document.querySelector('#siteGrid'),
  costBreakdown: document.querySelector('#costBreakdown'),
  totalCost: document.querySelector('#totalCost'),
  comparison: document.querySelector('#comparison'),
  savedProjects: document.querySelector('#savedProjects'),
  saveStatus: document.querySelector('#saveStatus'),
  projectName: document.querySelector('#projectName'),
  selectedName: document.querySelector('#selectedName'),
  conditionInput: document.querySelector('#conditionInput'),
  levelInput: document.querySelector('#levelInput'),
  cutOpeningsInput: document.querySelector('#cutOpeningsInput'),
  reinforceInput: document.querySelector('#reinforceInput'),
  joineryInput: document.querySelector('#joineryInput')
};

function selectedContainer() {
  return state.containers.find((container) => container.id === state.selectedId);
}

function setByPath(path, value) {
  const [group, key] = path.split('.');
  state[group][key] = Number(value) || 0;
}

function containerBaseCost(container) {
  return conditionCosts[container.condition][container.size];
}

function containerModificationCost(container) {
  const lengthMultiplier = container.size === '40' ? 1 : 0.62;
  let cost = 0;
  if (container.modifications.cutOpenings) cost += 4500 * lengthMultiplier;
  if (container.modifications.reinforce) cost += 6500 * lengthMultiplier;
  if (container.modifications.joinery) cost += 5200 * lengthMultiplier;
  if (container.level > 1) cost += 9000;
  return Math.round(cost);
}

function calculateCosts() {
  const containerPurchase = state.containers.reduce((sum, container) => sum + containerBaseCost(container), 0);
  const containerMods = state.containers.reduce((sum, container) => sum + containerModificationCost(container), 0);
  const deliverySet = state.containers.reduce((sum, container) => sum + (container.size === '40' ? 4200 : 2800), 0);
  const siteCosts = state.site.landCost + state.site.sitePrep + state.site.foundation + state.site.permitEngineering;
  const systemCosts = Object.values(state.systems).reduce((sum, cost) => sum + cost, 0);
  const subtotal = containerPurchase + containerMods + deliverySet + siteCosts + systemCosts;
  const contingency = Math.round(subtotal * (state.site.contingencyPercent / 100));
  const total = subtotal + contingency;

  return {
    'Containers': containerPurchase,
    'Container modifications': containerMods,
    'Delivery and crane setting': deliverySet,
    'Land, prep, foundation, permits': siteCosts,
    'Electrical, plumbing, HVAC, utilities': systemCosts,
    'Contingency': contingency,
    total
  };
}

function buyingCosts() {
  const purchase = state.houseComparison.purchasePrice;
  const cashNeeded =
    purchase * (state.houseComparison.downPaymentPercent / 100) +
    purchase * (state.houseComparison.closingCostPercent / 100) +
    state.houseComparison.repairReserve;
  return { purchase, cashNeeded };
}

function renderContainers() {
  el.grid.innerHTML = '';

  state.containers.forEach((container) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `container-module${container.id === state.selectedId ? ' selected' : ''}`;
    node.dataset.id = container.id;
    node.dataset.size = container.size;
    node.dataset.rotation = String(container.rotation);
    node.style.left = `${container.x}px`;
    node.style.top = `${container.y}px`;
    node.textContent = `${container.label} / ${container.size} ft`;
    node.addEventListener('pointerdown', startDrag);
    node.addEventListener('click', () => {
      state.selectedId = container.id;
      render();
    });
    el.grid.appendChild(node);
  });
}

function startDrag(event) {
  const container = state.containers.find((item) => item.id === event.currentTarget.dataset.id);
  if (!container) return;
  state.selectedId = container.id;

  const rect = el.grid.getBoundingClientRect();
  const move = (moveEvent) => {
    const width = container.size === '40' ? 192 : 96;
    const maxX = el.grid.clientWidth - width;
    const maxY = el.grid.clientHeight - 48;
    container.x = Math.max(0, Math.min(maxX, Math.round((moveEvent.clientX - rect.left - width / 2) / gridSize) * gridSize));
    container.y = Math.max(0, Math.min(maxY, Math.round((moveEvent.clientY - rect.top - 24) / gridSize) * gridSize));
    render();
  };

  const stop = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
}

function renderInputs() {
  el.projectName.value = state.name;
  document.querySelectorAll('[data-path]').forEach((input) => {
    const [group, key] = input.dataset.path.split('.');
    input.value = state[group][key];
  });

  const selected = selectedContainer();
  el.selectedName.textContent = selected ? `${selected.label} - ${selected.size} ft` : 'None';
  [el.conditionInput, el.levelInput, el.cutOpeningsInput, el.reinforceInput, el.joineryInput].forEach((input) => {
    input.disabled = !selected;
  });

  if (selected) {
    el.conditionInput.value = selected.condition;
    el.levelInput.value = selected.level;
    el.cutOpeningsInput.checked = selected.modifications.cutOpenings;
    el.reinforceInput.checked = selected.modifications.reinforce;
    el.joineryInput.checked = selected.modifications.joinery;
  }
}

function renderCosts() {
  const costs = calculateCosts();
  el.costBreakdown.innerHTML = Object.entries(costs)
    .filter(([label]) => label !== 'total')
    .map(([label, value]) => `<div class="line-item"><span>${label}</span><strong>${money.format(value)}</strong></div>`)
    .join('');
  el.totalCost.textContent = money.format(costs.total);

  const buy = buyingCosts();
  const delta = buy.purchase - costs.total;
  const deltaText = delta >= 0
    ? `${money.format(delta)} less than buying at list price`
    : `${money.format(Math.abs(delta))} more than buying at list price`;

  el.comparison.innerHTML = `
    <div class="comparison-row"><span>Existing home price</span><strong>${money.format(buy.purchase)}</strong></div>
    <div class="comparison-row"><span>Estimated cash to buy</span><strong>${money.format(buy.cashNeeded)}</strong></div>
    <div class="comparison-row"><span>Build comparison</span><strong>${deltaText}</strong></div>
  `;
}

function render() {
  renderContainers();
  renderInputs();
  renderCosts();
}

function addContainer(size) {
  const next = state.containers.length + 1;
  state.containers.push({
    id: `container-${Date.now()}`,
    label: `C${next}`,
    size,
    condition: size === '40' ? 'cargo-worthy' : 'used',
    level: 1,
    rotation: 0,
    x: 96 + (next * gridSize) % 360,
    y: 96 + (next * gridSize) % 240,
    modifications: { cutOpenings: true, reinforce: false, joinery: state.containers.length > 0 }
  });
  state.selectedId = state.containers[state.containers.length - 1].id;
  render();
}

async function loadSavedProjects() {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();
    if (!projects.length) {
      el.savedProjects.innerHTML = '<div class="status">No saved projects yet.</div>';
      return;
    }

    el.savedProjects.innerHTML = projects.map((project) => `
      <button class="saved-project" type="button" data-id="${project.id}">
        <span>${project.name}<br><small>${new Date(project.updatedAt).toLocaleDateString()}</small></span>
        <strong>${money.format(project.totalCost || 0)}</strong>
      </button>
    `).join('');
  } catch (error) {
    el.savedProjects.innerHTML = '<div class="status">Saved projects could not be loaded.</div>';
  }
}

async function saveProject() {
  const payload = { ...state, totalCost: calculateCosts().total };
  const response = await fetch(state.id ? `/api/projects/${state.id}` : '/api/projects', {
    method: state.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();

  if (!response.ok) {
    el.saveStatus.textContent = result.error || 'Project could not be saved.';
    return;
  }

  state.id = result.id;
  el.saveStatus.textContent = 'Project saved.';
  loadSavedProjects();
}

document.querySelectorAll('[data-path]').forEach((input) => {
  input.addEventListener('input', () => {
    setByPath(input.dataset.path, input.value);
    renderCosts();
  });
});

el.projectName.addEventListener('input', () => {
  state.name = el.projectName.value;
});

document.querySelector('#add40').addEventListener('click', () => addContainer('40'));
document.querySelector('#add20').addEventListener('click', () => addContainer('20'));
document.querySelector('#rotateSelected').addEventListener('click', () => {
  const selected = selectedContainer();
  if (selected) selected.rotation = selected.rotation === 90 ? 0 : 90;
  render();
});
document.querySelector('#duplicateSelected').addEventListener('click', () => {
  const selected = selectedContainer();
  if (!selected) return;
  const clone = JSON.parse(JSON.stringify(selected));
  clone.id = `container-${Date.now()}`;
  clone.label = `C${state.containers.length + 1}`;
  clone.x += gridSize * 2;
  clone.y += gridSize * 2;
  state.containers.push(clone);
  state.selectedId = clone.id;
  render();
});
document.querySelector('#removeSelected').addEventListener('click', () => {
  state.containers = state.containers.filter((container) => container.id !== state.selectedId);
  state.selectedId = state.containers[0]?.id || null;
  render();
});
document.querySelector('#saveProject').addEventListener('click', saveProject);

el.conditionInput.addEventListener('change', () => {
  const selected = selectedContainer();
  if (selected) selected.condition = el.conditionInput.value;
  render();
});
el.levelInput.addEventListener('input', () => {
  const selected = selectedContainer();
  if (selected) selected.level = Number(el.levelInput.value) || 1;
  render();
});
el.cutOpeningsInput.addEventListener('change', () => {
  const selected = selectedContainer();
  if (selected) selected.modifications.cutOpenings = el.cutOpeningsInput.checked;
  render();
});
el.reinforceInput.addEventListener('change', () => {
  const selected = selectedContainer();
  if (selected) selected.modifications.reinforce = el.reinforceInput.checked;
  render();
});
el.joineryInput.addEventListener('change', () => {
  const selected = selectedContainer();
  if (selected) selected.modifications.joinery = el.joineryInput.checked;
  render();
});

el.savedProjects.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  const response = await fetch(`/api/projects/${button.dataset.id}`);
  if (!response.ok) return;
  const project = await response.json();
  Object.assign(state, project, { id: project.id, selectedId: project.containers[0]?.id || null });
  render();
});

render();
loadSavedProjects();
