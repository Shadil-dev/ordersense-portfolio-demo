import NavigationDrawer from './NavigationDrawer';
import ModalDialog from './ModalDialog';
import ResultsPager from './ResultsPager';
import { useResultPage } from './useResultPage';
import { buildPurchaseForecastRows, type PurchaseForecastRow } from './predictionForecast';
import HeaderSyncControl from './HeaderSyncControl';
import ResponsiveTable from './ResponsiveTable';
import { useState, useEffect, useMemo } from 'react';
import AccountsDashboard from './AccountsDashboard';
import CustomerCreditPage from './CustomerCreditPage';
import FollowupPanel from './FollowupPanel';
import OrderHoldsPage from './OrderHoldsPage';
import AdminUserManagement from './AdminUserManagement';
import DeliveryOperationsPage from './DeliveryOperationsPage';
import FinanceActivityDashboard from './FinanceActivityDashboard';
import SalesFollowupDashboard from './SalesFollowupDashboard';
import SalesCrm from './sales/SalesCrm';
import CeoDashboard from './CeoDashboard';
import { DiscontinuedItems, SuppressionAudit, SuppressionDialog } from './SuppressionControls';
import type { PredictionPair } from './SuppressionControls';
import {
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Database,
  ShoppingBag,
  PackageCheck,
  BarChart3,
  Mail,
  LogOut,
  Users,
  Key,
  Menu,
  X,
  Eye,
  EyeOff,
  Ban,
  Phone
} from 'lucide-react';

// Zestora Logo inline SVG component
const ZestoraLogo = () => (
  <svg viewBox="0 0 120 120" style={{ width: '28px', height: '28px' }} fill="currentColor" aria-hidden="true">
    {/* Top-Left Shape */}
    <path d="M 10 10 H 68 C 68 36 44 60 10 68 V 10 Z" />

    {/* Middle Leaf Shape */}
    <path d="M 12 90 C 26 62 62 26 90 12 C 78 48 48 78 12 90 Z" />

    {/* Bottom-Right Shape */}
    <path d="M 110 110 H 52 C 52 84 76 60 110 52 V 110 Z" />
  </svg>
);

// Interfaces for backend entities
interface ProductPrediction {
  id: number;
  customerId: string;
  customerName: string;
  customerStatus: string;
  productId: string;
  productName: string;
  manufacturer: string | null;
  preferredVendor: string | null;
  costPrice: number | null;
  avgDaysBetweenOrders: number | null;
  lastOrderDate: string | null;
  predictedOrderDate: string | null;
  daysUntilPredicted: number | null;
  lastQtyOrdered: number | null;
  avgQty: number | null;
  predictedQty: number | null;
  qtyTrend: string | null;
  cycleConfidence: number | null;
  qtyConfidence: number | null;
  totalOrders: number | null;
  alertSent: boolean;
  alertSentAt: string | null;
  updatedAt: string | null;
}

export interface PredictionSuppression {
  customerId: string;
  productId: string;
  customerName: string;
  productName: string;
  reason: string;
  createdByUserId: number;
  createdByEmail: string;
  createdAt: string;
}

interface SuppressionAuditLog {
  id: number;
  customerId: string;
  productId: string;
  customerName: string;
  productName: string;
  action: string; // SUPPRESS | REACTIVATE | AUTO_REACTIVATED
  reason: string | null;
  performedByEmail: string | null;
  performedAt: string;
}

export interface AuditLogPage {
  content: SuppressionAuditLog[];
  totalPages: number;
  totalElements: number;
  number: number; // current page (0-indexed)
}

interface CustomerConsumption {
  customerId: string;
  customerName: string;
  customerStatus: string;
  totalMonthlyVolume: number;
  products: {
    productId: string;
    productName: string;
    avgDaysBetweenOrders: number | null;
    avgQty: number | null;
    projectedVolume: number;
    qtyTrend: string | null;
    cycleConfidence: number | null;
    predictedQty: number | null;
    costPrice: number | null;
    color: string;
  }[];
}

const chartColors = [
  'hsl(221, 83%, 53%)', // Zestora Navy-Blue Accent
  'hsl(142, 69%, 45%)', // Green Accent
  'hsl(35, 90%, 50%)',  // Amber Accent
  'hsl(200, 95%, 45%)', // Cyan Accent
  'hsl(280, 80%, 60%)', // Purple Accent
  'hsl(340, 75%, 55%)', // Pink Accent
  'hsl(15, 90%, 55%)',  // Orange Accent
  'hsl(170, 80%, 40%)', // Teal Accent
];

