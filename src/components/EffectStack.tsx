import React from 'react';
import { useStore } from '../store/useStore';
import { Plus, X, Power, ChevronRight } from 'lucide-react';
import './EffectStack.css';
import { EffectType } from '../types/synth';

export const EffectStack: React.FC = () => {
  const { 
    project, 
    selectedMixerChannel, 
    addEffect, 
    removeEffect, 
    setActiveEffect,
    activeEffectId
  } = useStore();

  const isMaster = selectedMixerChannel === null;
  const channelIndex = selectedMixerChannel;
  const chain = isMaster ? project.masterEffectChain : project.mixerEffectChains[channelIndex!] || [];

  const effectTypes: EffectType[] = [
    'Limiter', 'Delay', 'Reverb', 'Phaser', 'Tremolo', 'EQ', 'HPF', 'LPF', 'Notch', 'Bitcrusher'
  ];

  return (
    <div className="effect-stack">
      <div className="stack-header">
        <span>INSERT SLOTS ({isMaster ? 'MASTER' : `CH ${channelIndex! + 1}`})</span>
        <div className="effect-menu-trigger has-dropdown">
          <Plus size={14} />
          <div className="dropdown right">
            {effectTypes.map(type => (
              <button key={type} onClick={() => addEffect(isMaster ? 'master' : channelIndex!, type)}>
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="stack-list">
        {chain.map((fx, i) => (
          <div 
            key={fx.id} 
            className={`fx-slot ${activeEffectId === fx.id ? 'active' : ''}`}
            onClick={() => setActiveEffect(fx.id)}
          >
            <span className="slot-num">{i + 1}</span>
            <button className={`bypass-btn ${fx.enabled ? 'on' : ''}`}>
              <Power size={10} />
            </button>
            <span className="fx-name">{fx.type}</span>
            <div className="slot-actions">
              <button 
                className="remove-fx-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeEffect(isMaster ? 'master' : channelIndex!, fx.id);
                }}
              >
                <X size={10} />
              </button>
              <ChevronRight size={12} className="arrow" />
            </div>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 10 - chain.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="fx-slot empty">
            <span className="slot-num">{chain.length + i + 1}</span>
            <span className="fx-name">(empty)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
