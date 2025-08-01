import { initializeGame } from './gameLogic.js';

document.addEventListener('DOMContentLoaded', async () => {
    const testPlayData = sessionStorage.getItem('testPlayScenario');

    if (testPlayData) {
        // テストプレイ用のデータを読み込んでゲームを開始
        const scenario = JSON.parse(testPlayData);
        // テストプレイ後はデータを削除
        sessionStorage.removeItem('testPlayScenario');
        initializeGame(scenario);
    } else {
        // 通常のゲーム開始処理
        await loadGameFromUrl();
    }
});

async function loadGameFromUrl() {
    const gameArea = document.getElementById('game-area');
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game_id');

    if (!gameId) {
        gameArea.innerHTML = '<p>ゲームが指定されていません。<a href="/static/archive.html">ゲーム一覧</a>から選択してください。</p>';
        return;
    }

    try {
        const response = await fetch(`/games/${gameId}.json`);
        if (!response.ok) {
            throw new Error('ゲームの読み込みに失敗しました。');
        }
        const gameData = await response.json();
        initializeGame(gameData);
    } catch (error) {
        console.error('ゲームの読み込みに失敗しました:', error);
        gameArea.innerHTML = `<p>ゲームの読み込みに失敗しました。</p>`;
    }
}