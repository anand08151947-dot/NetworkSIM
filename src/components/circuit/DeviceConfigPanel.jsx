import { useState, useEffect, useCallback } from 'react';
import { EQUIPMENT_STACKS } from '../../data/circuitPlans';
import { getDeviceConfigs } from '../../data/circuitConfigs';

const VENDOR_COLORS = {
  Cisco:    '#fde68a',
  Juniper:  '#86efac',
  Nokia:    '#93c5fd',
  Ciena:    '#c4b5fd',
  Infinera: '#c4b5fd',
  Arista:   '#f9a8d4',
  Ericsson: '#fdba74',
  Calix:    '#67e8f9',
};

const LANG_COLORS = {
  'ios-xr': '#fde68a',
  'junos':  '#86efac',
  'sros':   '#93c5fd',
  'json':   '#c4b5fd',
  'eos':    '#f9a8d4',
  'cli':    'var(--text-secondary)',
  'shell':  'var(--text-secondary)',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? '#052e16' : '#0a1628',
        border: `1px solid ${copied ? '#166534' : 'var(--bg-accent)'}`,
        color: copied ? '#4ade80' : '#64748b',
        borderRadius: 5,
        padding: '3px 10px',
        fontSize: 11,
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  );
}

export default function DeviceConfigPanel({ circuitType, form, plan, activeDeviceIndex }) {
  const stack = EQUIPMENT_STACKS[circuitType] ?? [];
  const [selectedDevice, setSelectedDevice] = useState(0);
  const [selectedTab, setSelectedTab]       = useState(0);

  // Auto-select device when simulation advances
  useEffect(() => {
    if (activeDeviceIndex >= 0 && activeDeviceIndex < stack.length) {
      setTimeout(() => {
        setSelectedDevice(activeDeviceIndex);
        setSelectedTab(0);
      }, 0);
    }
  }, [activeDeviceIndex, stack.length]);

  // Reset tab when device changes
  useEffect(() => {
    setTimeout(() => {
      setSelectedTab(0);
    }, 0);
  }, [selectedDevice]);

  const configData = getDeviceConfigs(selectedDevice, circuitType, form, plan);
  const tabs = configData?.tabs ?? [];
  const activeTab = tabs[selectedTab] ?? tabs[0];

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }}>
      {/* Left device list */}
      <div style={{
        width: 168,
        flexShrink: 0,
        borderRight: '1px solid #1e2a3a',
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--border-subtle)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          padding: '2px 12px 8px',
        }}>
          Equipment Chain
        </div>
        {stack.map((device, idx) => {
          const isActive = idx === selectedDevice;
          const isHighlighted = idx === activeDeviceIndex;
          const vendorColor = VENDOR_COLORS[device.vendor] ?? 'var(--text-secondary)';
          return (
            <button
              key={idx}
              onClick={() => setSelectedDevice(idx)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                textAlign: 'left',
                background: isActive ? '#0f3460' : isHighlighted ? '#0a1e36' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? vendorColor : isHighlighted ? '#1e4976' : 'transparent'}`,
                borderBottom: '1px solid #0a1220',
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: isActive ? 'var(--text-primary)' : '#64748b',
                marginBottom: 2,
                lineHeight: 1.3,
              }}>
                {device.role}
              </div>
              <div style={{
                display: 'inline-block',
                fontSize: 9,
                fontWeight: 700,
                color: vendorColor,
                background: '#0a1220',
                borderRadius: 3,
                padding: '1px 5px',
                marginBottom: 1,
              }}>
                {device.vendor}
              </div>
              <div style={{ fontSize: 9, color: 'var(--border-subtle)' }}>
                {device.model}
              </div>
              {isHighlighted && !isActive && (
                <div style={{ fontSize: 8, color: '#f59e0b', marginTop: 2 }}>● active</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Right config viewer */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Device header */}
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid #1e2a3a',
          background: 'var(--bg-primary)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            {configData?.device?.role}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: VENDOR_COLORS[configData?.device?.vendor] ?? 'var(--text-secondary)',
            background: '#0a1220',
            borderRadius: 4,
            padding: '1px 7px',
          }}>
            {configData?.device?.vendor} {configData?.device?.model}
          </span>
          {plan?.orderId && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: 'auto' }}>
              {plan.orderId}
            </span>
          )}
        </div>

        {/* Config tabs bar */}
        {tabs.length > 1 && (
          <div style={{
            display: 'flex',
            gap: 2,
            padding: '5px 10px',
            borderBottom: '1px solid #1e2a3a',
            background: '#060c1a',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}>
            {tabs.map((tab, idx) => {
              const isActive = idx === selectedTab;
              const langColor = LANG_COLORS[tab.lang] ?? 'var(--text-secondary)';
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(idx)}
                  style={{
                    background: isActive ? '#0f3460' : 'transparent',
                    border: isActive ? `1px solid ${langColor}44` : '1px solid transparent',
                    color: isActive ? langColor : 'var(--text-muted)',
                    borderRadius: 5,
                    padding: '3px 10px',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Config content */}
        {activeTab && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 12px',
              background: '#050a14',
              borderBottom: '1px solid #0f1e30',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 10,
                color: LANG_COLORS[activeTab.lang] ?? 'var(--text-secondary)',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}>
                {activeTab.label}
              </span>
              <div style={{ marginLeft: 'auto' }}>
                <CopyButton text={activeTab.config} />
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <pre style={{
                margin: 0,
                padding: '14px 16px',
                fontSize: 11,
                lineHeight: 1.6,
                fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                color: LANG_COLORS[activeTab.lang] ?? 'var(--text-secondary)',
                background: 'transparent',
                whiteSpace: 'pre',
                tabSize: 2,
              }}>
                {activeTab.config}
              </pre>
            </div>
          </div>
        )}

        {!activeTab && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bg-accent)',
            fontSize: 13,
          }}>
            Select a device to view its configuration
          </div>
        )}
      </div>
    </div>
  );
}
