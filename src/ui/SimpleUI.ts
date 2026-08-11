import { GameStore } from '../engine/core/GameStore';

/**
 * Simple HTML UI Overlay for MVP.
 * Handles inventory display, Chao stats, and action buttons.
 */
export class SimpleUI {
  private container: HTMLElement;
  private store: GameStore;
  private updateInterval: number = 0;
  
  // UI Elements
  private inventoryEl: HTMLElement | null = null;
  private chaoStatsEl: HTMLElement | null = null;
  private actionButtonsEl: HTMLElement | null = null;
  private modeIndicatorEl: HTMLElement | null = null;
  
  // State
  private selectedChaoId: string | null = null;

  constructor(store: GameStore) {
    this.store = store;
    this.container = document.createElement('div');
    this.container.id = 'game-ui';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: Arial, sans-serif;
      color: white;
      text-shadow: 1px 1px 2px black;
      z-index: 1000;
    `;
    document.body.appendChild(this.container);
    
    this.createUI();
    this.startUpdateLoop();
  }

  private createUI(): void {
    // Mode Indicator (Top Left)
    this.modeIndicatorEl = this.createElement(`
      <div style="
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0,0,0,0.7);
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #4a90d9;
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #4a90d9;">MODE</h2>
        <div id="mode-text" style="font-size: 24px; font-weight: bold;">GARDEN</div>
      </div>
    `);
    
    // Inventory (Top Right)
    this.inventoryEl = this.createElement(`
      <div style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #ffd700;
        min-width: 200px;
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #ffd700;">INVENTORY</h2>
        <div id="inventory-list" style="font-size: 14px; line-height: 1.6;">
          Loading...
        </div>
      </div>
    `);
    
    // Chao Stats (Bottom Left)
    this.chaoStatsEl = this.createElement(`
      <div style="
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(0,0,0,0.7);
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #ff69b4;
        min-width: 250px;
        display: none;
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #ff69b4;">CHAO STATS</h2>
        <div id="chao-name" style="font-size: 16px; font-weight: bold; margin-bottom: 10px;"></div>
        <div id="chao-bars" style="font-size: 12px;"></div>
        <div id="chao-type" style="margin-top: 10px; font-size: 14px; color: #aaa;"></div>
      </div>
    `);
    
    // Action Buttons (Bottom Right) - Pointer events enabled
    this.actionButtonsEl = this.createElement(`
      <div style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: auto;
      ">
        <button id="btn-feed" style="
          background: #ff6b6b;
          border: 2px solid white;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
        ">🍎 FEED APPLE</button>
        
        <button id="btn-pet" style="
          background: #4ecdc4;
          border: 2px solid white;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
        ">✋ PET CHAO</button>
        
        <button id="btn-switch" style="
          background: #4a90d9;
          border: 2px solid white;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
        ">🔄 SWITCH MODE</button>
      </div>
    `);
    
    // Setup button handlers
    this.setupButtonHandlers();
  }

  private createElement(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html;
    this.container.appendChild(div.firstElementChild as HTMLElement);
    return div.firstElementChild as HTMLElement;
  }

  private setupButtonHandlers(): void {
    const feedBtn = document.getElementById('btn-feed');
    const petBtn = document.getElementById('btn-pet');
    const switchBtn = document.getElementById('btn-switch');
    
    if (feedBtn) {
      feedBtn.addEventListener('click', () => {
        if (this.selectedChaoId) {
          this.store.emitEvent('chao_feed_apple', { chaoId: this.selectedChaoId });
        } else {
          alert('Click on a Chao first!');
        }
      });
    }
    
    if (petBtn) {
      petBtn.addEventListener('click', () => {
        if (this.selectedChaoId) {
          this.store.emitEvent('chao_pet', { chaoId: this.selectedChaoId });
        } else {
          alert('Click on a Chao first!');
        }
      });
    }
    
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        const currentMode = this.store.getCurrentMode();
        const newMode = currentMode === 'garden' ? 'adventure' : 'garden';
        this.store.setMode(newMode);
        this.updateModeIndicator();
      });
    }
  }

  private startUpdateLoop(): void {
    const update = () => {
      this.updateInventory();
      this.updateChaoStats();
      this.updateModeIndicator();
      requestAnimationFrame(update);
    };
    update();
  }

  private updateInventory(): void {
    if (!this.inventoryEl) return;
    
    const inventory = this.store.getInventory();
    const listEl = document.getElementById('inventory-list');
    if (!listEl) return;
    
    const items = Object.entries(inventory).filter(([_, count]) => count > 0);
    
    if (items.length === 0) {
      listEl.innerHTML = '<em>Empty</em>';
      return;
    }
    
    listEl.innerHTML = items.map(([key, count]) => {
      const icon = key.includes('ring') ? '💍' : 
                   key.includes('animal') ? '🐾' : 
                   key.includes('drive') ? '💎' : '🍎';
      const name = key.replace('_', ' ').toUpperCase();
      return `<div>${icon} ${name}: ${count}</div>`;
    }).join('');
  }

  private updateChaoStats(): void {
    if (!this.chaoStatsEl || !this.selectedChaoId) {
      if (this.chaoStatsEl) {
        this.chaoStatsEl.style.display = 'none';
      }
      return;
    }
    
    const chao = this.store.getChaoById(this.selectedChaoId);
    if (!chao) return;
    
    this.chaoStatsEl.style.display = 'block';
    
    const nameEl = document.getElementById('chao-name');
    const barsEl = document.getElementById('chao-bars');
    const typeEl = document.getElementById('chao-type');
    
    if (nameEl) nameEl.textContent = chao.name;
    if (typeEl) typeEl.textContent = `Type: ${chao.type.toUpperCase()} | Stage: ${chao.stage}`;
    
    if (barsEl) {
      const needs = chao.needs;
      barsEl.innerHTML = `
        <div style="margin-bottom: 8px;">
          <span>HUNGER</span>
          <div style="background:#333;height:10px;border-radius:5px;margin-top:4px;">
            <div style="width:${needs.hunger}%;background:#ff6b6b;height:100%;border-radius:5px;"></div>
          </div>
        </div>
        <div style="margin-bottom: 8px;">
          <span>ENERGY</span>
          <div style="background:#333;height:10px;border-radius:5px;margin-top:4px;">
            <div style="width:${needs.energy}%;background:#4ecdc4;height:100%;border-radius:5px;"></div>
          </div>
        </div>
        <div>
          <span>HAPPINESS</span>
          <div style="background:#333;height:10px;border-radius:5px;margin-top:4px;">
            <div style="width:${needs.happiness}%;background:#ffe66d;height:100%;border-radius:5px;"></div>
          </div>
        </div>
        <div style="margin-top:10px;color:#aaa;font-size:12px;">
          EXP: ${chao.exp} | Run:${chao.stats.run} Swim:${chao.stats.swim} Fly:${chao.stats.fly}
        </div>
      `;
    }
  }

  private updateModeIndicator(): void {
    const modeEl = document.getElementById('mode-text');
    if (modeEl) {
      const mode = this.store.getCurrentMode();
      modeEl.textContent = mode.toUpperCase();
      modeEl.style.color = mode === 'garden' ? '#4a90d9' : '#ff6b6b';
    }
  }

  public setSelectedChao(id: string | null): void {
    this.selectedChaoId = id;
    if (id) {
      this.updateChaoStats();
    }
  }

  public dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
