/**
 * ビュー管理モジュール
 */
export const ViewManager = {
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