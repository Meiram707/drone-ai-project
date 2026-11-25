/* ==========================================================
   Калькулятор NDVI (Normalized Difference Vegetation Index)
   NDVI = (NIR - Red) / (NIR + Red)

   Используется на странице "Этап 7. Принятие решений" для
   демонстрации того, как система по рисунку 3 задания решает,
   нужен ли дополнительный снимок участка пшеничного поля.
   ========================================================== */

const NDVI_THRESHOLD = 0.4; // порог из решающего блока "NDVI < порог?"

function calcNDVI(red, nir) {
  const r = Number(red);
  const n = Number(nir);
  if (Number.isNaN(r) || Number.isNaN(n) || r + n === 0) return null;
  return (n - r) / (n + r);
}

function classifyNDVI(ndvi) {
  if (ndvi < 0.2) {
    return { label: 'Открытая почва / растительность отсутствует', css: 'status-bare' };
  }
  if (ndvi < NDVI_THRESHOLD) {
    return { label: 'Признаки фитостресса — требуется доп. снимок', css: 'status-stress' };
  }
  if (ndvi < 0.6) {
    return { label: 'Лёгкая неоднородность, состояние удовлетворительное', css: 'status-mild' };
  }
  return { label: 'Здоровая, активно вегетирующая растительность', css: 'status-healthy' };
}

// Тестовые примеры для участка пшеничного поля (Акмолинская область).
// Значения Red/NIR — усреднённые коэффициенты отражения (0..1).
const NDVI_PRESETS = {
  healthy: { red: 0.08, nir: 0.52, title: 'Здоровый участок' },
  moderate: { red: 0.12, nir: 0.25, title: 'Умеренный стресс' },
  severe:  { red: 0.18, nir: 0.20, title: 'Сильный стресс / голая почва' },
};

function renderNDVI(red, nir) {
  const ndvi = calcNDVI(red, nir);
  const valueEl = document.getElementById('ndvi-value');
  const statusEl = document.getElementById('ndvi-status');
  const decisionEl = document.getElementById('ndvi-decision');
  const markerEl = document.getElementById('ndvi-marker');

  if (ndvi === null) {
    valueEl.textContent = '—';
    statusEl.textContent = 'Введите корректные значения Red и NIR (0–1)';
    statusEl.className = 'status';
    decisionEl.textContent = '';
    return;
  }

  const { label, css } = classifyNDVI(ndvi);
  valueEl.textContent = ndvi.toFixed(3);
  statusEl.textContent = label;
  statusEl.className = `status ${css}`;

  const needsShot = ndvi < NDVI_THRESHOLD;
  decisionEl.textContent = needsShot
    ? `NDVI < ${NDVI_THRESHOLD} → Да → камера делает дополнительный снимок участка`
    : `NDVI < ${NDVI_THRESHOLD} → Нет → участок в норме, снимок не требуется`;

  // позиция маркера на шкале (диапазон -0.2..1 растянут на 0..100%)
  const pct = Math.min(100, Math.max(0, ((ndvi + 0.2) / 1.2) * 100));
  markerEl.style.left = `${pct}%`;
}

document.addEventListener('DOMContentLoaded', () => {
  const redInput = document.getElementById('red-input');
  const nirInput = document.getElementById('nir-input');
  const calcBtn = document.getElementById('calc-btn');
  if (!redInput || !nirInput || !calcBtn) return; // скрипт подключён не на той странице

  calcBtn.addEventListener('click', () => renderNDVI(redInput.value, nirInput.value));

  document.querySelectorAll('.ndvi-presets button').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = NDVI_PRESETS[btn.dataset.preset];
      if (!preset) return;
      redInput.value = preset.red;
      nirInput.value = preset.nir;
      renderNDVI(preset.red, preset.nir);
    });
  });

  // показать расчёт для примера "Здоровый участок" сразу при загрузке
  const initial = NDVI_PRESETS.healthy;
  redInput.value = initial.red;
  nirInput.value = initial.nir;
  renderNDVI(initial.red, initial.nir);
});