// Interactive Customer Donut Chart Component
function CustomerCard({ customer }: {
  customer: CustomerConsumption;
}) {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  const totalVolume = customer.totalMonthlyVolume;
  const activeProductsCount = customer.products.length;

  // Avg Cycle calculation
  const validCycles = customer.products.filter(p => p.avgDaysBetweenOrders !== null);
  const avgCycle = validCycles.length > 0
    ? Math.round(validCycles.reduce((sum, p) => sum + (p.avgDaysBetweenOrders || 0), 0) / validCycles.length)
    : 0;

  // Circumference of SVG Circle (r=50)
  const R = 50;
  const C = 2 * Math.PI * R; // ~314.159

  let accumulatedPercent = 0;
  const slices = customer.products.map((prod) => {
    const percent = totalVolume > 0 ? prod.projectedVolume / totalVolume : 0;
    const dashArray = `${percent * C} ${C}`;
    const dashOffset = -accumulatedPercent * C;
    accumulatedPercent += percent;
    return {
      ...prod,
      percent,
      dashArray,
      dashOffset
    };
  });

  const hoveredProduct = customer.products.find(p => p.productId === hoveredProductId);

  return (
    <div className="customer-card">
      <div className="card-header">
        <div className="customer-avatar" aria-hidden="true"><Users size={20} /></div>
        <div className="card-title-group">
          <h3 className="card-customer-name">
            <span className={`status-dot ${customer.customerStatus === 'active' ? 'active' : 'inactive'}`}></span>
            {customer.customerName}
          </h3>
          <div className="customer-meta-line">
            <span className="card-customer-id">ID: {customer.customerId}</span>
            <span className="card-meta-badge">{activeProductsCount} {activeProductsCount === 1 ? 'Product' : 'Products'}</span>
          </div>
        </div>
      </div>

      <div className="customer-quick-stats"><span><strong>{totalVolume.toLocaleString()} u</strong> Monthly volume</span><span><strong>{avgCycle} days</strong> Avg. cycle</span></div>
      <details className="customer-analysis"><summary>Product mix & details <span aria-hidden="true">+</span></summary><div className="card-body">
        {/* Visualization Panel */}
        <div className="chart-panel">
          <div className="mobile-total-volume-header">Total Volume</div>
          <div className="donut-wrapper">
            <svg viewBox="0 0 160 160" className="donut-svg">
              <circle
                cx="80"
                cy="80"
                r={R}
                fill="transparent"
                stroke="var(--bg-primary)"
                strokeWidth="14"
              />
              {slices.map((slice) => {
                const isHovered = hoveredProductId === slice.productId;
                return (
                  <circle
                    key={slice.productId}
                    cx="80"
                    cy="80"
                    r={R}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 20 : 14}
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    className="donut-slice"
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '80px 80px',
                      transition: 'stroke-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.25s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setHoveredProductId(slice.productId)}
                    onMouseLeave={() => setHoveredProductId(null)}
                  />
                );
              })}

              <g className="donut-center-text-group">
                <text x="80" y="78" textAnchor="middle" className="donut-center-value">
                  {totalVolume.toLocaleString()}
                </text>
                <text x="80" y="96" textAnchor="middle" className="donut-center-label">
                  units
                </text>
              </g>
            </svg>
          </div>

          <div className="donut-hover-info">
            {hoveredProduct ? (
              <div className="hover-info-content animate-slideIn">
                <span className="hover-product-name" title={hoveredProduct.productName}>
                  {hoveredProduct.productName}
                </span>
                <span className="hover-product-stats">
                  <strong>{hoveredProduct.projectedVolume.toLocaleString()}</strong> units • <strong>{((hoveredProduct.projectedVolume / totalVolume) * 100).toFixed(0)}%</strong> share
                </span>
              </div>
            ) : (
              <div className="hover-info-placeholder">
                Hover slices for product breakdown
              </div>
            )}
          </div>

          <div className="customer-summary-stats">
            <div className="card-sub-stat">
              <span className="sub-stat-label">Order Cycle</span>
              <span className="sub-stat-value">
                {avgCycle > 0 ? `Avg. every ${avgCycle}d` : 'No order cycle'}
              </span>
            </div>
          </div>
        </div>

        {/* Legend / Product Details list */}
        <div className="legend-panel">
          <h4 className="legend-heading">Product Breakdown</h4>
          <div className="legend-list scrollbar-custom">
            {customer.products.map((prod) => {
              const isHovered = hoveredProductId === prod.productId;
              return (
                <div
                  key={prod.productId}
                  className={`legend-item ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredProductId(prod.productId)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  <div className="legend-item-left">
                    <span className="legend-color-dot" style={{ backgroundColor: prod.color }}></span>
                    <div className="legend-item-info">
                      <span className="legend-product-name" title={prod.productName}>{prod.productName}</span>
                      <span className="legend-product-cycle">
                        {prod.avgDaysBetweenOrders ? `Every ${prod.avgDaysBetweenOrders}d` : 'No cycle'}
                        {prod.avgQty ? ` • Avg: ${Math.round(prod.avgQty)} u` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="legend-item-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="legend-product-volume">
                        {prod.projectedVolume.toLocaleString()} u
                      </span>
                      {prod.qtyTrend === 'up' && <span title="Increasing Trend" style={{ display: 'flex' }}><TrendingUp size={12} style={{ color: 'var(--color-overdue)' }} /></span>}
                      {prod.qtyTrend === 'down' && <span title="Decreasing Trend" style={{ display: 'flex' }}><TrendingDown size={12} style={{ color: 'var(--color-safe)' }} /></span>}
                      {(prod.qtyTrend === 'flat' || !prod.qtyTrend) && <span title="Stable Trend" style={{ display: 'flex' }}><Minus size={12} style={{ color: 'var(--text-muted)' }} /></span>}
                    </div>
                    <span className="legend-product-pct">
                      {totalVolume > 0 ? `${((prod.projectedVolume / totalVolume) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div></details>
    </div>
  );
}

// Interactive Product Donut Chart Component
function ProductDonutChart({ data }: {
  data: {
    productId: string;
    productName: string;
    customersShare: {
      customerId: string;
      customerName: string;
      projectedVolume: number;
    }[];
    totalVolumeForProduct: number;
  };
}) {
  const [hoveredCustomerId, setHoveredCustomerId] = useState<string | null>(null);

  const totalVolume = data.totalVolumeForProduct;
  
  // Circumference of SVG Circle (r=50)
  const R = 50;
  const C = 2 * Math.PI * R; // ~314.159

  let accumulatedPercent = 0;
  const slices = data.customersShare.map((cust, idx) => {
    const percent = totalVolume > 0 ? cust.projectedVolume / totalVolume : 0;
    const dashArray = `${percent * C} ${C}`;
    const dashOffset = -accumulatedPercent * C;
    accumulatedPercent += percent;
    const color = chartColors[idx % chartColors.length];
    return {
      ...cust,
      percent,
      dashArray,
      dashOffset,
      color
    };
  });

  const hoveredCustomer = data.customersShare.find(c => c.customerId === hoveredCustomerId);

  return (
    <div className="product-donut-layout animate-slideIn">

      <div style={{ 
        fontSize: '13px', 
        fontWeight: 700, 
        color: 'var(--brand-navy)', 
        marginBottom: '16px',
        padding: '6px 12px',
        background: 'var(--bg-primary)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        whiteSpace: 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }} title={data.productName}>
        Product: {data.productName}
      </div>

      <div className="donut-wrapper" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 160 160" className="donut-svg" style={{ width: '180px', height: '180px' }}>
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="transparent"
            stroke="var(--bg-primary)"
            strokeWidth="14"
          />
          {slices.map((slice) => {
            const isHovered = hoveredCustomerId === slice.customerId;
            return (
              <circle
                key={slice.customerId}
                cx="80"
                cy="80"
                r={R}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? 20 : 14}
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                className="donut-slice"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '80px 80px',
                  transition: 'stroke-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.25s',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCustomerId(slice.customerId)}
                onMouseLeave={() => setHoveredCustomerId(null)}
              />
            );
          })}

          <g className="donut-center-text-group" style={{ pointerEvents: 'none' }}>
            <text x="80" y="78" textAnchor="middle" className="donut-center-value" style={{ fill: 'var(--brand-navy)', fontWeight: 800, fontSize: '18px' }}>
              {totalVolume.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </text>
            <text x="80" y="96" textAnchor="middle" className="donut-center-label" style={{ fill: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              units
            </text>
          </g>
        </svg>
      </div>

      <div className="donut-hover-info" style={{ height: '40px', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {hoveredCustomer ? (
          <div className="hover-info-content animate-slideIn" style={{ textAlign: 'center' }}>
            <span className="hover-product-name" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-navy)' }}>
              {hoveredCustomer.customerName}
            </span>
            <br />
            <span className="hover-product-stats" style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <strong>{hoveredCustomer.projectedVolume.toLocaleString()}</strong> units • <strong>{((hoveredCustomer.projectedVolume / totalVolume) * 100).toFixed(0)}%</strong> share
            </span>
          </div>
        ) : (
          <div className="hover-info-placeholder" style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Hover slices for customer breakdown
          </div>
        )}
      </div>

      <div className="legend-list scrollbar-custom" style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {slices.map((slice) => {
          const isHovered = hoveredCustomerId === slice.customerId;
          return (
            <div
              key={slice.customerId}
              className={`legend-item ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCustomerId(slice.customerId)}
              onMouseLeave={() => setHoveredCustomerId(null)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                background: isHovered ? 'var(--bg-surface-hover)' : 'transparent',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="legend-color-dot" style={{ backgroundColor: slice.color, width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 }}></span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-navy)', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                  {slice.customerName}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {slice.projectedVolume.toLocaleString()} u ({((slice.projectedVolume / totalVolume) * 100).toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// Connected to the Spring Boot REST API
// The portfolio build is the real product UI with an isolated in-browser data source.
const LOCAL_PREVIEW = true;
const API_BASE = '/api';
const OWNER_EMAIL = 'shadil@zestorahospitality.com';

function App() {
  const [suppressionDialog, setSuppressionDialog] = useState<{ pair: PredictionPair; action: 'suppress' | 'reactivate' } | null>(null);
  const [suppressionRevision, setSuppressionRevision] = useState(0);
  const [adminView, setAdminView] = useState<'users' | 'audit'>('users');
  const [accountsView, setAccountsView] = useState<'alerts' | 'holds' | 'followups' | 'promises' | 'credit' | 'activity'>('promises');
  const [canManageCredit, setCanManageCredit] = useState(false);
  const [canFollowup, setCanFollowup] = useState(false);
  const [canViewOrderHolds, setCanViewOrderHolds] = useState(false);
  const [canScheduleDelivery, setCanScheduleDelivery] = useState(false);
  const [canReviewDelivery, setCanReviewDelivery] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canUseAdminPanel, setCanUseAdminPanel] = useState(false);
  const [visibleModules, setVisibleModules] = useState<string[]>([]);
  const [accessReady, setAccessReady] = useState(false);
  const [followupRevision, setFollowupRevision] = useState(0);
  const [ceoSyncRevision, setCeoSyncRevision] = useState(0);
  const [suppressionMessage, setSuppressionMessage] = useState('');
  // Navigation State
  const [activeTab, setActiveTab] = useState<'predictions' | 'consumption' | 'purchase' | 'accounts' | 'admin' | 'delivery' | 'sales-followups' | 'sales-crm' | 'ceo'>('ceo');
  useEffect(() => { document.querySelector('.dashboard-container')?.scrollIntoView?.({ block: 'start' }); }, [activeTab]);
  const [accountAlerts, setAccountAlerts] = useState<any[]>([]);
  const [restrictedPurchaseForecastRows, setRestrictedPurchaseForecastRows] = useState<PurchaseForecastRow[]>([]);
  const [predictionDataRevision, setPredictionDataRevision] = useState(0);
  const canViewReceivables = visibleModules.includes('Accounts Receivable');
  const canViewReorder = visibleModules.includes('Reorder Forecasting');
  const canViewConsumption = visibleModules.includes('Monthly Product Consumption');
  const canViewPurchaseForecast = visibleModules.includes('Purchase Order Forecast');
  const canViewDelivery = visibleModules.includes('Delivery Operations');
  const canViewCustomerHolds = visibleModules.includes('Customer Orders on Hold');
  const canSyncAndPredict = visibleModules.includes('Sync & Predict');
  const canViewSalesCrm = visibleModules.includes('Sales CRM');
  const canViewSalesFollowups = visibleModules.includes('Sales Call Follow-up');
  const canViewAccounts = canViewReceivables || canViewCustomerHolds || canFollowup;
  const headerInventorySync = canSyncAndPredict && activeTab !== 'accounts' && activeTab !== 'admin';
  const headerInvoiceSync = (canManageCredit || isSuperAdmin) && (activeTab === 'accounts' || activeTab === 'ceo');
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const [consumptionSubTab, setConsumptionSubTab] = useState<'customer' | 'overall'>('customer');
  const [purchaseView, setPurchaseView] = useState<'product' | 'vendor'>('product');
  const navGroups = useMemo(() => {
    const go = (tab: typeof activeTab) => () => setActiveTab(tab);
    const groups = [
      { label: 'Management', items: [
        isSuperAdmin && { tab: 'ceo' as const, label: 'CEO Dashboard', icon: TrendingUp, onClick: go('ceo') }
      ].filter(Boolean) },
      { label: 'Sales', items: [
        canViewSalesCrm && { tab: 'sales-crm' as const, label: 'Sales CRM', icon: Users, onClick: go('sales-crm') },
        canViewSalesFollowups && { tab: 'sales-followups' as const, label: 'Recurring Sales Follow-up', icon: Phone, onClick: go('sales-followups') },
        canViewReorder && { tab: 'predictions' as const, label: 'Reorder Forecasting', icon: Calendar, onClick: go('predictions') },
        canViewConsumption && { tab: 'consumption' as const, label: 'Product Consumption', icon: BarChart3, onClick: go('consumption') },
        canViewCustomerHolds && !canViewReceivables && { tab: 'accounts' as const, label: 'Customer Holds', icon: Mail, onClick: go('accounts') }
      ].filter(Boolean) },
      { label: 'Operations', items: [
        canViewDelivery && { tab: 'delivery' as const, label: 'Delivery Operations', icon: PackageCheck, onClick: go('delivery') }
      ].filter(Boolean) },
      { label: 'Finance', items: [
        (canFollowup || canViewReceivables) && { tab: 'accounts' as const, label: 'Finance workspace', icon: Mail, onClick: () => { setAccountsView(canFollowup ? 'promises' : 'alerts'); setActiveTab('accounts'); } }
      ].filter(Boolean) },
      { label: 'Planning', items: [
        canViewPurchaseForecast && { tab: 'purchase' as const, label: 'Purchase Forecast', icon: ShoppingBag, onClick: go('purchase') }
      ].filter(Boolean) },
      { label: 'Admin', items: [
        canUseAdminPanel && { tab: 'admin' as const, label: 'Admin Control', icon: Users, onClick: go('admin') }
      ].filter(Boolean) }
    ];
    return groups.filter(group => group.items.length);
  }, [activeTab, isSuperAdmin, canViewReorder, canViewConsumption, canViewSalesCrm, canViewSalesFollowups, canViewCustomerHolds, canViewReceivables, canFollowup, canViewDelivery, canViewPurchaseForecast, canUseAdminPanel]);
  const [selectedProductForChart, setSelectedProductForChart] = useState<string | null>(null);

  // Reset selected product chart when sub tab or main tab changes
  useEffect(() => {
    setSelectedProductForChart(null);
  }, [consumptionSubTab, activeTab]);

  // Authentication State
  const [token, setToken] = useState<string | null>(LOCAL_PREVIEW ? 'local-preview' : localStorage.getItem('zestora_token'));
  const [userEmail, setUserEmail] = useState<string | null>(LOCAL_PREVIEW ? 'preview@localhost' : localStorage.getItem('zestora_email'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('zestora_role'));
  useEffect(() => {
    setCanManageCredit(false);
    setCanFollowup(false);
    setCanViewOrderHolds(false);
    setCanScheduleDelivery(false);
    setCanReviewDelivery(false);
    setIsSuperAdmin(false);
    setCanUseAdminPanel(false);
    setVisibleModules([]); setAccessReady(false);
    if (!token) return;
    if (LOCAL_PREVIEW) {
      setUserEmail(OWNER_EMAIL);
      setUserRole('ADMIN');
      setVisibleModules([
        'Reorder Forecasting',
        'Monthly Product Consumption',
        'Purchase Order Forecast',
        'Accounts Receivable',
        'Customer Orders on Hold',
        'Follow-up History',
        'Customer Credit Configuration',
        'Sales Call Follow-up',
        'Sales CRM',
        'Delivery Operations',
        'Team Activity',
        'Admin Control Panel',
        'Sales Team Activity',
        'Sync & Predict'
      ]);
      setCanManageCredit(true);
      setCanFollowup(true);
      setCanViewOrderHolds(true);
      setCanScheduleDelivery(true);
      setCanReviewDelivery(true);
      setIsSuperAdmin(true);
      setCanUseAdminPanel(true);
      setAccessReady(true);
      return;
    }
    const abort = new AbortController();
    fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal, cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(user => { if (user) { const modules: string[] = user.visibleModules || []; const permissions: string[] = user.permissions || []; const ownerTools = user.email?.toLowerCase() === OWNER_EMAIL && permissions.includes('ADMIN_USER_MANAGE') && modules.includes('Admin Control Panel'); setVisibleModules(modules); setUserRole(['ADMIN', 'SUPER_ADMIN'].includes(user.globalAccessLevel) ? 'ADMIN' : 'USER'); setIsSuperAdmin(ownerTools); setCanUseAdminPanel(ownerTools); setCanManageCredit(permissions.includes('CUSTOMER_CREDIT_MANAGE') === true); setCanFollowup(permissions.includes('ACCOUNTS_FOLLOWUP') === true); setCanViewOrderHolds(permissions.includes('ACCOUNTS_ORDER_HOLDS_VIEW') === true); setCanScheduleDelivery(permissions.includes('DELIVERY_SCHEDULE_MANAGE') === true); setCanReviewDelivery(permissions.includes('DELIVERY_REPORT_VIEW') === true); } })
      .finally(() => setAccessReady(true))
      .catch(() => {});
    return () => abort.abort();
  }, [token]);

  // User Dropdown State
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  // Navigation Drawer (Hamburger) State
  const [showNavDrawer, setShowNavDrawer] = useState<boolean>(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

    // Data State
  // New prediction features must derive from this API-filtered source.
  // Changes to suppression require cross-tab checks; never filter suppressions separately per tab.
  const [predictions, setPredictions] = useState<ProductPrediction[]>([]);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAccountsSyncing, setIsAccountsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('days-asc');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [toastError, setToastError] = useState<boolean>(false);

  // Month Projection selection state for Consumption Tab
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [consumptionSortBy, setConsumptionSortBy] = useState<string>('volume-desc');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Check for leap year for February
  const getDaysInSelectedMonth = (monthIndex: number) => {
    if (monthIndex === 1) { // February
      const currentYear = new Date().getFullYear();
      if ((currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0)) {
        return 29;
      }
    }
    return daysInMonths[monthIndex];
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('zestora_token');
    localStorage.removeItem('zestora_email');
    localStorage.removeItem('zestora_role');
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
    setActiveTab('ceo');
    setPredictions([]);
    setOrderCount(0);

    // Optionally call logout endpoint silently
    if (token) {
      fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.error('Logout error:', err));
    }
  };

  // Fetch all predictions and order count
  const fetchData = async () => {
    if (!token || !accessReady) return;
    setIsLoading(true);
    setError(null);
    if (!canViewReorder && !canViewConsumption) { setPredictions([]); setOrderCount(0); setPredictionDataRevision(value => value + 1); setIsLoading(false); return; }
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [predsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/predictions`, { headers }),
        canViewReorder ? fetch(`${API_BASE}/orders`, { headers }) : Promise.resolve(null)
      ]);

      if (predsRes.status === 401 || ordersRes?.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!predsRes.ok || (ordersRes && !ordersRes.ok)) {
        throw new Error('Failed to retrieve forecasting data from backend.');
      }

      const predsData: ProductPrediction[] = await predsRes.json();
      const ordersData: number = ordersRes ? await ordersRes.json() : 0;

      setPredictions(predsData);
      setPredictionDataRevision(value => value + 1);
      setOrderCount(ordersData);
      setSuppressionRevision(value => value + 1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection issue. Please verify backend is running on port 8080.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (token && accessReady) void fetchData(); }, [token, userRole, accessReady, visibleModules.join('|')]);

  useEffect(() => {
    if (!accessReady) return;
    setActiveTab(current => {
      const allowed = (tab: string) => tab === 'ceo' ? isSuperAdmin : tab === 'predictions' ? canViewReorder : tab === 'consumption' ? canViewConsumption : tab === 'purchase' ? canViewPurchaseForecast : tab === 'accounts' ? canViewAccounts : tab === 'delivery' ? canViewDelivery : tab === 'sales-crm' ? canViewSalesCrm : tab === 'sales-followups' ? canViewSalesFollowups : tab === 'admin' ? canUseAdminPanel : false;
      if (allowed(current)) return current;
      if (canViewReorder) return 'predictions';
      if (canViewConsumption) return 'consumption';
      if (canViewPurchaseForecast) return 'purchase';
      if (canViewAccounts) return 'accounts';
      if (canViewDelivery) return 'delivery';
      if (canViewSalesCrm) return 'sales-crm';
      if (canViewSalesFollowups) return 'sales-followups';
      return canUseAdminPanel ? 'admin' : 'delivery';
    });
    if (!canFollowup) setAccountsView(current => current === 'promises' ? (canViewReceivables ? 'alerts' : 'holds') : current);
    if (!canViewReceivables && !canFollowup && canViewOrderHolds) setAccountsView('holds');
  }, [accessReady, isSuperAdmin, canViewReorder, canViewConsumption, canViewPurchaseForecast, canViewAccounts, canViewDelivery, canViewSalesCrm, canViewSalesFollowups, canViewReceivables, canViewOrderHolds, canFollowup, canUseAdminPanel]);

  useEffect(() => {
    if (!token || !accessReady || !canViewReceivables) { setAccountAlerts([]); return; }
    const abort = new AbortController();
    const refresh = () => fetch(`${API_BASE}/accounts/alerts`, { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal })
      .then(response => response.ok ? response.json() : [])
      .then(setAccountAlerts).catch(() => {});
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => { abort.abort(); window.clearInterval(timer); };
  }, [token, accountsView, followupRevision, accessReady, canViewReceivables]);

  useEffect(() => {
    // Aggregate-only users must not receive customer-level prediction data.
    if (!token || !accessReady || !canViewPurchaseForecast || canViewReorder || canViewConsumption) { setRestrictedPurchaseForecastRows([]); return; }
    const controller = new AbortController();
    const days = getDaysInSelectedMonth(selectedMonth);
    fetch(`${API_BASE}/purchase-forecast?days=${days}&includeInactive=${includeInactive}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Purchase forecast access denied or unavailable.'); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setRestrictedPurchaseForecastRows(data); }).catch(error => { if (error.name !== 'AbortError') console.error(error); });
    return () => controller.abort();
  }, [token, accessReady, canViewPurchaseForecast, canViewReorder, canViewConsumption, selectedMonth, includeInactive, predictionDataRevision, suppressionRevision]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Invalid email or password');
      }

      const data = await response.json();
      localStorage.setItem('zestora_token', data.token);
      localStorage.setItem('zestora_email', data.email);
      localStorage.setItem('zestora_role', data.role);

      setToken(data.token);
      setUserEmail(data.email);
      setUserRole(data.role);

      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to update password');
      }

      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Trigger Zoho integration sync & update prediction models
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    setToastError(false);
    try {
      const response = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || problem?.message || 'Error triggering sync operations on server.');
      }

      const successMsg = await response.text();
      setSyncStatusMsg(successMsg || 'Synchronization & model updates complete.');

      // Reload forecasting data
      await fetchData();
      setCeoSyncRevision(value => value + 1);
    } catch (err: any) {
      console.error(err);
      setToastError(true);
      setSyncStatusMsg(err.message || 'Synchronization request failed.');
    } finally {
      setIsSyncing(false);
      // Auto dismiss success toast message after 6 seconds
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  const handleAccountsSync = async () => {
    if (!token) return;
    setIsAccountsSyncing(true);
    setSyncStatusMsg(null);
    setToastError(false);
    try {
      if (activeTab === 'ceo') {
        const accounting = await fetch(`${API_BASE}/ceo/sync`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (accounting.status === 401) { handleLogout(); throw new Error('Session expired. Please log in again.'); }
        if (!accounting.ok) throw new Error('Unable to sync Zoho Invoice accounting data.');
        const details = await accounting.json();
        setCeoSyncRevision(value => value + 1);
        const problems = Object.entries(details).filter(([key, value]) => key !== 'message' && typeof value === 'string');
        if (problems.length) throw new Error(problems.map(([key, value]) => `${key}: ${value}`).join(' · '));
        setSyncStatusMsg(Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(' · '));
        return;
      }
      const response = await fetch(`${API_BASE}/accounts/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || problem?.message || 'Unable to sync Accounts Receivable data.');
      }
      const result = await response.json();
      setFollowupRevision(value => value + 1);
      if (isSuperAdmin) {
        const accounting = await fetch(`${API_BASE}/ceo/sync`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (accounting.status === 401) { handleLogout(); throw new Error('Session expired. Please log in again.'); }
        if (!accounting.ok) throw new Error('Receivables refreshed, but the CEO accounting sync failed.');
        const details = await accounting.json();
        const problems = Object.entries(details).filter(([key, value]) => key !== 'message' && typeof value === 'string');
        setCeoSyncRevision(value => value + 1);
        if (problems.length) throw new Error(`Receivables refreshed. Accounting sync: ${problems.map(([key, value]) => `${key}: ${value}`).join(' · ')}`);
      }
      setSyncStatusMsg(`Accounts Receivable synced: ${result.invoices ?? 0} unpaid invoices and ${result.customers ?? 0} customers refreshed.`);
    } catch (err: any) {
      console.error(err);
      setToastError(true);
      setSyncStatusMsg(err.message || 'Accounts Receivable sync failed.');
    } finally {
      setIsAccountsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  // Compute the actual last sync time from predictions
  const lastSyncTimeText = useMemo(() => {
    if (!predictions || predictions.length === 0) return '';
    let maxTime = 0;
    for (const p of predictions) {
      if (p.updatedAt) {
        const t = Date.parse(p.updatedAt);
        if (!isNaN(t) && t > maxTime) {
          maxTime = t;
        }
      }
    }
    if (maxTime === 0) return '';
    
    const date = new Date(maxTime);
    const now = new Date();
    
    // Check if it is today
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    
    // Check if it is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    }
    
    const dateStr = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${dateStr} at ${timeStr}`;
  }, [predictions]);

  // Compute stats metrics
  const stats = useMemo(() => {
    const totalPairs = predictions.length;

    // Pending reorders are predictions where daysUntilPredicted is <= 5
    const pendingReorders = predictions.filter(
      p => p.daysUntilPredicted !== null && p.daysUntilPredicted <= 5
    ).length;

    // Average cycle across active predictions
    const validCycles = predictions.filter(p => p.avgDaysBetweenOrders !== null);
    const avgCycle = validCycles.length > 0
      ? Math.round(validCycles.reduce((sum, p) => sum + (p.avgDaysBetweenOrders || 0), 0) / validCycles.length)
      : 0;

    return {
      totalPairs,
      pendingReorders,
      avgCycle
    };
  }, [predictions]);

  // Handle Search and Filter logic for Forecasting Tab
  const filteredPredictions = useMemo(() => {
    return predictions
      .filter((p) => {
        // Customer Status Filter (Active vs All)
        if (!includeInactive && p.customerStatus !== 'active') {
          return false;
        }

        // Search Filter
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          p.customerName.toLowerCase().includes(term) ||
          p.productName.toLowerCase().includes(term) ||
          p.customerId.toLowerCase().includes(term) ||
          p.productId.toLowerCase().includes(term);

        if (!matchesSearch) return false;

        // Urgency Filter
        if (urgencyFilter === 'ALL') return true;

        const days = p.daysUntilPredicted;
        if (urgencyFilter === 'OVERDUE') return days !== null && days < 0;
        if (urgencyFilter === 'URGENT') return days !== null && days >= 0 && days <= 5;
        if (urgencyFilter === 'SOON') return days !== null && days >= 6 && days <= 15;
        if (urgencyFilter === 'SAFE') return days !== null && days > 15;
        if (urgencyFilter === 'NONE') return days === null;

        return true;
      })
      .sort((a, b) => {
        // Sorting Logic
        if (sortBy === 'days-asc') {
          if (a.daysUntilPredicted === null) return 1;
          if (b.daysUntilPredicted === null) return -1;
          return a.daysUntilPredicted - b.daysUntilPredicted;
        }
        if (sortBy === 'days-desc') {
          if (a.daysUntilPredicted === null) return 1;
          if (b.daysUntilPredicted === null) return -1;
          return b.daysUntilPredicted - a.daysUntilPredicted;
        }
        if (sortBy === 'confidence-desc') {
          const confA = a.cycleConfidence || 0;
          const confB = b.cycleConfidence || 0;
          return confB - confA;
        }
        if (sortBy === 'qty-desc') {
          const qtyA = a.avgQty || 0;
          const qtyB = b.avgQty || 0;
          return qtyB - qtyA;
        }
        return 0;
      });
  }, [predictions, searchTerm, urgencyFilter, sortBy, includeInactive]);

  // Get predictions for today and next 2 days for the mobile alert card
  const upcomingPredictions = useMemo(() => {
    return predictions
      .filter((p) => {
        // Respect the inactive status filter toggle just like the rest of the dashboard
        if (!includeInactive && p.customerStatus !== 'active') {
          return false;
        }
        return p.daysUntilPredicted !== null && p.daysUntilPredicted >= 0 && p.daysUntilPredicted <= 2;
      })
      .sort((a, b) => {
        if (a.daysUntilPredicted === null) return 1;
        if (b.daysUntilPredicted === null) return -1;
        return a.daysUntilPredicted - b.daysUntilPredicted;
      });
  }, [predictions, includeInactive]);

  // Compute customer share distribution for a selected product doughnut chart
  const selectedProductCustomerShare = useMemo(() => {
    if (!selectedProductForChart) return null;

    const matchingPredictions = predictions.filter((p) => {
      if (!includeInactive && p.customerStatus !== 'active') return false;
      return p.productId === selectedProductForChart;
    });

    if (matchingPredictions.length === 0) return null;

    const daysInMonth = getDaysInSelectedMonth(selectedMonth);

    const customersShare = matchingPredictions
      .map((p) => {
        const avgQty = p.avgQty || 0;
        const cycle = p.avgDaysBetweenOrders || 0;
        const consumptionRate = cycle > 0 ? avgQty / cycle : 0;
        const projectedVolume = parseFloat((consumptionRate * daysInMonth).toFixed(1));
        return {
          customerId: p.customerId,
          customerName: p.customerName,
          projectedVolume
        };
      })
      .filter((c) => c.projectedVolume > 0)
      .sort((a, b) => b.projectedVolume - a.projectedVolume);

    const totalVolumeForProduct = parseFloat(
      customersShare.reduce((sum, c) => sum + c.projectedVolume, 0).toFixed(1)
    );

    return {
      productId: selectedProductForChart,
      productName: matchingPredictions[0]?.productName || 'Selected Product',
      customersShare,
      totalVolumeForProduct
    };
  }, [predictions, selectedProductForChart, selectedMonth, includeInactive]);

  // Compute monthly customer consumption data grouped by customer
  const groupedCustomerData = useMemo(() => {
    const daysInMonth = getDaysInSelectedMonth(selectedMonth);

    // First map predictions to have projectedVolume and consumptionRate, filtering by status
    const mapped = predictions
      .filter((p) => {
        // Customer Status Filter (Active vs All)
        if (!includeInactive && p.customerStatus !== 'active') {
          return false;
        }
        return true;
      })
      .map((p) => {
        const avgQty = p.avgQty || 0;
        const cycle = p.avgDaysBetweenOrders || 0;
        const consumptionRate = cycle > 0 ? avgQty / cycle : 0;
        const projectedVolume = parseFloat((consumptionRate * daysInMonth).toFixed(1));
        return {
          ...p,
          projectedVolume,
          consumptionRate: parseFloat(consumptionRate.toFixed(2))
        };
      });

    // Group by customerId
    const groups: { [customerId: string]: CustomerConsumption } = {};

    mapped.forEach((item) => {
      const cId = item.customerId;
      if (!groups[cId]) {
        groups[cId] = {
          customerId: cId,
          customerName: item.customerName,
          customerStatus: item.customerStatus,
          totalMonthlyVolume: 0,
          products: []
        };
      }

      groups[cId].products.push({
        productId: item.productId,
        productName: item.productName,
        avgDaysBetweenOrders: item.avgDaysBetweenOrders,
        avgQty: item.avgQty,
        projectedVolume: item.projectedVolume,
        qtyTrend: item.qtyTrend,
        cycleConfidence: item.cycleConfidence,
        predictedQty: item.predictedQty,
        costPrice: item.costPrice,
        color: '' // Will assign colors after sorting
      });
    });

    const result: CustomerConsumption[] = [];
    const term = searchTerm.toLowerCase();

    Object.values(groups).forEach((cust) => {
      // Sort products by projected volume descending so main products show first
      cust.products.sort((a, b) => b.projectedVolume - a.projectedVolume);

      // Assign distinct colors to each product
      cust.products = cust.products.map((p, idx) => ({
        ...p,
        color: chartColors[idx % chartColors.length]
      }));

      // Filter products based on search query matching customer name, customer ID, product name, or product ID
      const nameMatches =
        cust.customerName.toLowerCase().includes(term) ||
        cust.customerId.toLowerCase().includes(term);

      const filteredProducts = cust.products.filter(p =>
        nameMatches ||
        p.productName.toLowerCase().includes(term) ||
        p.productId.toLowerCase().includes(term)
      );

      if (filteredProducts.length > 0) {
        const totalVol = filteredProducts.reduce((sum, p) => sum + p.projectedVolume, 0);
        result.push({
          ...cust,
          totalMonthlyVolume: parseFloat(totalVol.toFixed(1)),
          products: filteredProducts
        });
      }
    });

    // Sort customer cards based on selection
    return result.sort((a, b) => {
      if (consumptionSortBy === 'volume-desc') {
        return b.totalMonthlyVolume - a.totalMonthlyVolume;
      }
      if (consumptionSortBy === 'volume-asc') {
        return a.totalMonthlyVolume - b.totalMonthlyVolume;
      }
      if (consumptionSortBy === 'name-asc') {
        return a.customerName.localeCompare(b.customerName);
      }
      if (consumptionSortBy === 'name-desc') {
        return b.customerName.localeCompare(a.customerName);
      }
      if (consumptionSortBy === 'products-desc') {
        return b.products.length - a.products.length;
      }
      return 0;
    });
  }, [predictions, searchTerm, selectedMonth, consumptionSortBy, includeInactive]);

  // Use shared predictions where permitted; other departments receive only server aggregates.
  const purchaseForecastRows = useMemo(() => canViewReorder || canViewConsumption
    ? buildPurchaseForecastRows(predictions, getDaysInSelectedMonth(selectedMonth), includeInactive)
    : restrictedPurchaseForecastRows,
  [predictions, selectedMonth, includeInactive, canViewReorder, canViewConsumption, restrictedPurchaseForecastRows]);

  const purchaseForecastData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const productsList = purchaseForecastRows.filter(p => `${p.productName} ${p.productId} ${p.preferredVendor} ${p.manufacturer}`.toLowerCase().includes(term));
    const vendorGroups: Record<string, { vendorName: string; totalCost: number; totalItemsCount: number; items: { productId:string;productName:string;qty:number;costPrice:number;estimatedCost:number }[] }> = {};
    productsList.forEach(p => {
      const vendorName = p.preferredVendor || p.manufacturer || 'Unknown Vendor';
      const vendor = vendorGroups[vendorName] ||= { vendorName, totalCost:0, totalItemsCount:0, items:[] };
      vendor.items.push({ productId:p.productId, productName:p.productName, qty:p.totalQty, costPrice:p.costPrice, estimatedCost:p.totalCost });
      vendor.totalCost += p.totalCost; vendor.totalItemsCount += p.totalQty;
    });
    const vendorsList = Object.values(vendorGroups).sort((a,b)=>b.totalCost-a.totalCost);
    return { productsList, vendorsList, totalMonthlyPOCost: productsList.reduce((sum,p)=>sum+p.totalCost,0) };
  }, [purchaseForecastRows, searchTerm]);
  // Compute overall product consumption aggregated across all customers
  const overallProductConsumption = useMemo(() => {
    const daysInMonth = getDaysInSelectedMonth(selectedMonth);

    const mapped = predictions
      .filter((p) => {
        if (!includeInactive && p.customerStatus !== 'active') {
          return false;
        }
        return true;
      })
      .map((p) => {
        const avgQty = p.avgQty || 0;
        const cycle = p.avgDaysBetweenOrders || 0;
        const consumptionRate = cycle > 0 ? avgQty / cycle : 0;
        const projectedVolume = parseFloat((consumptionRate * daysInMonth).toFixed(1));
        return {
          ...p,
          projectedVolume
        };
      });

    const productGroups: {
      [productId: string]: {
        productId: string;
        productName: string;
        totalVolume: number;
        customersCount: number;
        customersList: string[];
        avgDaysBetweenOrders: number;
        avgQty: number;
      }
    } = {};

    mapped.forEach((item) => {
      const pId = item.productId;
      if (!productGroups[pId]) {
        productGroups[pId] = {
          productId: pId,
          productName: item.productName || 'Unknown Product',
          totalVolume: 0,
          customersCount: 0,
          customersList: [],
          avgDaysBetweenOrders: 0,
          avgQty: 0
        };
      }
      productGroups[pId].totalVolume += item.projectedVolume;
      productGroups[pId].customersCount += 1;
      if (!productGroups[pId].customersList.includes(item.customerName || '')) {
        productGroups[pId].customersList.push(item.customerName || 'Unknown Customer');
      }
      productGroups[pId].avgDaysBetweenOrders += item.avgDaysBetweenOrders || 0;
      productGroups[pId].avgQty += item.avgQty || 0;
    });

    const result = Object.values(productGroups).map((p) => {
      return {
        ...p,
        totalVolume: parseFloat(p.totalVolume.toFixed(1)),
        avgDaysBetweenOrders: p.customersCount > 0 ? Math.round(p.avgDaysBetweenOrders / p.customersCount) : 0,
        avgQty: p.customersCount > 0 ? parseFloat((p.avgQty / p.customersCount).toFixed(1)) : 0
      };
    });

    const term = searchTerm.toLowerCase();
    const filteredResult = result.filter((p) =>
      p.productName.toLowerCase().includes(term) || p.productId.toLowerCase().includes(term)
    );

    return filteredResult.sort((a, b) => b.totalVolume - a.totalVolume);
  }, [predictions, selectedMonth, searchTerm, includeInactive]);

  // Urgency Style Helper
  const getUrgencyConfig = (days: number | null) => {
    if (days === null) {
      return { label: 'No Data', className: 'badge-soon', style: {} };
    }
    if (days < 0) {
      return {
        label: `Overdue (${Math.abs(days)}d ago)`,
        className: 'badge-overdue'
      };
    }
    if (days <= 5) {
      return {
        label: `Urgent (${days}d remaining)`,
        className: 'badge-urgent'
      };
    }
    if (days <= 15) {
      return {
        label: `Soon (${days}d remaining)`,
        className: 'badge-soon'
      };
    }
    return {
      label: `Safe (${days}d remaining)`,
      className: 'badge-safe'
    };
  };

  const resultCount = activeTab === 'predictions' ? filteredPredictions.length : activeTab === 'consumption' ? (consumptionSubTab === 'customer' ? groupedCustomerData.length : overallProductConsumption.length) : (purchaseView === 'product' ? purchaseForecastData.productsList.length : purchaseForecastData.vendorsList.length);
  const paging = useResultPage([activeTab, consumptionSubTab, purchaseView, searchTerm, selectedMonth, sortBy, consumptionSortBy, urgencyFilter, includeInactive, resultCount].join('|'), resultCount);

  if (!token) {
    return (
      <div className="login-screen-wrapper">
        <div className="login-card glass-panel">
          <div className="login-header">
            <div className="logo-container">
              <ZestoraLogo />
            </div>
            <h2 className="login-title">Zestora Hospitality</h2>
            <p className="login-subtitle">Reorder Predictor Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {loginError && (
              <div className="login-error-alert animate-shake">
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="password-toggle-btn"
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoggingIn} className="btn-login-submit">
              {isLoggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container zestora-app">
      {/* Brand Header */}
      <header className="dashboard-header">
        <div className="brand-wrapper">
          <button
            onClick={() => setShowNavDrawer(true)}
            className="hamburger-btn"
            title="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
          <div className="logo-icon">
            <ZestoraLogo />
          </div>
          <div className="brand-title-group">
            <span className="brand-name">Zestora</span>
            <span className="brand-subtitle">OrderSense workspace</span>
          </div>
        </div>

        <div className="header-actions">
          {lastSyncTimeText && headerInventorySync && (
            <div className="last-sync-tag">
              <Clock size={14} />
              <span className="last-sync-text">Last Sync: {lastSyncTimeText}</span>
            </div>
          )}

          <HeaderSyncControl key={activeTab} inventory={headerInventorySync} invoice={headerInvoiceSync} busy={isSyncing || isAccountsSyncing} onInventory={() => void handleSync()} onInvoice={() => void handleAccountsSync()} />

          <div className="profile-container">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="profile-avatar-btn"
              title={`Logged in as ${userEmail}`}
            >
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </button>

            {showUserDropdown && (
              <>
                <div className="dropdown-backdrop" onClick={() => setShowUserDropdown(false)} />
                <div className="profile-dropdown-menu glass-panel animate-slideIn">
                  <div className="profile-dropdown-header">
                    <span className="profile-dropdown-email" title={userEmail || ''}>{userEmail}</span>
                    <span className={`profile-dropdown-role ${userRole?.toLowerCase()}`}>{userRole}</span>
                  </div>
                  <div className="dropdown-divider"></div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setShowPasswordModal(true);
                    }}
                    className="dropdown-item"
                  >
                    <Key size={14} />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      handleLogout();
                    }}
                    className="dropdown-item logout"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer for Mobile */}
      {showNavDrawer && (
        <>
          <NavigationDrawer onClose={() => setShowNavDrawer(false)}>
            <div className="drawer-header">
              <div className="brand-wrapper">
                <div className="logo-icon">
                  <ZestoraLogo />
                </div>
                <div className="brand-title-group">
                  <span className="brand-name">Zestora</span>
                  <span className="brand-subtitle">Hospitality</span>
                </div>
              </div>
              <button
                onClick={() => setShowNavDrawer(false)}
                className="drawer-close-btn"
                title="Close Menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-divider"></div>

            <nav className="drawer-nav">
              {navGroups.map(group => <section className="drawer-nav-group" key={group.label}><span className="drawer-nav-group-label">{group.label}</span>{group.items.map((item: any) => { const Icon = item.icon; return <button key={`${group.label}-${item.tab}-${item.label}`} onClick={() => { item.onClick(); setShowNavDrawer(false); }} className={`drawer-nav-item ${activeTab === item.tab ? 'active' : ''}`}><Icon size={18} /><span>{item.label}</span></button>; })}</section>)}
            </nav>
          </NavigationDrawer>
        </>
      )}

      {/* Sync Status Alert */}
      {syncStatusMsg && (
        <div className={`toast-msg ${toastError ? 'error' : ''}`}>
          {toastError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{syncStatusMsg}</span>
        </div>
      )}

      <nav className="workspace-nav" aria-label="Workspace navigation">
        <div className="workspace-nav-title">WORKSPACE</div>
        {navGroups.map(group => <section className="workspace-nav-group" key={group.label}>
          <h2>{group.label}</h2>
          {group.items.map(item => {
            if (!item) return null;
            const Icon = item.icon;
            return <button key={item.tab} onClick={item.onClick} aria-current={activeTab === item.tab ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
            </button>;
          })}
        </section>)}
        <div className="workspace-nav-footer"><ZestoraLogo /><span>Clarity in every order.<small>Hospitality solutions</small></span></div>
      </nav>
      {['predictions', 'consumption', 'purchase'].includes(activeTab) && <header className="workspace-heading">
        <div><span className="workspace-eyebrow">ORDERSENSE / {activeTab === 'purchase' ? 'PLANNING' : 'INTELLIGENCE'}</span>
          <h1>{activeTab === 'predictions' ? 'Reorder forecasting' : activeTab === 'consumption' ? 'Product consumption' : 'Purchase planning'}</h1>
          <p>{activeTab === 'predictions' ? 'Know what is due. Make the next order count.' : activeTab === 'consumption' ? 'Understand demand, from each customer to every product.' : 'Turn expected demand into a clear purchasing plan.'}</p>
        </div><span className="workspace-period"><Calendar size={16} />{monthNames[selectedMonth]}</span>
      </header>}

      {suppressionMessage && <div className="suppression-notice" role="status">{suppressionMessage}<button aria-label="Dismiss notice" onClick={() => setSuppressionMessage('')}><X size={16} /></button></div>}
      {activeTab === 'predictions' && <DiscontinuedItems api={API_BASE} token={token} onExpired={handleLogout} revision={suppressionRevision}
        onReactivate={pair => setSuppressionDialog({ pair, action: 'reactivate' })} />}
      {suppressionDialog && <SuppressionDialog api={API_BASE} token={token} onExpired={handleLogout} {...suppressionDialog}
        onClose={() => setSuppressionDialog(null)} onSaved={(pair, action) => {
          if (action === 'suppress') setPredictions(current => current.filter(p => p.customerId !== pair.customerId || p.productId !== pair.productId));
          setSuppressionRevision(value => value + 1);
          setSuppressionMessage(action === 'suppress' ? 'Prediction discontinued. You can reactivate it from Discontinued Items.' : 'Prediction reactivated. Its forecast will return after the next Sync & Predict run.');
          void fetchData();
        }} />}
        {activeTab === 'ceo' && isSuperAdmin ? <CeoDashboard api={API_BASE} token={token} onExpired={handleLogout} syncRevision={ceoSyncRevision} /> : activeTab === 'delivery' ? <DeliveryOperationsPage api={API_BASE} token={token} onExpired={handleLogout} canSchedule={canScheduleDelivery} canReview={canReviewDelivery} isSuperAdmin={isSuperAdmin} preview={LOCAL_PREVIEW} /> : activeTab === 'sales-crm' ? <SalesCrm api={API_BASE} token={token} onExpired={handleLogout} /> : activeTab === 'sales-followups' ? <SalesFollowupDashboard api={API_BASE} token={token} isSuperAdmin={isSuperAdmin} onExpired={handleLogout} /> : activeTab === 'accounts' ? (
        <>
          {(canViewOrderHolds || canFollowup || canManageCredit || isSuperAdmin) && <div className="suppression-subtabs">
            {canFollowup && <button className={`tab-btn ${accountsView === 'promises' ? 'active' : ''}`} onClick={() => setAccountsView('promises')}>Payment Promises</button>}
            {canViewReceivables && <button className={`tab-btn ${accountsView === 'alerts' ? 'active' : ''}`} onClick={() => setAccountsView('alerts')}>Accounts Receivable</button>}
            {canViewOrderHolds && <button className={`tab-btn ${accountsView === 'holds' ? 'active' : ''}`} onClick={() => setAccountsView('holds')}>Order Holds</button>}
            {canFollowup && <button className={`tab-btn ${accountsView === 'followups' ? 'active' : ''}`} onClick={() => setAccountsView('followups')}>Followup History</button>}
            {isSuperAdmin && <button className={`tab-btn ${accountsView === 'activity' ? 'active' : ''}`} onClick={() => setAccountsView('activity')}>Team Activity</button>}
            {canManageCredit && <button className={`tab-btn ${accountsView === 'credit' ? 'active' : ''}`} onClick={() => setAccountsView('credit')}>Customer Credit Configuration</button>}
          </div>}
          {isSuperAdmin && accountsView === 'activity' ? <FinanceActivityDashboard api={API_BASE} token={token} />
            : canManageCredit && accountsView === 'credit' ? <CustomerCreditPage api={API_BASE} token={token} onExpired={handleLogout} preview={LOCAL_PREVIEW} />
            : canViewOrderHolds && accountsView === 'holds' ? <OrderHoldsPage api={API_BASE} token={token} onExpired={handleLogout} />
            : canFollowup && accountsView === 'promises' ? <FollowupPanel api={API_BASE} token={token} target={null} onClose={() => {}} onSaved={() => setFollowupRevision(v => v + 1)} onExpired={handleLogout} promisesOnly onFindInvoices={() => setAccountsView('alerts')} />
            : canFollowup && accountsView === 'followups' ? <FollowupPanel api={API_BASE} token={token} target={null} onClose={() => {}} onSaved={() => setFollowupRevision(v => v + 1)} onExpired={handleLogout} />
            : canViewReceivables ? <AccountsDashboard alerts={accountAlerts} api={API_BASE} token={token} canFollowup={canFollowup} onSaved={() => setFollowupRevision(v => v + 1)} onExpired={handleLogout} />
            : canViewOrderHolds ? <OrderHoldsPage api={API_BASE} token={token} onExpired={handleLogout} /> : null}
        </>
      ) : activeTab === 'admin' ? (
        /* Tab 3: Admin Users Management Control Panel */
        <div className="admin-container">
          <div className="suppression-subtabs">
            <button className={`tab-btn ${adminView === 'users' ? 'active' : ''}`} onClick={() => setAdminView('users')}>User Management</button>
            <button className={`tab-btn ${adminView === 'audit' ? 'active' : ''}`} onClick={() => setAdminView('audit')}>Suppression Audit Log</button>
          </div>
          {adminView === 'audit' ? <SuppressionAudit api={API_BASE} token={token} onExpired={handleLogout} revision={suppressionRevision} /> : <AdminUserManagement api={API_BASE} token={token} onExpired={handleLogout} />}
        </div>
      ) : (
        /* Standard View: Forecasting & Consumption Tabs */
        <>
          {/* Mobile predictions alert card on top */}
          {activeTab === 'predictions' && (
            <details className="mobile-predictions-alert-card animate-slideIn">
              <summary className="alert-card-header">
                <div className="alert-card-title-group">
                  <div className="alert-ping-container">
                    <AlertTriangle size={16} />
                    <span className="alert-ping-dot"></span>
                  </div>
                  <h4>Next 3 days · {upcomingPredictions.length} reorders</h4>
                </div>
                {upcomingPredictions.length > 0 && (
                  <span className="alert-count-badge">
                    {upcomingPredictions.length} {upcomingPredictions.length === 1 ? 'Alert' : 'Alerts'}
                  </span>
                )}
              </summary>
              <div className="alert-card-body">
                {upcomingPredictions.length === 0 ? (
                  <div className="alert-empty-state">
                    <CheckCircle size={16} style={{ color: 'var(--color-safe)' }} />
                    <span>All caught up! No reorders predicted for the next 3 days.</span>
                  </div>
                ) : (
                  <div className="alert-items-list scrollbar-custom">
                    {upcomingPredictions.map((p) => {
                      const days = p.daysUntilPredicted;
                      let relativeDay = '';
                      let dayClass = '';
                      if (days === 0) {
                        relativeDay = 'Today';
                        dayClass = 'due-today';
                      } else if (days === 1) {
                        relativeDay = 'Tomorrow';
                        dayClass = 'due-tomorrow';
                      } else {
                        relativeDay = 'In 2 days';
                        dayClass = 'due-soon';
                      }
                      
                      return (
                        <div key={p.id} className={`alert-item-row ${dayClass}`}>
                          <div className="alert-item-left">
                            <span className="alert-item-product" title={p.productName}>{p.productName}</span>
                            <span className="alert-item-customer" title={p.customerName}>
                              {p.customerName} <span className="alert-item-cust-id">(ID: {p.customerId})</span>
                            </span>
                          </div>
                          <div className="alert-item-right">
                            <span className="alert-item-qty">{p.avgQty ? `${Math.round(p.avgQty)} u` : 'N/A'}</span>
                            <span className={`alert-day-badge ${dayClass}`}>{relativeDay}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Stats Cards Row (Only shown for Forecasting Tab) */}
          {activeTab === 'predictions' && (
            <section className="stats-grid">
              <div className="metric-card">
                <div className="metric-icon-wrapper">
                  <Layers size={20} />
                </div>
                <div className="metric-info">
                  <span className="metric-value">{stats.totalPairs}</span>
                  <span className="metric-label">Product Forecasts</span>
                </div>
              </div>

              <div className={`metric-card ${stats.pendingReorders > 0 ? 'urgent-indicator' : ''}`}>
                <div className="metric-icon-wrapper">
                  <AlertTriangle size={20} />
                </div>
                <div className="metric-info">
                  <span className="metric-value">{stats.pendingReorders}</span>
                  <span className="metric-label">Pending Reorders</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper">
                  <Database size={20} />
                </div>
                <div className="metric-info">
                  <span className="metric-value">{orderCount}</span>
                  <span className="metric-label">Synced Order Lines</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper">
                  <Clock size={20} />
                </div>
                <div className="metric-info">
                  <span className="metric-value">{stats.avgCycle}d</span>
                  <span className="metric-label">Avg. Order Interval</span>
                </div>
              </div>
            </section>
          )}



          {/* Main Content Area */}
          {isLoading ? (
            <div className="results-container">
              <div className="loader-wrapper">
                <div className="loader-spinner animate-spin"></div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching latest reports from server...</span>
              </div>
            </div>
          ) : error ? (
            <div className="results-container">
              <div className="empty-state">
                <AlertTriangle size={48} style={{ color: 'var(--color-overdue)' }} />
                <h3 className="empty-state-title">Connection Error</h3>
                <p className="empty-state-desc">{error}</p>
                <button onClick={fetchData} className="btn-primary" style={{ marginTop: '8px' }}>
                  <RefreshCw size={14} />
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* === TAB-SPECIFIC CONTROLS (outside results-container so overflow:hidden doesn't clip) === */}

              {activeTab === 'predictions' && (
                <div className="controls-container">
                  <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      aria-label="Search forecasts" placeholder="Search customer, product or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <details className="forecast-filters"><summary>Filters & sort <span>{monthNames[selectedMonth]} · {includeInactive ? 'All customers' : 'Active only'}</span></summary><div className="controls-filter-row">
                    <label className="filter-label">
                      <span className="switch">
                        <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
                        <span className="slider round"></span>
                      </span>
                      <span>Include Inactive</span>
                    </label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="select-custom" aria-label="Forecast month">
                      {monthNames.map((m, i) => (<option key={i} value={i}>📅 {m}</option>))}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-custom" aria-label="Sort by">
                      <option value="days-asc">⏱ Soonest First</option>
                      <option value="days-desc">⏱ Latest First</option>
                      <option value="confidence-desc">✓ Confidence High→Low</option>
                      <option value="qty-desc">📦 Avg Qty High→Low</option>
                    </select>
                  </div></details>
                  <div className="chips-row">
                    {['ALL', 'OVERDUE', 'URGENT', 'SOON', 'SAFE', 'NONE'].map(f => (
                      <button key={f} className={`chip-btn ${urgencyFilter === f ? 'active' : ''}`} onClick={() => setUrgencyFilter(f)}>
                        {f === 'ALL' ? 'All' : f === 'NONE' ? 'No Data' : f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'consumption' && (
                <>
                  <div className="sub-tab-nav animate-slideIn">
                    <button onClick={() => setConsumptionSubTab('customer')} className={`sub-tab-btn ${consumptionSubTab === 'customer' ? 'active' : ''}`}>
                      <Users size={14} /><span>By Customer</span>
                    </button>
                    <button onClick={() => setConsumptionSubTab('overall')} className={`sub-tab-btn ${consumptionSubTab === 'overall' ? 'active' : ''}`}>
                      <Layers size={14} /><span>Product Aggregation (Overall)</span>
                    </button>
                  </div>
                  <div className="controls-container">
                    <div className="search-box">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        aria-label="Search consumption" placeholder="Search by customer or product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <details className="forecast-filters"><summary>Filters & sort <span>{monthNames[selectedMonth]} · {includeInactive ? 'All customers' : 'Active only'}</span></summary><div className="controls-filter-row">
                      <label className="filter-label">
                        <span className="switch">
                          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
                          <span className="slider round"></span>
                        </span>
                        <span>Include Inactive</span>
                      </label>
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="select-custom" aria-label="Forecast month">
                        {monthNames.map((m, i) => (<option key={i} value={i}>📅 {m}</option>))}
                      </select>
                      {consumptionSubTab === 'customer' && (
                        <select value={consumptionSortBy} onChange={(e) => setConsumptionSortBy(e.target.value)} className="select-custom" aria-label="Sort customers">
                          <option value="volume-desc">📊 Volume: High→Low</option>
                          <option value="volume-asc">📊 Volume: Low→High</option>
                          <option value="name-asc">🔤 Name: A→Z</option>
                          <option value="name-desc">🔤 Name: Z→A</option>
                          <option value="products-desc">📦 Most Products</option>
                        </select>
                      )}
                    </div></details>
                  </div>
                </>
              )}

              {activeTab === 'purchase' && (
                <>
                  <div className="sub-tab-nav animate-slideIn">
                    <button onClick={() => setPurchaseView('product')} className={`sub-tab-btn ${purchaseView === 'product' ? 'active' : ''}`}>
                      <Layers size={14} /><span>PO Estimate by Product</span>
                    </button>
                    <button onClick={() => setPurchaseView('vendor')} className={`sub-tab-btn ${purchaseView === 'vendor' ? 'active' : ''}`}>
                      <Users size={14} /><span>PO Estimate by Vendor</span>
                    </button>
                  </div>
                  <div className="controls-container">
                    <div className="search-box">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        aria-label="Search purchase plan" placeholder="Search product, vendor or manufacturer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <details className="forecast-filters"><summary>Filters & sort <span>{monthNames[selectedMonth]} · {includeInactive ? 'All customers' : 'Active only'}</span></summary><div className="controls-filter-row">
                      <label className="filter-label">
                        <span className="switch">
                          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
                          <span className="slider round"></span>
                        </span>
                        <span>Include Inactive</span>
                      </label>
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="select-custom" aria-label="Forecast month">
                        {monthNames.map((m, i) => (<option key={i} value={i}>📅 {m}</option>))}
                      </select>
                    </div></details>
                  </div>
                </>
              )}

              {/* === DATA RESULTS CONTAINER === */}
              <div className="results-summary" role="status">{resultCount} matching {activeTab === "predictions" ? "forecasts" : activeTab === "consumption" && consumptionSubTab === "customer" ? "customers" : purchaseView === "vendor" && activeTab === "purchase" ? "vendors" : "products"}</div>
              <div className="results-container">
                {activeTab === 'predictions' ? (
                  /* Tab 1: Forecasting View */
                  filteredPredictions.length === 0 ? (
                    <div className="empty-state">
                      <ShoppingBag size={48} style={{ color: 'var(--text-muted)' }} />
                      <h3 className="empty-state-title">No Forecasts Found</h3>
                      <p className="empty-state-desc">Try resetting your search query or choosing a different status filter.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <ResponsiveTable className="data-table" summaryColumns={[0, 1, 2, 4]}>
                        <thead>
                          <tr>
                            <th>Customer Details</th>
                            <th>Product Details</th>
                            <th>Urgency Status</th>
                            <th className="hide-mobile">Order Cycle / Size</th>
                            <th>Predicted Date</th>
                            <th className="hide-mobile">Confidence</th>
                            <th className="hide-mobile">Notifications</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPredictions.slice(paging.start, paging.end).map((p) => {
                            const urgency = getUrgencyConfig(p.daysUntilPredicted);
                            return (
                              <tr key={p.id}>
                                <td>
                                  <div className="entity-cell">
                                    <span className="entity-name">
                                      <span className={`status-dot ${p.customerStatus === 'active' ? 'active' : 'inactive'}`} style={{ marginRight: '6px' }}></span>
                                      {p.customerName}
                                    </span>
                                    <span className="entity-id">ID: {p.customerId}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="entity-cell">
                                    <span className="entity-name">{p.productName}</span>
                                    <span className="entity-id">ID: {p.productId}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${urgency.className}`}>
                                    {urgency.label}
                                  </span>
                                </td>
                                <td className="hide-mobile">
                                  <div className="entity-cell">
                                    <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>
                                      {p.avgDaysBetweenOrders ? `Every ${p.avgDaysBetweenOrders} days` : 'N/A'}
                                    </span>
                                    <span style={{ fontSize: '12px' }}>
                                      Avg Qty: {p.avgQty ? p.avgQty.toLocaleString() : 'N/A'} units
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className="entity-cell">
                                    <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>
                                      {p.predictedOrderDate ? new Date(p.predictedOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Forecast'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      Last Order: {p.lastOrderDate ? new Date(p.lastOrderDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                </td>
                                <td className="hide-mobile">
                                  <div className="confidence-container">
                                    <div className="progress-track">
                                      <div
                                        className="progress-fill"
                                        style={{ width: `${Math.round((p.cycleConfidence || 0) * 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="confidence-val">
                                      {p.cycleConfidence !== null ? `${Math.round(p.cycleConfidence * 100)}%` : '0%'}
                                    </span>
                                  </div>
                                </td>
                                <td className="hide-mobile">
                                  {p.alertSent ? (
                                    <span className="alert-sent-tag" title={p.alertSentAt ? `Sent on ${new Date(p.alertSentAt).toLocaleString()}` : ''}>
                                      <Mail size={12} />
                                      <span>Alert Sent</span>
                                    </span>
                                  ) : (
                                    <span className="alert-pending-tag">
                                      <Clock size={12} />
                                      <span>Standard</span>
                                    </span>
                                  )}
                                </td>
                                <td><button className="suppression-action discontinue" aria-label={`Discontinue ${p.productName} for ${p.customerName}`}
                                  onClick={() => setSuppressionDialog({ pair: p, action: 'suppress' })}><Ban size={14} /> Discontinue</button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </ResponsiveTable>
                    </div>
                  )
                ) : activeTab === 'consumption' ? (
                  /* Tab 2: Monthly Consumption View */
                  <>
                    {consumptionSubTab === 'customer' ? (
                      groupedCustomerData.length === 0 ? (
                        <div className="empty-state">
                          <BarChart3 size={48} style={{ color: 'var(--text-muted)' }} />
                          <h3 className="empty-state-title">No Customer Profiles Found</h3>
                          <p className="empty-state-desc">Try resetting your search query or choosing a different sorting option.</p>
                        </div>
                      ) : (
                        <div className="customer-cards-grid animate-slideIn">
                          {groupedCustomerData.slice(paging.start, paging.end).map((customer) => (
                            <CustomerCard
                              key={customer.customerId}
                              customer={customer}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      overallProductConsumption.length === 0 ? (
                        <div className="empty-state animate-slideIn">
                          <Layers size={48} style={{ color: 'var(--text-muted)' }} />
                          <h3 className="empty-state-title">No Product Aggregations Found</h3>
                          <p className="empty-state-desc">Try modifying your search term.</p>
                        </div>
                      ) : (
                        <div className="overall-consumption-layout animate-slideIn">
                          <div className="table-responsive" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                            <ResponsiveTable className="data-table" summaryColumns={[0, 1, 3]}>
                              <thead>
                                <tr>
                                  <th>Product Details</th>
                                  <th>Projected Volume</th>
                                  <th className="hide-mobile">Avg Interval</th>
                                  <th className="hide-mobile">Customers Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {overallProductConsumption.slice(paging.start, paging.end).map((prod) => (
                                  <tr key={prod.productId}>
                                    <td>
                                      <div className="entity-cell">
                                        <span className="entity-name">{prod.productName}</span>
                                        <span className="entity-id">ID: {prod.productId}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                                        {prod.totalVolume.toLocaleString()} units
                                      </span>
                                    </td>
                                    <td className="hide-mobile">
                                      <span style={{ fontWeight: 600 }}>
                                        Every {prod.avgDaysBetweenOrders} days
                                      </span>
                                    </td>
                                    <td className="hide-mobile">
                                      <span
                                        className="badge badge-safe customer-count-clickable" role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedProductForChart(prod.productId); } }}
                                        title={`Click to view customer distribution for ${prod.productName}`}
                                        onClick={() => {
                                          setSelectedProductForChart(prod.productId);
                                        }}
                                      >
                                        {prod.customersCount} Customers
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </ResponsiveTable>
                          </div>

                          <div className="chart-panel">
                            <h4 className="chart-panel-title">
                              <BarChart3 size={16} style={{ color: 'var(--brand-primary)' }} />
                              <span>Top Consumed Products</span>
                            </h4>
                            <div className="horizontal-bars-container">
                              {overallProductConsumption.slice(0, 8).map((prod, idx) => {
                                const maxVolume = Math.max(...overallProductConsumption.map(p => p.totalVolume), 1);
                                const pct = Math.round((prod.totalVolume / maxVolume) * 100);
                                const barColor = chartColors[idx % chartColors.length];
                                return (
                                  <div key={prod.productId} className="bar-row">
                                    <div className="bar-labels">
                                      <span className="bar-product-name" title={prod.productName}>
                                        {prod.productName}
                                      </span>
                                      <span className="bar-volume-val">
                                        {prod.totalVolume.toLocaleString()} u
                                      </span>
                                    </div>
                                    <div className="bar-track">
                                      <div
                                        className="bar-fill"
                                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </>
                ) : (
                  /* Tab 3: Purchase Forecast View */
                  <>
                    <div className="po-forecast-header-card animate-slideIn" style={{ marginBottom: '24px' }}>
                      <div className="po-header-left">
                        <span className="po-header-subtitle">Purchase Order Forecast</span>
                        <h2 className="po-header-title" style={{ color: 'white' }}>Estimated Needs for {monthNames[selectedMonth]}</h2>
                    </div>
                    <div className="po-header-right" style={{ textAlign: 'right' }}>
                      <span className="po-header-subtitle">Total Estimated Cost (incl. 5% GST)</span>
                      <div className="po-header-value">
                        ₹{purchaseForecastData.totalMonthlyPOCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                {/* PO Forecast Main Charts & Info Dashboard Section */}
                <details className="planning-analysis"><summary>Budget breakdown & vendor analysis <span aria-hidden="true">+</span></summary>
                <div className="overall-consumption-layout animate-slideIn" style={{ marginBottom: '24px' }}>
                  {/* KPI Stats Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <h4 className="chart-panel-title" style={{ margin: 0 }}>
                      <Clock size={16} style={{ color: 'var(--brand-primary)' }} />
                      <span>Estimated PO Summary</span>
                    </h4>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: 0, boxShadow: 'none', width: '100%' }}>
                      <div className="metric-card" style={{ background: 'hsl(210, 30%, 98%)', padding: '16px' }}>
                        <div className="metric-info">
                          <span className="metric-value" style={{ fontSize: '18px', color: 'var(--brand-navy)' }}>
                            ₹{purchaseForecastData.totalMonthlyPOCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="metric-label" style={{ fontSize: '11px', marginTop: '4px' }}>PO Budget (incl. 5% GST)</span>
                        </div>
                      </div>

                      <div className="metric-card" style={{ background: 'hsl(210, 30%, 98%)', padding: '16px' }}>
                        <div className="metric-info">
                          <span className="metric-value" style={{ fontSize: '18px', color: 'var(--brand-navy)' }}>
                            {purchaseForecastData.productsList.reduce((sum, p) => sum + p.totalQty, 0).toLocaleString()}
                          </span>
                          <span className="metric-label" style={{ fontSize: '11px', marginTop: '4px' }}>Total Units to Order</span>
                        </div>
                      </div>

                      <div className="metric-card" style={{ background: 'hsl(210, 30%, 98%)', padding: '16px' }}>
                        <div className="metric-info">
                          <span className="metric-value" style={{ fontSize: '18px', color: 'var(--brand-navy)' }}>
                            {purchaseForecastData.vendorsList.length}
                          </span>
                          <span className="metric-label" style={{ fontSize: '11px', marginTop: '4px' }}>Active Vendors Count</span>
                        </div>
                      </div>

                      <div className="metric-card" style={{ background: 'hsl(210, 30%, 98%)', padding: '16px' }}>
                        <div className="metric-info">
                          <span className="metric-value" style={{ fontSize: '18px', color: 'var(--brand-navy)' }}>
                            ₹{(purchaseForecastData.vendorsList.length > 0 ? purchaseForecastData.totalMonthlyPOCost / purchaseForecastData.vendorsList.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="metric-label" style={{ fontSize: '11px', marginTop: '4px' }}>Avg spend per Vendor</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spend by Vendor Chart */}
                  <div className="chart-panel">
                    <h4 className="chart-panel-title">
                      <BarChart3 size={16} style={{ color: 'var(--brand-primary)' }} />
                      <span>Estimated Spend by Vendor</span>
                    </h4>
                    <div className="horizontal-bars-container">
                      {purchaseForecastData.vendorsList.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                          No spend data available for this month.
                        </div>
                      ) : (
                        purchaseForecastData.vendorsList.slice(0, 5).map((vendor, idx) => {
                          const maxSpend = Math.max(...purchaseForecastData.vendorsList.map(v => v.totalCost), 1);
                          const pct = Math.round((vendor.totalCost / maxSpend) * 100);
                          const barColor = chartColors[idx % chartColors.length];
                          return (
                            <div key={vendor.vendorName} className="bar-row">
                              <div className="bar-labels">
                                <span className="bar-product-name" title={vendor.vendorName} style={{ maxWidth: '220px' }}>
                                  {vendor.vendorName}
                                </span>
                                <span className="bar-volume-val" style={{ fontWeight: 700 }}>
                                  ₹{vendor.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="bar-track">
                                <div
                                  className="bar-fill"
                                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                </details>
                {purchaseView === 'product' ? (
                  purchaseForecastData.productsList.length === 0 ? (
                    <div className="empty-state animate-slideIn">
                      <ShoppingBag size={48} style={{ color: 'var(--text-muted)' }} />
                      <h3 className="empty-state-title">No Purchases Forecasted</h3>
                      <p className="empty-state-desc">There are no predicted sales orders for active customers in the selected month.</p>
                    </div>
                  ) : (
                    <div className="table-responsive animate-slideIn">
                      <ResponsiveTable className="data-table" summaryColumns={[0, 3, 5]}>
                        <thead>
                          <tr>
                            <th>Product Details</th>
                            <th className="hide-mobile">Preferred Vendor</th>
                            <th className="hide-mobile">Manufacturer</th>
                            <th>Qty to Order</th>
                            <th className="hide-mobile">Cost Price</th>
                            <th>Total Estimated Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseForecastData.productsList.slice(paging.start, paging.end).map((prod) => (
                            <tr key={prod.productId}>
                              <td>
                                <div className="entity-cell">
                                  <span className="entity-name">{prod.productName}</span>
                                  <span className="entity-id">ID: {prod.productId}</span>
                                </div>
                              </td>
                              <td className="hide-mobile">
                                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{prod.preferredVendor}</span>
                              </td>
                              <td className="hide-mobile">
                                <span style={{ color: 'var(--text-secondary)' }}>{prod.manufacturer}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 700 }}>{prod.totalQty.toLocaleString()} units</span>
                              </td>
                              <td className="hide-mobile">
                                <span>₹{(prod.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                                  ₹{prod.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </ResponsiveTable>
                    </div>
                  )
                ) : (
                  purchaseForecastData.vendorsList.length === 0 ? (
                    <div className="empty-state animate-slideIn">
                      <Users size={48} style={{ color: 'var(--text-muted)' }} />
                      <h3 className="empty-state-title">No Vendor Purchases Found</h3>
                      <p className="empty-state-desc">There are no predicted sales orders for active customers in the selected month.</p>
                    </div>
                  ) : (
                    <div className="vendor-cards-grid animate-slideIn">
                      {purchaseForecastData.vendorsList.slice(paging.start, paging.end).map((vendor) => (
                        <div key={vendor.vendorName} className="vendor-po-card">
                          <div className="vendor-card-header">
                            <span className="vendor-name-title" title={vendor.vendorName}>
                              {vendor.vendorName}
                            </span>
                            <span className="vendor-po-value">
                              ₹{vendor.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="vendor-card-body">
                            <div className="vendor-items-list">
                              {vendor.items.map((item) => (
                                <div key={item.productId} className="vendor-item-row">
                                  <span className="vendor-item-name" title={item.productName}>
                                    {item.productName}
                                  </span>
                                  <span className="vendor-item-qty">
                                    {item.qty.toLocaleString()} u @ ₹{(item.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="vendor-card-footer">
                            <span>Items Count: {vendor.items.length}</span>
                            <span style={{ fontWeight: 600 }}>Total Qty: {vendor.totalItemsCount.toLocaleString()} units</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
              )}

            </div>
            <ResultsPager paging={paging} />
        </>
      )}
    </>
  )
}

{/* Change Password Modal */ }
{
  showPasswordModal && (
    <div className="modal-overlay">
      <div className="modal-card animate-slideIn">
        <div className="modal-header">
          <h3 className="modal-title">
            <Key size={18} style={{ color: 'var(--brand-primary)', marginRight: '6px' }} />
            <span>Update Password</span>
          </h3>
          <button
            onClick={() => setShowPasswordModal(false)}
            className="modal-close-btn"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="modal-form">
          {passwordError && (
            <div className="admin-alert error animate-shake" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="admin-alert success animate-slideIn" style={{ marginBottom: '16px' }}>
              <CheckCircle size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn-primary"
            >
              {isChangingPassword ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* Customer Distribution Modal */}
{
  selectedProductCustomerShare && (
    <ModalDialog title="Customer Distribution" onClose={() => setSelectedProductForChart(null)}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Users size={18} style={{ color: 'var(--brand-primary)', marginRight: '8px' }} />
            <span>Customer Distribution</span>
          </h3>
          <button
            onClick={() => setSelectedProductForChart(null)}
            className="modal-close-btn"
            title="Close"
            aria-label="Close customer distribution"
          >
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ padding: '24px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <ProductDonutChart 
            data={selectedProductCustomerShare} 
          />
        </div>
    </ModalDialog>
  )
}
    </div >
  );
}

export default App;
