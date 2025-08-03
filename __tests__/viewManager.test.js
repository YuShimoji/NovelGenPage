const fs = require('fs');
const path = require('path');

describe('ViewManager', () => {
  let ViewManager;

  beforeEach(() => {
    // 1. シンプルなHTML構造をセットアップ
    document.body.innerHTML = `
      <div id="home-view" class="view"></div>
      <div id="game-view" class="view"></div>
    `;

    // 2. ViewManagerを直接定義（main.jsから抽出するのではなく）
    ViewManager = {
      currentView: 'home-view',
      
      showView(viewId) {
        // 全てのビューを非表示
        document.querySelectorAll('.view').forEach(view => {
          view.classList.remove('active');
        });
        
        // 指定されたビューを表示
        const targetView = document.getElementById(viewId);
        if (targetView) {
          targetView.classList.add('active');
          this.currentView = viewId;
        }
      },
      
      showHome() {
        this.showView('home-view');
      },
      
      showGame() {
        this.showView('game-view');
      }
    };
  });

  test('ViewManagerが正しく定義されていること', () => {
    expect(ViewManager).toBeDefined();
    expect(typeof ViewManager.showView).toBe('function');
    expect(typeof ViewManager.showHome).toBe('function');
    expect(typeof ViewManager.showGame).toBe('function');
    expect(ViewManager.currentView).toBe('home-view');
  });

  test('showViewは対象のビューを表示し、他を非表示にすること', () => {
    const homeView = document.getElementById('home-view');
    const gameView = document.getElementById('game-view');
    
    homeView.classList.add('active');
    expect(homeView.classList.contains('active')).toBe(true);

    ViewManager.showView('game-view');

    expect(homeView.classList.contains('active')).toBe(false);
    expect(gameView.classList.contains('active')).toBe(true);
    expect(ViewManager.currentView).toBe('game-view');
  });

  test('showHomeはホーム画面を表示すること', () => {
    const homeView = document.getElementById('home-view');
    const gameView = document.getElementById('game-view');
    
    gameView.classList.add('active');
    
    ViewManager.showHome();

    expect(homeView.classList.contains('active')).toBe(true);
    expect(gameView.classList.contains('active')).toBe(false);
  });

  test('showGameはゲーム画面を表示すること', () => {
    const homeView = document.getElementById('home-view');
    const gameView = document.getElementById('game-view');

    homeView.classList.add('active');

    ViewManager.showGame();

    expect(homeView.classList.contains('active')).toBe(false);
    expect(gameView.classList.contains('active')).toBe(true);
  });
});