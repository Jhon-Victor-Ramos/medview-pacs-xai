/* ========================================================================
   CONFIGURAÇÃO DOS CAMINHOS DAS IMAGENS LOCAIS
   ======================================================================== */
const CAMINHO_IMAGEM_RUIM = "img/raio-x-ruim.png";
const CAMINHO_IMAGEM_BOA  = "img/raio-x-bom.png";

// Estado atual do protocolo (1 = Inicial, 2 = Modal Alerta, 3 = Painel XAI)
let currentState = 1;
// Modo de visualização atual ("original", "enhanced", "both")
let currentViewMode = "original";

// Estado das ferramentas da barra lateral
let isInverted = false;
let isZoomed = false;
let contrastPreset = 0;

// Referências do DOM
const imgBad            = document.getElementById("xray-img-bad");
const imgGood           = document.getElementById("xray-img-good");
const stageOriginal     = document.getElementById("stage-original");
const stageEnhanced     = document.getElementById("stage-enhanced");
const comparisonWrapper = document.getElementById("comparison-wrapper");

const alertModal        = document.getElementById("alert-modal");
const xaiPanel          = document.getElementById("xai-panel");
const heatmapSlider     = document.getElementById("heatmap-slider");
const sliderPercentage  = document.getElementById("slider-percentage");

const pacsSeriesStatus  = document.getElementById("pacs-series-status");
const dicomAcqNote      = document.getElementById("dicom-acquisition-note");
const dicomFilterTag    = document.getElementById("dicom-filter-tag");
const dicomWlNote       = document.getElementById("dicom-wl-note");
const dicomZoomNote     = document.getElementById("dicom-zoom-note");

const toggleBtns        = document.querySelectorAll(".stage-toggle-btn");
const heatmaps          = document.querySelectorAll(".heatmap-sync");
const roiRings          = document.querySelectorAll(".roi-sync");

const toolWl            = document.getElementById("tool-wl");
const toolZoom          = document.getElementById("tool-zoom");
const toolInvert        = document.getElementById("tool-invert");
const toolXai           = document.getElementById("tool-xai");

/**
 * Fallback SVG caso os arquivos .png não sejam encontrados na pasta img/
 */
function generatePlaceholderSVG(isGoodImage) {
  const noiseOpacity = isGoodImage ? "0.04" : "0.42";
  const boneContrast = isGoodImage ? "#d4d4d8" : "#52525b";
  const bgTone       = isGoodImage ? "#09090b" : "#18181b";
  const label        = isGoodImage
    ? "ENHANCED: img/raio-x-bom.png"
    : "ORIGINAL: img/raio-x-ruim.png";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="640" viewBox="0 0 600 640">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="${bgTone}"/>
    <g stroke="${boneContrast}" stroke-linecap="round" opacity="${isGoodImage ? 0.88 : 0.35}">
      <line x1="300" y1="80" x2="280" y2="360" stroke-width="46"/>
      <line x1="280" y1="360" x2="255" y2="560" stroke-width="34"/>
      <line x1="310" y1="365" x2="335" y2="555" stroke-width="26"/>
      <circle cx="290" cy="360" r="38" fill="${boneContrast}" stroke="none"/>
      ${isGoodImage ? '<path d="M262 348 L308 368" stroke="#09090b" stroke-width="3.5"/>' : ''}
    </g>
    <rect width="100%" height="100%" filter="url(#noise)" opacity="${noiseOpacity}"/>
    <text x="50%" y="615" fill="#71717a" font-family="monospace" font-size="12" text-anchor="middle">${label}</text>
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

imgBad.addEventListener("error", function () { this.src = generatePlaceholderSVG(false); });
imgGood.addEventListener("error", function () { this.src = generatePlaceholderSVG(true); });

/**
 * 1. CONTROLE DE VISUALIZAÇÃO (ORIGINAL | ENHANCED | BOTH LADO A LADO)
 * Funciona a qualquer momento (Estados 1, 2 ou 3)
 */
function setViewMode(mode) {
  currentViewMode = mode;

  // Atualiza botão ativo no Toggle Superior
  toggleBtns.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === mode);
  });

  if (mode === "original") {
    comparisonWrapper.classList.remove("side-by-side");
    stageOriginal.classList.remove("hidden-stage");
    stageEnhanced.classList.add("hidden-stage");
    dicomFilterTag.textContent = "FILTRO: NENHUM (ORIGINAL RAW)";
  } 
  else if (mode === "enhanced") {
    comparisonWrapper.classList.remove("side-by-side");
    stageOriginal.classList.add("hidden-stage");
    stageEnhanced.classList.remove("hidden-stage");
    dicomFilterTag.textContent = "FILTRO: DENOISE IA APLICADO";
  } 
  else if (mode === "both") {
    // Mostra AMBAS as imagens lado a lado para comparação clínica!
    comparisonWrapper.classList.add("side-by-side");
    stageOriginal.classList.remove("hidden-stage");
    stageEnhanced.classList.remove("hidden-stage");
    dicomFilterTag.textContent = "MODO: COMPARAÇÃO LADO A LADO (RAW vs IA)";
  }

  updateHeatmapVisibility();
}

toggleBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const selectedMode = btn.getAttribute("data-view");
    setViewMode(selectedMode);
  });
});

/**
 * Sincroniza a exibição da mancha do Mapa de Calor conforme o Estado atual
 */
function updateHeatmapVisibility() {
  const showXaiOverlay = (currentState === 3);

  heatmaps.forEach(el => {
    el.classList.toggle("visible-block", showXaiOverlay);
  });
  roiRings.forEach(el => {
    el.classList.toggle("visible-block", showXaiOverlay);
  });
}

/**
 * 2. TRANSIÇÃO ENTRE OS 3 ESTADOS DO PROTOCOLO (MÁGICO DE OZ + CLIQUES)
 */
function renderState(state) {
  currentState = state;

  if (state === 1) {
    alertModal.classList.remove("visible-flex");
    xaiPanel.classList.remove("visible-block");
    toolXai.classList.add("btn-pulse-alert");
    toolXai.classList.remove("active");

    setViewMode("original");
    pacsSeriesStatus.textContent = "SÉRIE: 01/01 • RAW";
    dicomAcqNote.textContent     = "ACQ: DR SUBEXPOSED (SNR BAIXO)";
  } 
  else if (state === 2) {
    alertModal.classList.add("visible-flex");
    xaiPanel.classList.remove("visible-block");
    toolXai.classList.remove("btn-pulse-alert");
    toolXai.classList.add("active");

    pacsSeriesStatus.textContent = "SÉRIE: 01/01 • QA ALERT";
  } 
  else if (state === 3) {
    alertModal.classList.remove("visible-flex");
    xaiPanel.classList.add("visible-block");
    toolXai.classList.remove("btn-pulse-alert");
    toolXai.classList.add("active");

    // Ao entrar no Estado 3, muda para "Enhanced" (ou mantém "Both" se já estiver nele)
    if (currentViewMode === "original") {
      setViewMode("enhanced");
    } else {
      updateHeatmapVisibility();
    }

    // Garante que o painel lateral comece na aba principal do Slider
    document.getElementById("xai-view-main").style.display = "block";
    document.getElementById("xai-view-chat").style.display = "none";

    pacsSeriesStatus.textContent = "SÉRIE: 01/01 • XAI ENHANCED";
    dicomAcqNote.textContent     = "ACQ: RESTAURAÇÃO XAI + GRAD-CAM";
  }

  updateHeatmapVisibility();
}

/**
 * 3. ATALHOS DO MÁGICO DE OZ (SETA DIREITA / SETA ESQUERDA) E CLIQUES REAIS
 */
window.addEventListener("keydown", function (event) {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (currentState < 3) renderState(currentState + 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (currentState > 1) renderState(currentState - 1);
  }
});

// Clique no botão XAI da barra lateral
toolXai.addEventListener("click", () => {
  if (currentState === 1) renderState(2);
  else if (currentState === 2) renderState(3);
  else renderState(1);
});

