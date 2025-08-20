/* eslint-env jest */
const fs = require('fs');
const path = require('path');

function loadMarkdownConverter(jsdomWindow) {
  const filePath = path.join(__dirname, '..', 'static', 'js', 'markdown-converter.js');
  const code = fs.readFileSync(filePath, 'utf-8');
  jsdomWindow.eval(code);
}

describe('scene-link click calls window.NovelGenPage.navigateToScene', () => {
  beforeEach(() => {
    // グローバル初期化
    delete window.markdownToHtml;
    delete window.NovelGenPage;
    // 最低限の marked モック（リンクのみ）
    window.marked = function(md, { renderer } = {}) {
      return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
        const token = { href, title: null, text: label };
        return renderer && typeof renderer.link === 'function'
          ? renderer.link(token)
          : `<a href="${href}">${label}</a>`;
      });
    };
    loadMarkdownConverter(window);
  });

  test('clicking a .scene-link invokes navigateToScene with correct args', () => {
    // モックを設定
    window.NovelGenPage = { navigateToScene: jest.fn() };

    const md = '- [次へ](scene:42)';
    const html = window.markdownToHtml(md);
    document.body.innerHTML = `<div id="preview">${html}</div>`;

    const link = document.querySelector('.scene-link');
    expect(link).toBeTruthy();

    // クリックをシミュレート
    link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(window.NovelGenPage.navigateToScene).toHaveBeenCalledTimes(1);
    const [sceneId, sceneName] = window.NovelGenPage.navigateToScene.mock.calls[0];
    expect(sceneId).toBe('42');
    expect(typeof sceneName).toBe('string');
  });
});
