/**
 * RetailPulse AI - API Service Layer
 * Abstracts data access and provides future-ready Axios/mock backend endpoints
 */
import axios from 'axios';
import {
  STORES,
  PRODUCTS,
  OVERVIEW_KPIS,
  RECENT_ALERTS,
  DEMAND_TREND_CHART_DATA,
  INVENTORY_HEALTH_DONUT,
  STORE_RISK_BAR_DATA,
  DEMAND_SKU_ITEMS,
  RISK_REGISTRY,
  NETWORK_NODES,
  NETWORK_ROUTES,
  INITIAL_TRANSFERS,
  INITIAL_RECOMMENDATIONS,
  PROMOTIONS_LIST,
  HIDDEN_DEMAND_DATA,
  IMPACT_BENCHMARKS,
  DECISION_HISTORY_AUDIT,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

// Configurable simulated network latency
const SIMULATED_DELAY_MS = 200;
const delay = (ms = SIMULATED_DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

// Optional base Axios instance for when backend is connected
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.retailpulse.ai/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const RetailPulseApi = {
  // Store & Product Metadata
  async getStores() {
    await delay(50);
    return STORES;
  },

  async getProducts() {
    await delay(50);
    return PRODUCTS;
  },

  // Page 1: Executive Overview
  async getExecutiveOverview(storeFilter = 'all') {
    await delay();
    return {
      kpis: OVERVIEW_KPIS,
      alerts: RECENT_ALERTS.filter(a => storeFilter === 'all' || a.store.toLowerCase() === storeFilter.toLowerCase()),
      demandTrend: DEMAND_TREND_CHART_DATA,
      inventoryHealth: INVENTORY_HEALTH_DONUT,
      storeRisks: STORE_RISK_BAR_DATA,
    };
  },

  // Page 2: Demand Intelligence
  async getDemandIntelligence({ store = 'all', product = 'all', horizon = 14 }) {
    await delay();
    let items = DEMAND_SKU_ITEMS;
    if (store !== 'all') {
      items = items.filter(i => i.store.toLowerCase() === store.toLowerCase());
    }
    if (product !== 'all') {
      items = items.filter(i => i.product.toLowerCase().includes(product.toLowerCase()));
    }
    return {
      forecastItems: items,
      forecastChart: DEMAND_TREND_CHART_DATA.slice(0, horizon === 7 ? 7 : horizon === 14 ? 14 : DEMAND_TREND_CHART_DATA.length),
    };
  },

  // Page 3: Risk Centre
  async getRisks({ store = 'all', category = 'all' }) {
    await delay();
    let risks = RISK_REGISTRY;
    if (store !== 'all') {
      risks = risks.filter(r => r.store.toLowerCase() === store.toLowerCase());
    }
    if (category !== 'all') {
      risks = risks.filter(r => r.category.toLowerCase().includes(category.toLowerCase()));
    }
    return risks;
  },

  // Page 4: Inventory Network
  async getNetworkData() {
    await delay();
    return {
      nodes: NETWORK_NODES,
      routes: NETWORK_ROUTES,
      transfers: INITIAL_TRANSFERS,
    };
  },

  async optimizeInventoryNetwork() {
    await delay(600); // Simulate network optimization algorithm computation
    // Generate intelligent redistributions based on surplus and deficits
    return [
      {
        id: 'TRF-OPT-' + Math.floor(1000 + Math.random() * 9000),
        source: 'Erode',
        destination: 'Coimbatore',
        product: '1L Sunflower Cooking Oil',
        quantity: 80,
        transferCost: '₹450',
        estimatedArrival: '3.5 hours',
        status: 'Optimization Ready',
        sourceExcess: 190,
        destDemand: 115,
        feasibility: 'Optimal (NH-544 Direct Corridor)',
        safetyStockRetained: '110 units (Safe)',
      },
      {
        id: 'TRF-OPT-' + Math.floor(1000 + Math.random() * 9000),
        source: 'Salem',
        destination: 'Coimbatore',
        product: 'Monsoon Windproof Umbrella',
        quantity: 60,
        transferCost: '₹380',
        estimatedArrival: '4.0 hours',
        status: 'Optimization Ready',
        sourceExcess: 85,
        destDemand: 65,
        feasibility: 'High (Overnight courier)',
        safetyStockRetained: '25 units (Safe)',
      },
      {
        id: 'TRF-OPT-' + Math.floor(1000 + Math.random() * 9000),
        source: 'Erode',
        destination: 'Chennai',
        product: 'Premium Digestive Biscuits',
        quantity: 120,
        transferCost: '₹720',
        estimatedArrival: '7.0 hours',
        status: 'Optimization Ready',
        sourceExcess: 268,
        destDemand: 140,
        feasibility: 'Medium (Long haul truck route)',
        safetyStockRetained: '148 units (Safe)',
      },
      {
        id: 'TRF-OPT-' + Math.floor(1000 + Math.random() * 9000),
        source: 'Tiruppur',
        destination: 'Coimbatore',
        product: 'Fresh Farm Milk 500ml',
        quantity: 90,
        transferCost: '₹220',
        estimatedArrival: '1.2 hours',
        status: 'Optimization Ready',
        sourceExcess: 140,
        destDemand: 85,
        feasibility: 'Immediate express van',
        safetyStockRetained: '50 units (Safe)',
      },
    ];
  },

  // Page 5: AI Decision Centre
  async getRecommendations({ store = 'all', status = 'all' }) {
    await delay();
    let recs = INITIAL_RECOMMENDATIONS;
    if (store !== 'all') {
      recs = recs.filter(r => r.store.toLowerCase() === store.toLowerCase());
    }
    if (status !== 'all') {
      recs = recs.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    return recs;
  },

  // Page 6: Decision Ripple Simulator Calculation Engine
  simulateScenario(params) {
    const {
      scenarioType,
      store,
      product,
      currentPrice = 100,
      discountPct = 20,
      currentInventory = 200,
      leadTimeDays = 4,
    } = params;

    // Realistic retail elasticity calculation
    // Demand increases exponentially or linearly with discount:
    // Elasticity factor ~ 2.4 for FMCG
    const elasticity = 2.4;
    const baseDemand = Math.round(currentInventory * 0.65);
    const demandIncreasePct = scenarioType === 'discount' || scenarioType === 'promotion'
      ? Math.round(discountPct * elasticity)
      : scenarioType === 'spike'
      ? 95
      : 25;

    const simulatedDemand = Math.round(baseDemand * (1 + demandIncreasePct / 100));
    const discountedPrice = currentPrice * (1 - discountPct / 100);
    
    // Financials
    const beforeRevenue = baseDemand * currentPrice;
    const beforeCost = baseDemand * (currentPrice * 0.7); // 30% margin baseline
    const beforeProfit = beforeRevenue - beforeCost;
    const beforeStockoutRisk = currentInventory < baseDemand ? 85 : Math.max(5, Math.round(((baseDemand) / (currentInventory || 1)) * 30));

    const unitShortage = Math.max(0, simulatedDemand - currentInventory);
    const afterStockoutRisk = unitShortage > 0 ? Math.min(99, Math.round(50 + (unitShortage / simulatedDemand) * 50)) : 12;

    const unitsSold = Math.min(simulatedDemand, currentInventory);
    const afterRevenue = Math.round(unitsSold * discountedPrice);
    const afterCost = Math.round(unitsSold * (currentPrice * 0.7));
    const expeditedLogisticsCost = unitShortage > 0 ? Math.round(unitShortage * 18) : 0;
    const afterProfit = afterRevenue - afterCost - expeditedLogisticsCost;

    // Ripple chain effects
    const rippleSteps = [
      {
        stage: 'PROMOTION & PRICING',
        title: `${discountPct}% Discount Applied`,
        description: `Price moves from ₹${currentPrice} to ₹${discountedPrice.toFixed(1)}`,
        status: 'neutral',
        metric: `₹${discountedPrice.toFixed(0)} / unit`,
      },
      {
        stage: 'DEMAND REACTION',
        title: `+${demandIncreasePct}% Demand Lift`,
        description: `Projected shopper velocity surges from ${baseDemand} to ${simulatedDemand} units`,
        status: 'positive',
        metric: `${simulatedDemand} units needed`,
      },
      {
        stage: 'INVENTORY DEPLETION',
        title: unitShortage > 0 ? `${unitShortage} Units Shortage` : 'Adequate Inventory',
        description: unitShortage > 0 ? `Stock exhausted in ~${Math.round((currentInventory / (simulatedDemand / 7)) * 24)} hours` : 'Backroom stock covers promotional duration',
        status: unitShortage > 0 ? 'negative' : 'positive',
        metric: `${currentInventory} in stock`,
      },
      {
        stage: 'REPLENISHMENT RIPPLE',
        title: unitShortage > 0 ? 'Emergency Transfer Triggered' : 'Normal Cadence',
        description: `Supplier lead time is ${leadTimeDays} days. Emergency cross-dock required.`,
        status: unitShortage > 0 ? 'warning' : 'positive',
        metric: `${leadTimeDays} days lead time`,
      },
      {
        stage: 'LOGISTICS & CARRIER COST',
        title: unitShortage > 0 ? `+₹${expeditedLogisticsCost} Transit Overhead` : '₹0 Expedited Surcharge',
        description: unitShortage > 0 ? 'Expedited freight required to prevent stockout' : 'Handled within standard logistics route',
        status: unitShortage > 0 ? 'negative' : 'positive',
        metric: `₹${expeditedLogisticsCost} cost`,
      },
      {
        stage: 'NET PROFIT IMPACT',
        title: afterProfit >= beforeProfit ? `+₹${afterProfit - beforeProfit} Profit Gain` : `-₹${beforeProfit - afterProfit} Profit Loss`,
        description: afterProfit >= beforeProfit ? 'High volume overcomes discount margin compression' : 'Logistics surcharge and margin cuts eroded profits',
        status: afterProfit >= beforeProfit ? 'positive' : 'negative',
        metric: `₹${afterProfit} net profit`,
      },
      {
        stage: 'CUSTOMER EXPERIENCE',
        title: afterStockoutRisk > 40 ? 'Severe Churn Risk' : 'High Satisfaction',
        description: afterStockoutRisk > 40 ? `${unitShortage} shoppers walk out without product` : '98.5% on-shelf availability maintained',
        status: afterStockoutRisk > 40 ? 'negative' : 'positive',
        metric: `${100 - afterStockoutRisk}% Fill Rate`,
      },
    ];

    // Options comparison
    const options = [
      {
        id: 'opt-a',
        name: 'Option A: Do Nothing',
        description: 'Keep baseline pricing and regular replenishment cadence without discount campaign.',
        projectedRevenue: `₹${beforeRevenue.toLocaleString()}`,
        projectedProfit: `₹${beforeProfit.toLocaleString()}`,
        stockoutRisk: `${beforeStockoutRisk}%`,
        isRecommended: false,
        summary: 'Safe but misses 28% available market growth.',
      },
      {
        id: 'opt-b',
        name: 'Option B: Increase Replenishment First',
        description: 'Pre-allocate +150 units from regional warehouse 48 hours prior, then launch full promo.',
        projectedRevenue: `₹${Math.round(simulatedDemand * discountedPrice).toLocaleString()}`,
        projectedProfit: `₹${Math.round(simulatedDemand * (discountedPrice - currentPrice * 0.7) - 600).toLocaleString()}`,
        stockoutRisk: '6%',
        isRecommended: true,
        summary: 'RECOMMENDED: Captures all incremental volume with zero customer disappointment.',
      },
      {
        id: 'opt-c',
        name: 'Option C: Moderate Promotion to 10%',
        description: 'Reduce discount to 10% to cap demand at exactly the current stock capacity of 200 units.',
        projectedRevenue: `₹${Math.round(200 * currentPrice * 0.9).toLocaleString()}`,
        projectedProfit: `₹${Math.round(200 * (currentPrice * 0.9 - currentPrice * 0.7)).toLocaleString()}`,
        stockoutRisk: '10%',
        isRecommended: false,
        summary: 'Preserves higher unit margins without any extra logistics overhead.',
      },
    ];

    return {
      before: {
        demand: baseDemand,
        stock: currentInventory,
        revenue: beforeRevenue,
        margin: '30.0%',
        profit: beforeProfit,
        stockoutRisk: `${beforeStockoutRisk}%`,
      },
      after: {
        demand: simulatedDemand,
        requiredInventory: simulatedDemand,
        revenue: afterRevenue,
        profit: afterProfit,
        stockoutRisk: `${afterStockoutRisk}%`,
        logisticsCost: expeditedLogisticsCost,
        margin: `${((afterProfit / (afterRevenue || 1)) * 100).toFixed(1)}%`,
      },
      rippleSteps,
      options,
      recommendationSummary: unitShortage > 0
        ? `Option B is the winning action. Pre-transferring 150 units from regional inventory eliminates the ${unitShortage}-unit stockout and protects ₹${afterRevenue - beforeRevenue} in additional top-line revenue.`
        : `Option C or standard promotional rollout is viable as current inventory safely absorbs the simulated ${demandIncreasePct}% demand lift.`,
    };
  },

  // Page 7: Promotion Guardian
  async getPromotions(store = 'all') {
    await delay();
    if (store === 'all') return PROMOTIONS_LIST;
    return PROMOTIONS_LIST.filter(p => p.store.toLowerCase() === store.toLowerCase());
  },

  // Page 8: Hidden Demand Detector
  async getHiddenDemand(store = 'all') {
    await delay();
    if (store === 'all') return HIDDEN_DEMAND_DATA;
    return HIDDEN_DEMAND_DATA.filter(h => h.store.toLowerCase() === store.toLowerCase());
  },

  // Page 9: Impact & Performance
  async getImpactBenchmarks() {
    await delay();
    return IMPACT_BENCHMARKS;
  },

  // Page 10: Decision History Audit
  async getDecisionHistory({ store = 'all', query = '' }) {
    await delay();
    let history = DECISION_HISTORY_AUDIT;
    if (store !== 'all') {
      history = history.filter(h => h.store.toLowerCase() === store.toLowerCase());
    }
    if (query) {
      const q = query.toLowerCase();
      history = history.filter(h =>
        h.id.toLowerCase().includes(q) ||
        h.product.toLowerCase().includes(q) ||
        h.store.toLowerCase().includes(q) ||
        h.recommendedAction.toLowerCase().includes(q)
      );
    }
    return history;
  },

  // Notifications
  async getNotifications() {
    await delay(50);
    return INITIAL_NOTIFICATIONS;
  },
};