// Cliques nos botões do Modal (Estado 2)
document.getElementById("btn-modal-apply").addEventListener("click", () => {
  renderState(3);
});
document.getElementById("btn-modal-cancel").addEventListener("click", () => {
  renderState(1);
});

/**
 * 4. SLIDER DE OPACIDADE EM TEMPO REAL (0 A 100%)
 */
heatmapSlider.addEventListener("input", function (event) {
  const val = Number(event.target.value);
  const normalizedOpacity = val / 100;

  heatmaps.forEach(h => { h.style.opacity = normalizedOpacity; });
  roiRings.forEach(r => { r.style.opacity = Math.min(normalizedOpacity * 1.2, 1); });
  sliderPercentage.textContent = `${val}%`;
});

/**
 * 5. CHAT DE SEGUNDA OPINIÃO HUMANA (TELERADIOLOGIA)
 */
document.getElementById("btn-call-human").addEventListener("click", () => {
  document.getElementById("xai-view-main").style.display = "none";
  document.getElementById("xai-view-chat").style.display = "flex";
  document.getElementById("chat-typing").style.display = "block";
  document.getElementById("chat-reply").style.display = "none";

  setTimeout(() => {
    document.getElementById("chat-typing").style.display = "none";
    document.getElementById("chat-reply").style.display = "block";
  }, 1800);
});

document.getElementById("btn-back-xai").addEventListener("click", () => {
  document.getElementById("xai-view-chat").style.display = "none";
  document.getElementById("xai-view-main").style.display = "block";
});

/**
 * 6. FERRAMENTAS RADIOLÓGICAS EXTRAS (W/L, ZOOM, INVERTER)
 */
function applyRadiologyFilters() {
  const contrastValues = [
    { filter: "contrast(1) brightness(1)", label: "W: 2048  L: 1024" },
    { filter: "contrast(1.35) brightness(1.08)", label: "W: 1400  L: 850 (OSSO)" },
    { filter: "contrast(0.85) brightness(1.18)", label: "W: 2800  L: 1300 (PARTES MOLES)" }
  ];
  const preset = contrastValues[contrastPreset];
  const invertStr = isInverted ? " invert(1)" : "";

  [imgBad, imgGood].forEach(img => {
    img.style.filter = `${preset.filter}${invertStr}`;
    img.classList.toggle("zoomed", isZoomed);
  });

  dicomWlNote.textContent = preset.label;
  dicomZoomNote.textContent = isZoomed ? "ZOOM: 135%" : "ZOOM: 100%";
}

toolInvert.addEventListener("click", () => {
  isInverted = !isInverted;
  toolInvert.classList.toggle("active", isInverted);
  applyRadiologyFilters();
});

toolZoom.addEventListener("click", () => {
  isZoomed = !isZoomed;
  toolZoom.classList.toggle("active", isZoomed);
  applyRadiologyFilters();
});

toolWl.addEventListener("click", () => {
  contrastPreset = (contrastPreset + 1) % 3;
  applyRadiologyFilters();
});

/**
 * 7. CALIBRAÇÃO COM SHIFT + CLIQUE (SINCRONIZADA NAS DUAS IMAGENS)
 * Move tanto o Mapa de Calor quanto o Ícone (i) para o ponto clicado.
 */
[stageOriginal, stageEnhanced].forEach(stage => {
  stage.addEventListener("click", function (event) {
    if (!event.shiftKey) return;

    const rect = stage.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;

    document.documentElement.style.setProperty("--heatmap-left", `${clickX.toFixed(1)}%`);
    document.documentElement.style.setProperty("--heatmap-top", `${clickY.toFixed(1)}%`);

    console.info(
      `[Calibração XAI] Posição atualizada -> --heatmap-top: ${clickY.toFixed(1)}%; --heatmap-left: ${clickX.toFixed(1)}%;`
    );
  });
});

// Inicializa o sistema no Estado 1
renderState(1);