const STORAGE_KEY = 'northstar_scenarios';

export function saveScenario(name, nodes, customers, events) {
  const existing = loadAllScenarios();
  const scenario = {
    id: Date.now(),
    name,
    savedAt: new Date().toISOString(),
    nodeStates: nodes.map(n => ({ id: n.id, capacity: n.data.capacity, status: n.data.status, count: n.data.count })),
    customerCount: customers.length,
    totalMRR: customers.reduce((s, c) => s + c.rate, 0),
    eventCount: events.length,
    summary: {
      avgCapacity: Math.round(nodes.reduce((s, n) => s + (n.data.capacity || 0), 0) / nodes.length),
      criticalNodes: nodes.filter(n => n.data.status === 'critical').length,
      warningNodes: nodes.filter(n => n.data.status === 'warning').length,
    },
  };
  existing.push(scenario);
  // Keep max 10 scenarios
  const trimmed = existing.slice(-10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return scenario;
}

export function loadAllScenarios() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteScenario(id) {
  const existing = loadAllScenarios().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function loadScenarioIntoNodes(scenario, currentNodes) {
  const stateMap = Object.fromEntries(scenario.nodeStates.map(s => [s.id, s]));
  return currentNodes.map(n => {
    const saved = stateMap[n.id];
    if (!saved) return n;
    return {
      ...n,
      data: {
        ...n.data,
        capacity: saved.capacity,
        status: saved.status,
        count: saved.count !== undefined ? saved.count : n.data.count,
      },
    };
  });
}
