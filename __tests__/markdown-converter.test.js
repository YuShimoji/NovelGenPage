/* eslint-env jest */
const fs = require('fs');
const path = require('path');

function loadMarkdownConverter(jsdomWindow) {
  const filePath = path.join(__dirname, '..', 'static', 'js', 'markdown-converter.js');
  const code = fs.readFileSync(filePath, 'utf-8');
  // 実行: jsdom のグローバル文脈で IIFE を実行
  jsdomWindow.eval(code);
}

function installFakeMarkedFunction(window) {
  // marked 関数APIのモック
  window.marked = function fakeMarked(md, { renderer } = {}) {
    // 最低限のリンク処理だけを実装し、renderer.link を呼び出す
    return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
      // 新APIの token 形式で渡す
      const token = { href, title: null, text: label };
      return renderer && typeof renderer.link === 'function'
        ? renderer.link(token)
        : `<a href="${href}">${label}</a>`;
    });
  };
}

function installFakeMarkedObject(window) {
  // marked オブジェクトAPI(parse)のモック
  window.marked = {
    parse(md, { renderer } = {}) {
      return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
        const token = { href, title: null, text: label };
        return renderer && typeof renderer.link === 'function'
          ? renderer.link(token)
          : `<a href="${href}">${label}</a>`;
      });
    },
  };
}

function resetGlobals(window) {
  delete window.markdownToHtml;
  delete window.NovelGenPage;
  delete window.marked;
}

describe('markdown-converter renderer.link compatibility', () => {
  beforeEach(() => {
    // jsdom 環境は jest-environment-jsdom により提供
    resetGlobals(window);
  });

  test('marked function API: scene links -> .scene-link anchor, normal links fallback', () => {
    installFakeMarkedFunction(window);
    loadMarkdownConverter(window);
    expect(typeof window.markdownToHtml).toBe('function');

    const md = [
      '### 選択肢',
      '- [次のシーン](scene:2)',
      '- [公式](https://example.com)'
    ].join('\n');

    const html = window.markdownToHtml(md);
    expect(html).toContain('<a href="#" class="scene-link" data-scene-id="2">次のシーン</a>');
    expect(html).toContain('<a href="https://example.com">公式</a>');
  });

  test('marked object API (parse): no TypeError and scene links render', () => {
    installFakeMarkedObject(window);
    loadMarkdownConverter(window);

    const md = '- [GO](scene:10)';
    const html = window.markdownToHtml(md);
    expect(html).toContain('class="scene-link"');
    expect(html).toContain('data-scene-id="10"');
  });
});
