const API_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') : 'http://localhost:5000';

export const api = {
  async fetchStats() {
    const res = await fetch(`${API_URL}/api/stats`);
    return res.json();
  },
  async fetchMachines() {
    const res = await fetch(`${API_URL}/api/machines`);
    return res.json();
  },
  async fetchAttackPaths(startNode = 'PC-ALICE') {
    const res = await fetch(`${API_URL}/api/attack-paths?startNode=${startNode}`);
    return res.json();
  },
  async fetchVulnerabilities(startNode = 'PC-ALICE') {
    const res = await fetch(`${API_URL}/api/vulnerable-machines?startNode=${startNode}`);
    return res.json();
  },
  async fetchResources(startNode = 'PC-ALICE') {
    const res = await fetch(`${API_URL}/api/accessible-resources?startNode=${startNode}`);
    return res.json();
  },
  async fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      return res.json();
    } catch (e) {
      return [];
    }
  },
  async fetchGraph() {
    const res = await fetch(`${API_URL}/api/graph`);
    return res.json();
  },
  async fetchAllData() {
    const [stats, machines, paths, vulnerable, resources, users] = await Promise.all([
      this.fetchStats(),
      this.fetchMachines(),
      this.fetchAttackPaths(),
      this.fetchVulnerabilities(),
      this.fetchResources(),
      this.fetchUsers(),
    ]);
    return { stats, machines, paths, vulnerable, resources, users };
  }
};
