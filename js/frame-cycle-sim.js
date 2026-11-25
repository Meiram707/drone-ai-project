/* ==========================================================
   Симуляция основного цикла обработки кадра (Этап 7, рисунок 1):

   Запуск потока -> Получение кадра -> (кадр не получен? -> continue)
   -> Detect объектов -> Проверка аномалий текстуры -> GPS-координаты
   -> (объекты/аномалии найдены? Нет -> следующий кадр / Да ->
   формирование и отправка сообщения)

   Реальных моделей (YOLOv8 и т.д.) здесь нет — вероятности ниже
   имитируют их решения, чтобы показать логику цикла вживую.
   ========================================================== */

const SIM_FRAME_MISS_PROB = 0.12; // шанс, что кадр не получен
const SIM_DETECT_PROB = 0.4; // шанс найти объект
const SIM_ANOMALY_PROB = 0.22; // шанс аномалии текстуры (независимо от объекта)

const SIM_STEP_IDS = [
  "step-frame",
  "step-detect",
  "step-anomaly",
  "step-gps",
  "step-decision",
  "step-message",
];

function simSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simLog(line, cssClass) {
  const log = document.getElementById("sim-log");
  if (!log) return;
  const span = document.createElement("div");
  if (cssClass) span.className = cssClass;
  span.textContent = line;
  log.appendChild(span);
  log.scrollTop = log.scrollHeight;
}

function simHighlight(activeId, skipIds = []) {
  SIM_STEP_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("active", id === activeId);
    el.classList.toggle("skip", skipIds.includes(id));
  });
}

// Один проход цикла без задержек — используется и в пошаговом, и в пакетном режиме.
// Возвращает объект с результатами, чтобы можно было считать статистику.
function simRunOnce() {
  const frameReceived = Math.random() > SIM_FRAME_MISS_PROB;
  if (!frameReceived) {
    return {
      frameReceived: false,
      detected: false,
      anomaly: false,
      messageSent: false,
    };
  }
  const detected = Math.random() < SIM_DETECT_PROB;
  const anomaly = Math.random() < SIM_ANOMALY_PROB;
  const messageSent = detected || anomaly;
  return { frameReceived: true, detected, anomaly, messageSent };
}

async function simRunAnimated() {
  const btn = document.getElementById("sim-run-btn");
  if (btn) btn.disabled = true;
  const step = 420;

  simHighlight("step-frame");
  simLog("→ Получение кадра с камеры...", "log-dim");
  await simSleep(step);

  const frameReceived = Math.random() > SIM_FRAME_MISS_PROB;
  if (!frameReceived) {
    simLog(
      "✗ Кадр не получен → continue (переход к следующему кадру)",
      "log-warn",
    );
    simHighlight(null, SIM_STEP_IDS.slice(1));
    if (btn) btn.disabled = false;
    return;
  }
  simLog("✓ Кадр получен", "log-ok");

  simHighlight("step-detect");
  await simSleep(step);
  const detected = Math.random() < SIM_DETECT_PROB;
  simLog(
    detected ? "✓ Detect: объект найден" : "— Detect: объектов не найдено",
    detected ? "log-ok" : "log-dim",
  );

  simHighlight("step-anomaly");
  await simSleep(step);
  const anomaly = Math.random() < SIM_ANOMALY_PROB;
  simLog(
    anomaly
      ? "✓ Обнаружена аномалия текстуры"
      : "— Аномалий текстуры не обнаружено",
    anomaly ? "log-ok" : "log-dim",
  );

  simHighlight("step-gps");
  await simSleep(step);
  const lat = (51.17 + Math.random() * 0.02).toFixed(5);
  const lon = (71.45 + Math.random() * 0.02).toFixed(5);
  simLog(`✓ GPS-координаты получены: ${lat}, ${lon}`, "log-dim");

  simHighlight("step-decision");
  await simSleep(step);
  const needMessage = detected || anomaly;
  simLog(
    `Решение: объекты или аномалии найдены? ${needMessage ? "Да" : "Нет"}`,
    needMessage ? "log-alert" : "log-dim",
  );

  if (!needMessage) {
    simLog("→ Переход к получению следующего кадра", "log-dim");
    simHighlight(null, ["step-message"]);
    if (btn) btn.disabled = false;
    return;
  }

  simHighlight("step-message");
  await simSleep(step);
  simLog(
    "✓ Формирование сообщения → отправка сообщения / управление объектом",
    "log-alert",
  );

  if (btn) btn.disabled = false;
}

function simRunBatch(n) {
  const stats = { total: n, missed: 0, detected: 0, anomaly: 0, messages: 0 };
  for (let i = 0; i < n; i++) {
    const r = simRunOnce();
    if (!r.frameReceived) {
      stats.missed++;
      continue;
    }
    if (r.detected) stats.detected++;
    if (r.anomaly) stats.anomaly++;
    if (r.messageSent) stats.messages++;
  }
  return stats;
}

function simRenderStats(stats) {
  const box = document.getElementById("sim-stats");
  if (!box) return;
  box.innerHTML = `
    <div class="sim-stats-grid">
      <div class="sim-stat"><span class="num">${stats.total}</span><span class="lbl">Всего кадров</span></div>
      <div class="sim-stat"><span class="num">${stats.missed}</span><span class="lbl">Кадр не получен</span></div>
      <div class="sim-stat"><span class="num">${stats.detected}</span><span class="lbl">Найден объект</span></div>
      <div class="sim-stat"><span class="num">${stats.anomaly}</span><span class="lbl">Аномалия текстуры</span></div>
      <div class="sim-stat"><span class="num">${stats.messages}</span><span class="lbl">Отправлено сообщений</span></div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("sim-run-btn");
  const resetBtn = document.getElementById("sim-reset-btn");
  const batchBtn = document.getElementById("sim-batch-btn");
  if (!runBtn) return; // скрипт подключён не на той странице

  runBtn.addEventListener("click", simRunAnimated);

  resetBtn.addEventListener("click", () => {
    const log = document.getElementById("sim-log");
    log.innerHTML = "";
    simHighlight(null);
  });

  batchBtn.addEventListener("click", () => {
    const count = Math.min(
      500,
      Math.max(
        1,
        parseInt(document.getElementById("sim-batch-count").value, 10) || 20,
      ),
    );
    const stats = simRunBatch(count);
    simRenderStats(stats);
  });
});
