/**
 * 共通UI関数モジュール
 */
export const CommonUI = {
    showLoading(container) {
        container.innerHTML = '<div class="loading"></div>';
    },
    
    showError(container, message) {
        container.innerHTML = `
            <div class="error-message">
                <strong>エラー:</strong> ${message}
            </div>
        `;
        console.error(message);
    },
    
    showSuccess(container, title, message, buttonText, gameId) {
        container.innerHTML = `
            <div class="success-message">
                <h3>✅ ${title}</h3>
                <p>${message}</p>
                <button class="button success-button play-now-button" data-game-id="${gameId}">
                    ${buttonText}
                </button>
            </div>
        `;
    }
};