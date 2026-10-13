const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '打开导航');
    nav.classList.remove('open');
    menu.focus();
  }
});
const filters = [...document.querySelectorAll('[data-filter]')];
const search = document.querySelector('#project-search');
const cards = [...document.querySelectorAll('[data-category]')];
let category = '全部';
function filterProjects() {
  const query = (search?.value || '').trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const matches = (category === '全部' || card.dataset.category === category) && card.dataset.search.toLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  });
  const count = document.querySelector('.results-count');
  if (count) count.textContent = `展示 ${visible} 个作品`;
  const empty = document.querySelector('.empty-state');
  if (empty) empty.hidden = visible !== 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filters.forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  filterProjects();
}));
search?.addEventListener('input', filterProjects);
if (cards.length) filterProjects();
