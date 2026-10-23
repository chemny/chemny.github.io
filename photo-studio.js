(() => {
  const root = document.querySelector('[data-photo-base]');
  if (!root) return;
  const asset = name => new URL(name, new URL(root.dataset.photoBase, location.href)).href;
  const cases = {
    wedding: { title: '婚纱照', label: 'WEDDING PORTRAITS', count: 9, sheet: 'wedding-sheet.webp',
      sources: [['woman-source.webp', '新娘参考'], ['man-source.webp', '新郎参考']],
      brief: '用这两位人物做一张婚纱照九宫格。变化婚礼场景、礼服与互动，保留两人的长相和自然体型。',
      tags: ['两人身份保持', '礼服与场景搭配', '多种互动'],
      note: '从花园、海边到城市夜景，比较同一对人物的不同婚礼方向。' },
    branding: { title: '个人形象照', label: 'PERSONAL BRANDING', count: 9, sheet: 'branding-sheet.webp',
      sources: [['woman-source.webp', '人物参考']],
      brief: '用这个女孩的素材制作个人形象照九宫格，覆盖工作与生活。穿搭现代、自然，保留原本体型，头顶有舒适留白。',
      tags: ['职业与生活', '现代穿搭', '自然构图'],
      note: '正式形象、环境工作与生活活动，共同呈现一个人的不同面貌。' },
    family: { title: '全家福', label: 'FAMILY STORIES', count: 6, sheet: 'family-sheet.webp',
      sources: [['family-source.webp', '三人合影 · 体型参考']],
      brief: '一张正式合影、两张居家互动、两张户外活动，再加一张家庭纪念合影。每格保留三位成员，保持原素材体型，不拉伸或瘦身。',
      tags: ['全员完整入镜', '共同生活瞬间', '横版六宫格'],
      note: '居家阅读、一起备餐、散步和野餐，让照片与一家人的关系相连。' },
    pet: { title: '宠物写真', label: 'PET CHARACTERS', count: 9, sheet: 'pet-sheet.webp',
      sources: [['pet-source.webp', '宠物参考']],
      brief: '给这只猫设计九种不同的主题造型，服装、配饰、动作和布景一起变化。保留它的眼睛、毛色、花纹及真实动物体态。',
      tags: ['毛色花纹保持', '九种主题造型', '真实动物体态'],
      note: '绅士、画家、航海家与星际旅人，每个主题都有相应的造型语言。' }
  };
  const dialog = document.querySelector('.ps-lightbox');
  const largeImage = dialog?.querySelector('img');
  const dialogTitle = dialog?.querySelector('h2');
  const dialogNote = dialog?.querySelector('.ps-lightbox-bottom p');
  let activeKey = 'wedding', activeIndex = -1, lastTrigger;
  const setLightbox = (key, index) => {
    const item = cases[key]; activeKey = key; activeIndex = index;
    const whole = index < 0;
    largeImage.src = asset(whole ? item.sheet : `${key}-cell-${index + 1}.webp`);
    largeImage.alt = whole ? `${item.title}完整预览` : `${item.title}第${index + 1}格预览节选`;
    dialogTitle.textContent = whole ? `${item.title} · 完整预览` : `${item.title} · 第 ${index + 1} / ${item.count} 格`;
    dialogNote.textContent = whole ? 'AI 合成素材演示 · 图片按原比例显示' : '预览画格节选；未作为独立高清成片交付。';
    dialog.querySelector('.ps-lightbox-controls').hidden = whole;
  };
  const openLightbox = (key, index, trigger) => {
    if (!dialog) return;
    lastTrigger = trigger; setLightbox(key, index); dialog.showModal();
    dialog.querySelector('.ps-close').focus();
  };
  dialog?.querySelector('.ps-close').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close(); } });
  dialog?.addEventListener('close', () => lastTrigger?.focus());
  const step = direction => { if (activeIndex >= 0) setLightbox(activeKey, (activeIndex + direction + cases[activeKey].count) % cases[activeKey].count); };
  dialog?.querySelector('[data-step="-1"]').addEventListener('click', () => step(-1));
  dialog?.querySelector('[data-step="1"]').addEventListener('click', () => step(1));
  dialog?.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); step(1); } });
  document.querySelectorAll('[data-open-sheet]').forEach(button => button.addEventListener('click', () => openLightbox(button.dataset.openSheet, -1, button)));
  document.querySelectorAll('[data-compare]').forEach(compare => {
    const slider = compare.querySelector('input');
    slider.addEventListener('input', () => { compare.querySelector('.ps-compare').style.setProperty('--reveal', `${slider.value}%`); slider.setAttribute('aria-valuetext', `修改前显示 ${slider.value}%`); });
  });
  const tabs = [...document.querySelectorAll('[role="tab"][data-theme]')];
  if (!tabs.length) return;
  let current = 'wedding';
  const select = (key, updateHash = true) => {
    const item = cases[key]; if (!item) return; current = key;
    tabs.forEach(tab => { const chosen = tab.dataset.theme === key; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; });
    document.querySelector('#preview-panel').setAttribute('aria-labelledby', `tab-${key}`);
    document.querySelector('#source-label').textContent = item.label;
    const sources = document.querySelector('#sources'); sources.classList.toggle('family', key === 'family'); sources.replaceChildren();
    item.sources.forEach(([src, label]) => { const figure = document.createElement('figure'), img = document.createElement('img'), caption = document.createElement('figcaption'); img.src = asset(src); img.alt = label; caption.textContent = label; figure.append(img, caption); sources.append(figure); });
    document.querySelector('#brief').textContent = item.brief;
    const tags = document.querySelector('#tags'); tags.replaceChildren(); item.tags.forEach(tag => { const span = document.createElement('span'); span.className = 'ps-pill'; span.textContent = tag; tags.append(span); });
    document.querySelector('#output-title').textContent = `${item.title} · ${item.count === 6 ? '六' : '九'}宫格预览`;
    document.querySelector('#output-subtitle').textContent = `${item.count} 个方向 · 点击任一画格查看细节`;
    const image = document.querySelector('#sheet-image'); image.src = asset(item.sheet); image.alt = `${item.title}完整${item.count}宫格预览`;
    document.querySelector('#sheet').classList.toggle('family', key === 'family');
    document.querySelector('#output-caption').textContent = item.note;
    const targets = document.querySelector('#cell-targets'); targets.replaceChildren();
    for (let i = 0; i < item.count; i++) { const button = document.createElement('button'); button.className = 'ps-cell-target'; button.setAttribute('aria-label', `放大${item.title}第${i + 1}格`); const number = document.createElement('span'); number.textContent = String(i + 1).padStart(2, '0'); button.append(number); button.addEventListener('click', () => openLightbox(key, i, button)); targets.append(button); }
    if (updateHash) history.replaceState(null, '', `#${key}`);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.theme));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(tabs[next].dataset.theme); tabs[next].focus(); }
    });
  });
  document.querySelector('#open-whole').addEventListener('click', event => openLightbox(current, -1, event.currentTarget));
  window.addEventListener('hashchange', () => select(location.hash.slice(1), false));
  select(cases[location.hash.slice(1)] ? location.hash.slice(1) : 'wedding', false);
})();
