import React, { useState, useEffect } from 'react';
import {
  Network,
  Truck,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/RiskBadge';

const InventoryNetwork = () => {
  const { selectedStore, setSelectedStore } = useApp();
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationPlan, setOptimizationPlan] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getNetworkData().then((data) => {
      if (isMounted) {
        setNetworkData(data);
        setLoading(false);
        // Default select coimbatore or matching selectedStore
        const initial = data.nodes.find(n => n.id === selectedStore) || data.nodes[0];
        setSelectedNode(initial);
      }
    });
    return () => { isMounted = false; };
  }, [selectedStore]);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    const generatedPlan = await RetailPulseApi.optimizeInventoryNetwork();
    setOptimizationPlan(generatedPlan);
    setIsOptimizing(false);
    setIsPlanModalOpen(true);
  };

  if (loading || !networkData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
          <RefreshCw className="pulse-dot" />
          <span style={{ fontWeight: 600 }}>Initializing multi-store topology...</span>
        </div>
      </div>
    );
  }

  const { nodes, routes, transfers } = networkData;

  const transferColumns = [
    {
      header: 'Transfer Route',
      key: 'route',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: '#1E293B' }}>{row.source}</span>
          <ArrowRight size={14} color="var(--color-primary)" />
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.destination}</span>
        </div>
      ),
    },
    {
      header: 'Product / SKU',
      key: 'product',
      render: (row) => <strong>{row.product}</strong>,
    },
    {
      header: 'Quantity',
      key: 'quantity',
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-dark-navy)' }}>
          {row.quantity} units
        </span>
      ),
    },
    {
      header: 'Source Excess',
      key: 'sourceExcess',
      align: 'right',
      render: (row) => (
        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
          +{row.sourceExcess} avail
        </span>
      ),
    },
    {
      header: 'Dest Demand',
      key: 'destDemand',
      align: 'right',
      render: (row) => (
        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
          {row.destDemand} req
        </span>
      ),
    },
    {
      header: 'Transfer Cost',
      key: 'transferCost',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {row.transferCost}
        </span>
      ),
    },
    {
      header: 'Transit Time',
      key: 'estimatedArrival',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={13} color="var(--color-text-secondary)" />
          <span>{row.estimatedArrival}</span>
        </div>
      ),
    },
    {
      header: 'Source Safety Stock',
      key: 'safetyStockRetained',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          {row.safetyStockRetained}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="inventory-network-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Inventory Network & Cross-Store Balancing</h2>
          <p className="page-subtitle">
            Autonomous multi-store redistribution topology across Coimbatore, Erode, Tiruppur, Salem, and Chennai.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleRunOptimization}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <>
                <RefreshCw size={16} className="pulse-dot" /> Calculating Optimal Redistribution...
              </>
            ) : (
              <>
                <Zap size={16} /> Optimize Network Inventory
              </>
            )}
          </button>
        </div>
      </div>

      {/* Network Map Graph Visualization */}
      <div className="section-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={18} color="var(--color-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Interactive Store Topology & Cross-Dock Corridors
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A' }} /> Optimal Health (&gt;85%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} /> Moderate Risk
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626' }} /> Urgent Deficit
            </span>
          </div>
        </div>

        {/* Visual Map Canvas */}
        <div className="network-graph-container">
          {/* SVG Connection Lines & Active Truck Corridors */}
          <svg className="network-svg-layer">
            <defs>
              <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Connecting Roads */}
            {/* Coimbatore (22, 64) -> Tiruppur (38, 52) */}
            <line x1="22%" y1="64%" x2="38%" y2="52%" stroke="url(#corridorGrad)" strokeWidth="2.5" strokeDasharray="6 4" />
            {/* Tiruppur (38, 52) -> Erode (54, 44) */}
            <line x1="38%" y1="52%" x2="54%" y2="44%" stroke="url(#corridorGrad)" strokeWidth="2.5" strokeDasharray="6 4" />
            {/* Erode (54, 44) -> Salem (70, 34) */}
            <line x1="54%" y1="44%" x2="70%" y2="34%" stroke="url(#corridorGrad)" strokeWidth="2.5" strokeDasharray="6 4" />
            {/* Salem (70, 34) -> Chennai (88, 22) */}
            <line x1="70%" y1="34%" x2="88%" y2="22%" stroke="url(#corridorGrad)" strokeWidth="2.5" strokeDasharray="6 4" />
            {/* Erode -> Coimbatore Direct Highway NH-544 */}
            <path d="M 22 64 Q 38 68 54 44" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 2" />

            {/* Moving Transit Pulse Dots */}
            <circle cx="30%" cy="58%" r="4" fill="#38BDF8">
              <animate attributeName="cx" from="22%" to="38%" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cy" from="64%" to="52%" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="46%" cy="48%" r="4" fill="#34D399">
              <animate attributeName="cx" from="54%" to="22%" dur="4s" repeatCount="indefinite" />
              <animate attributeName="cy" from="44%" to="64%" dur="4s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Interactive Store Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const healthColor = node.health >= 85 ? '#16A34A' : node.health >= 80 ? '#F59E0B' : '#DC2626';

            return (
              <div
                key={node.id}
                className="network-node-pin"
                style={{ left: `${node.pos.x}%`, top: `${node.pos.y}%` }}
                onClick={() => {
                  setSelectedNode(node);
                  setSelectedStore(node.id);
                }}
              >
                <div className={`node-card-compact ${isSelected ? 'selected' : ''}`}>
                  <div className="node-title">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} color="#38BDF8" /> {node.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: healthColor,
                      }}
                    >
                      {node.health}%
                    </span>
                  </div>

                  <div className="node-metric-row">
                    <span>Stockouts:</span>
                    <span className="node-metric-val" style={{ color: node.stockoutCount > 3 ? '#F87171' : '#E2E8F0' }}>
                      {node.stockoutCount} SKUs
                    </span>
                  </div>

                  <div className="node-metric-row">
                    <span>Overstock:</span>
                    <span className="node-metric-val" style={{ color: '#FCD34D' }}>
                      {node.overstockCount} SKUs
                    </span>
                  </div>

                  <div className="node-metric-row">
                    <span>Available:</span>
                    <span className="node-metric-val">{node.availableProducts} items</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Store Quick Inspection Drawer */}
        {selectedNode && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                Selected Hub Inspection
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark-navy)' }}>
                {selectedNode.name} Supermarket ({selectedNode.code})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Urgent Deficits:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                  {selectedNode.urgentDeficits.length > 0 ? selectedNode.urgentDeficits.join(', ') : 'None (Balanced)'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Excess Inventory:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: '0.85rem' }}>
                  {selectedNode.excessSurplus.join(', ')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Transit Lead Time to Erode Hub:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                  ~2.4 hours (NH-544)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Transfer Recommendations Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <Truck size={18} color="var(--color-primary)" />
              Active & Recommended Inter-Store Inventory Transfers
            </div>
            <div className="section-card-subtitle">
              Intelligent lateral transshipment preventing stockouts without external supplier delays
            </div>
          </div>
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> Real-Time Cross-Dock Routing
          </span>
        </div>

        <DataTable columns={transferColumns} data={transfers} />
      </div>

      {/* Optimization Redistribution Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Network Inventory Redistribution Plan Generated"
        maxWidth="780px"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsPlanModalOpen(false)}>
              Dismiss
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                alert('Redistribution manifest dispatched to regional carrier fleet!');
                setIsPlanModalOpen(false);
              }}
            >
              <CheckCircle2 size={16} /> Execute All Transfers
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.85rem',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Sparkles size={22} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-active)', fontSize: '0.85rem' }}>
                Algorithmic Optimization Results
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Analyzed 1,250 SKUs across 5 stores. Proposed 4 lateral transfers resolving 100% of critical deficits while preserving minimum safety buffers across origin stores.
              </p>
            </div>
          </div>

          <DataTable columns={transferColumns} data={optimizationPlan || []} />
        </div>
      </Modal>
    </div>
  );
};

export default InventoryNetwork;
