// Подсветка активного шага в степпере навигации.
// Сравнивает имя текущего файла со ссылкой в каждом пункте степпера.
document.addEventListener('DOMContentLoaded', () => {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.stepper-track li').forEach(li => {
    const link = li.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === current) {
      li.classList.add('active');
    }
  });
});
