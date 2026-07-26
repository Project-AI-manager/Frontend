"use client";

import { useEffect, useRef } from "react";
import type { JSX } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------
   «Орбитальный автопилот» — главная 3D-сцена лендинга.

   Смысл: обращения из четырёх каналов сходятся в ядро, ядро отвечает
   светлыми импульсами обратно, один янтарный импульс уходит человеку.
   Палитра и настроение — светлый корпоративный стиль дизайн-системы.

   Плотность важнее эффектов: сцена стоит рядом с плотным чёрным
   заголовком, поэтому ядро должно читаться как объект, а орбиты — как
   линии, а не как призрак линий.
   ------------------------------------------------------------------ */

/* ---------- Палитра (те же токены, что в globals.css) ---------- */

const COLOR_BRAND = 0x2463eb;
const COLOR_BRAND_DARK = 0x1546ad;
const COLOR_BRAND_LIGHT = 0x9db7f4;
const COLOR_LINE = 0xd9e1ec;
const COLOR_LINE_SOFT = 0xe5eaf1;
const COLOR_BRAND_SOFT = 0xeaf1ff;
const COLOR_AMBER = 0xe89120;
const COLOR_PAGE = 0xffffff;

/* ---------- Компоновка сцены ---------- */

/** Радиус, который камера обязана уместить в кадр при любой пропорции.
    Подобран под внешнее кольцо: оно занимает ~94% половины кадра, так что
    сцена стоит уверенно, но не упирается в рамку .frame-3d при параллаксе. */
const FIT_RADIUS = 4.12;
const CAMERA_FOV = 40;
const CORE_RADIUS = 1.26;
/** Внешнее кольцо-горизонт: визуальная граница системы. */
const HORIZON_RADIUS = 3.9;

/** Точка «менеджер-человек» — куда уходит янтарная эскалация.
    Вынесена выше орбитального пояса и ближе к камере (+z), чтобы туман
    её не съедал и маршрут читался целиком. */
const HUMAN_POINT = new THREE.Vector3(2.6, 2.48, 0.86);

/** Частиц-обращений на канал и светлых импульсов-ответов на канал. */
const INCOMING_PER_CHANNEL = 20;
const OUTGOING_PER_CHANNEL = 3;
/** Длина светлого импульса-ответа в долях траектории. */
const OUTGOING_TAIL = 0.18;

/** Ритм эскалации: раз в ESCALATION_PERIOD секунд, полёт — ESCALATION_TRAVEL.
    Период короче, а полёт длиннее, чем «мигание»: импульс должен успевать
    прочитаться как событие, а не мелькнуть точкой. */
const ESCALATION_PERIOD = 5.8;
const ESCALATION_TRAVEL = 2.05;
const ESCALATION_OFFSET = 0.55;
/** Узлов хвоста и его длина в долях траектории. */
const ESCALATION_TRAIL = 26;
const ESCALATION_TRAIL_SPAN = 0.4;

/** Кадр, который рисуется один раз при prefers-reduced-motion.
    Момент выбран так, чтобы янтарный импульс стоял в середине маршрута. */
const STATIC_FRAME_TIME = 0.51;

/* ---------- Толщины штрихов (мировые единицы) ----------
   GL-линия всегда рисуется в один аппаратный пиксель, поэтому на retina
   она вырождается в полпикселя CSS — отсюда «еле различимые» дуги.
   Все значимые штрихи собраны из треугольников: ширина задана в мире и
   масштабируется вместе со сценой. */
const ORBIT_HALF_WIDTH = 0.0135;
const OUTGOING_HALF_WIDTH = 0.019;
const ESCALATION_HEAD_HALF_WIDTH = 0.026;
const ESCALATION_TAIL_HALF_WIDTH = 0.004;
const GUIDE_HALF_WIDTH = 0.014;

type ChannelConfig = {
  /** Радиус орбиты. */
  radius: number;
  /** Наклон плоскости орбиты. */
  tiltX: number;
  tiltZ: number;
  /** Угловая скорость, рад/с (полный оборот — 27…38 с). */
  speed: number;
  /** Начальный угол. */
  phase: number;
  /** Выгиб траектории потока: поток идёт дугой, а не по прямой. */
  bend: number;
};

const TAU = Math.PI * 2;

/* Наклоны подобраны так, чтобы: (1) ни одно кольцо не вставало «с ребра»
   и не резало кадр прямой линией, (2) четыре канала не слипались в полосу.
   Радиусы разведены шире прежнего: внешняя орбита подходит к горизонту,
   и между поясом и границей системы не остаётся пустого кольца.
   Фазы просчитаны под равномерное распределение точек в течение всего цикла. */
const CHANNELS: readonly ChannelConfig[] = [
  { radius: 2.62, tiltX: 0.95, tiltZ: 0.12, speed: TAU / 31, phase: 2.49, bend: 0.38 },
  { radius: 2.98, tiltX: -0.55, tiltZ: 0.45, speed: -TAU / 38, phase: 0, bend: -0.46 },
  { radius: 3.3, tiltX: 0.6, tiltZ: -0.62, speed: TAU / 27, phase: 6.15, bend: 0.42 },
  { radius: 3.62, tiltX: -0.75, tiltZ: -0.15, speed: -TAU / 35, phase: 1.96, bend: -0.34 },
];

/* ---------- Мелкие математические помощники ---------- */

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Детерминированный ГПСЧ — чтобы разброс частиц был стабильным между сборками. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Квадратичная кривая Безье — общая форма всех потоков сцены. */
function evaluateBezier(
  out: THREE.Vector3,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  u: number,
): THREE.Vector3 {
  const inv = 1 - u;
  const a = inv * inv;
  const b = 2 * inv * u;
  const c = u * u;
  out.set(
    a * p0.x + b * p1.x + c * p2.x,
    a * p0.y + b * p1.y + c * p2.y,
    a * p0.z + b * p1.z + c * p2.z,
  );
  return out;
}

/* ---------- Штрихи-ленты ----------
   Камера почти неподвижна и смотрит вдоль -Z, поэтому «поперёк штриха»
   достаточно считать через векторное произведение с осью взгляда:
   лента всегда развёрнута к зрителю и держит заданную толщину. */

const VIEW_AXIS = new THREE.Vector3(0, 0, 1);
const quadDirection = new THREE.Vector3();
const quadNormal = new THREE.Vector3();

/** Индексы для набора независимых четырёхугольников: по 4 вершины на штрих. */
function createQuadIndices(quadCount: number): Uint16Array {
  const indices = new Uint16Array(quadCount * 6);
  for (let q = 0; q < quadCount; q += 1) {
    const v = q * 4;
    indices[q * 6] = v;
    indices[q * 6 + 1] = v + 1;
    indices[q * 6 + 2] = v + 2;
    indices[q * 6 + 3] = v + 2;
    indices[q * 6 + 4] = v + 1;
    indices[q * 6 + 5] = v + 3;
  }
  return indices;
}

/** Индексы для сплошной ленты: соседние звенья делят пару вершин. */
function createStripIndices(segmentCount: number): Uint16Array {
  const indices = new Uint16Array(segmentCount * 6);
  for (let s = 0; s < segmentCount; s += 1) {
    const v = s * 2;
    indices[s * 6] = v;
    indices[s * 6 + 1] = v + 1;
    indices[s * 6 + 2] = v + 2;
    indices[s * 6 + 3] = v + 2;
    indices[s * 6 + 4] = v + 1;
    indices[s * 6 + 5] = v + 3;
  }
  return indices;
}

/** Записывает один штрих: голова `head`, хвост `tail`, своя ширина и цвет с обоих концов. */
function writeRibbonQuad(
  positions: Float32Array,
  colors: Float32Array,
  quad: number,
  head: THREE.Vector3,
  tail: THREE.Vector3,
  headHalfWidth: number,
  tailHalfWidth: number,
  headColor: THREE.Color,
  headAlpha: number,
  tailColor: THREE.Color,
  tailAlpha: number,
): void {
  quadDirection.subVectors(head, tail);
  const degenerate = quadDirection.lengthSq() < 1e-8;
  quadNormal.crossVectors(quadDirection, VIEW_AXIS);
  if (quadNormal.lengthSq() < 1e-12) {
    /* Штрих смотрит прямо в камеру — направление поперёк выбираем произвольно. */
    quadNormal.set(1, 0, 0);
  } else {
    quadNormal.normalize();
  }
  /* Схлопнувшееся звено (голова догнала хвост в начале маршрута) не должно
     оставлять пятно: гасим его полностью. */
  const headOpacity = degenerate ? 0 : headAlpha;
  const tailOpacity = degenerate ? 0 : tailAlpha;

  const p = quad * 12;
  positions[p] = head.x + quadNormal.x * headHalfWidth;
  positions[p + 1] = head.y + quadNormal.y * headHalfWidth;
  positions[p + 2] = head.z + quadNormal.z * headHalfWidth;
  positions[p + 3] = head.x - quadNormal.x * headHalfWidth;
  positions[p + 4] = head.y - quadNormal.y * headHalfWidth;
  positions[p + 5] = head.z - quadNormal.z * headHalfWidth;
  positions[p + 6] = tail.x + quadNormal.x * tailHalfWidth;
  positions[p + 7] = tail.y + quadNormal.y * tailHalfWidth;
  positions[p + 8] = tail.z + quadNormal.z * tailHalfWidth;
  positions[p + 9] = tail.x - quadNormal.x * tailHalfWidth;
  positions[p + 10] = tail.y - quadNormal.y * tailHalfWidth;
  positions[p + 11] = tail.z - quadNormal.z * tailHalfWidth;

  const c = quad * 16;
  for (let i = 0; i < 2; i += 1) {
    colors[c + i * 4] = headColor.r;
    colors[c + i * 4 + 1] = headColor.g;
    colors[c + i * 4 + 2] = headColor.b;
    colors[c + i * 4 + 3] = headOpacity;
  }
  for (let i = 2; i < 4; i += 1) {
    colors[c + i * 4] = tailColor.r;
    colors[c + i * 4 + 1] = tailColor.g;
    colors[c + i * 4 + 2] = tailColor.b;
    colors[c + i * 4 + 3] = tailOpacity;
  }
}

/** Круглый спрайт для точек: без него WebGL рисует квадраты. */
function createDotTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.66, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(32, 32, 32, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  /* Мипмапы для point-sprite выбираются некорректно и превращают точку
     в равномерный квадрат — отключаем их и фильтруем линейно. */
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/** Мягкое пятно: ореол вокруг ядра и вокруг головы янтарного импульса.
    Спад подобран длинным — это спокойное свечение, а не bloom. */
function createGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.56)");
    gradient.addColorStop(0.62, "rgba(255,255,255,0.26)");
    gradient.addColorStop(0.82, "rgba(255,255,255,0.08)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/* ---------- Статичный запасной вариант, если WebGL недоступен ---------- */

function StaticFallback(): JSX.Element {
  return (
    <svg
      viewBox="0 0 520 520"
      className="block h-full w-full"
      role="presentation"
      focusable="false"
    >
      {/* Дальние дуги — светлые, ближние — заметно темнее: та же глубина, что в 3D. */}
      <g fill="none" stroke="#e5eaf1" strokeWidth="1.4">
        <ellipse cx="260" cy="260" rx="196" ry="76" transform="rotate(-14 260 260)" />
        <ellipse cx="260" cy="260" rx="168" ry="128" transform="rotate(22 260 260)" />
        <ellipse cx="260" cy="260" rx="212" ry="106" transform="rotate(64 260 260)" />
      </g>
      <g fill="none" stroke="#9db7f4" strokeWidth="1.7" strokeLinecap="round">
        <path d="M64 306 A 196 76 -14 0 0 456 306" />
        <path d="M118 344 A 168 128 22 0 0 402 344" />
        <path d="M72 322 A 212 106 64 0 0 448 322" />
      </g>
      <circle cx="260" cy="260" r="94" fill="#eaf1ff" />
      <circle cx="260" cy="260" r="94" fill="none" stroke="#9db7f4" strokeWidth="1.5" />
      <circle cx="260" cy="260" r="66" fill="none" stroke="#2463eb" opacity="0.4" />
      <g fill="#2463eb">
        <circle cx="228" cy="212" r="3" />
        <circle cx="268" cy="204" r="3" />
        <circle cx="304" cy="228" r="3" />
        <circle cx="316" cy="266" r="3" />
        <circle cx="298" cy="304" r="3" />
        <circle cx="260" cy="322" r="3" />
        <circle cx="220" cy="308" r="3" />
        <circle cx="200" cy="270" r="3" />
        <circle cx="244" cy="248" r="3" />
        <circle cx="284" cy="262" r="3" />
        <circle cx="256" cy="284" r="3" />
      </g>
      <g fill="#1546ad">
        <circle cx="260" cy="260" r="4" />
        <circle cx="238" cy="272" r="3" />
        <circle cx="276" cy="240" r="3" />
      </g>
      <g fill="none" stroke="#2463eb" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="2 9">
        <path d="M112 214 Q 196 236 250 258" />
        <path d="M408 196 Q 330 226 268 254" />
        <path d="M154 372 Q 210 318 252 274" />
        <path d="M382 350 Q 322 308 272 274" />
      </g>
      <g fill="#2463eb">
        <circle cx="112" cy="214" r="7" />
        <circle cx="408" cy="196" r="7" />
        <circle cx="154" cy="372" r="7" />
        <circle cx="382" cy="350" r="7" />
      </g>
      <g fill="none" stroke="#2463eb" strokeWidth="1.4" opacity="0.5">
        <circle cx="112" cy="214" r="14" />
        <circle cx="408" cy="196" r="14" />
        <circle cx="154" cy="372" r="14" />
        <circle cx="382" cy="350" r="14" />
      </g>
      <path
        d="M298 226 Q 372 172 430 118"
        fill="none"
        stroke="#e89120"
        strokeWidth="1.4"
        strokeDasharray="5 7"
        opacity="0.45"
      />
      <path
        d="M330 202 Q 372 172 412 132"
        fill="none"
        stroke="#e89120"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="430" cy="118" r="7" fill="#e89120" />
      <circle cx="430" cy="118" r="16" fill="none" stroke="#e89120" strokeWidth="1.4" opacity="0.5" />
    </svg>
  );
}

/* ---------- Основной компонент ---------- */

export function AutopilotScene({ className }: { className?: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    /* Ненулевая копия ссылки — её видят вложенные функции цикла. */
    const host: HTMLDivElement = container;

    /* --- Рендерер: прозрачный фон, сквозь него видно белую страницу ---
       Спокойный SVG-фолбэк лежит в разметке и просто прячется, когда
       WebGL поднялся. Если не поднялся — он и остаётся на экране. */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const fallback = fallbackRef.current;
    /* Фолбэк не выбрасывается из разметки, а прячется: если браузер отберёт
       GL-контекст, канвас останется пустым и фолбэк нужно вернуть на экран. */
    function setFallbackVisible(next: boolean): void {
      if (fallback) {
        fallback.style.display = next ? "" : "none";
      }
    }
    setFallbackVisible(false);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "block h-full w-full";
    container.appendChild(renderer.domElement);

    /* --- Учёт ресурсов для честной уборки --- */
    const disposables: Array<{ dispose: () => void }> = [];
    function track<T extends { dispose: () => void }>(resource: T): T {
      disposables.push(resource);
      return resource;
    }

    const scene = new THREE.Scene();
    /* Дальние элементы растворяются в белом — это и есть глубина. */
    scene.fog = new THREE.Fog(COLOR_PAGE, 10, 22);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    /** Корневая группа: её мы качаем параллаксом и медленно вращаем. */
    const root = new THREE.Group();
    scene.add(root);

    const random = createRandom(20260726);
    const dotTexture = track(createDotTexture());
    const glowTexture = track(createGlowTexture());

    /* --- Цвета сцены как объекты: используются и при сборке, и в цикле. --- */
    const brandColor = new THREE.Color(COLOR_BRAND);
    const brandDarkColor = new THREE.Color(COLOR_BRAND_DARK);
    const brandLightColor = new THREE.Color(COLOR_BRAND_LIGHT);
    const lineSoftColor = new THREE.Color(COLOR_LINE_SOFT);
    const amberColor = new THREE.Color(COLOR_AMBER);
    const workColor = new THREE.Color();
    const workColorAlt = new THREE.Color();

    /* ================= Ядро ================= */

    const core = new THREE.Group();
    root.add(core);

    /* Ореол: спокойное свечение, которое отделяет ядро от паутины орбит. */
    const coreGlowMaterial = track(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: workColor.copy(brandLightColor).lerp(brandColor, 0.16).getHex(),
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        fog: false,
      }),
    );
    const coreGlow = new THREE.Sprite(coreGlowMaterial);
    coreGlow.scale.setScalar(CORE_RADIUS * 4.7);
    coreGlow.renderOrder = 2;
    core.add(coreGlow);

    /* Тело ядра: плотная светло-синяя заливка, на которой читаются точки. */
    const coreBodyGeometry = track(new THREE.SphereGeometry(CORE_RADIUS * 0.9, 32, 24));
    const coreBodyMaterial = track(
      new THREE.MeshBasicMaterial({
        color: workColor.set(COLOR_BRAND_SOFT).lerp(brandLightColor, 0.24).getHex(),
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    );
    const coreBody = new THREE.Mesh(coreBodyGeometry, coreBodyMaterial);
    coreBody.renderOrder = 3;
    core.add(coreBody);

    /* Геодезический каркас — силуэт остаётся сферой, а не кристаллом. */
    const coreShellGeometry = new THREE.IcosahedronGeometry(CORE_RADIUS, 1);
    const coreEdgesGeometry = track(new THREE.EdgesGeometry(coreShellGeometry));
    coreShellGeometry.dispose();
    const coreEdgesMaterial = track(
      new THREE.LineBasicMaterial({
        color: COLOR_BRAND_LIGHT,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    const coreEdges = new THREE.LineSegments(coreEdgesGeometry, coreEdgesMaterial);
    coreEdges.renderOrder = 4;
    core.add(coreEdges);

    /* Точечная оболочка — «ядро собрано из точек». Детализация 3 (642 узла)
       вместо 2: шаг между точками вдвое мельче, ядро перестаёт быть дымкой.
       uv/normal удаляем: с uv three берёт цвет спрайта по вершинной UV,
       и круглая точка вырождается в квадрат. */
    const corePointsGeometry = track(new THREE.IcosahedronGeometry(CORE_RADIUS * 0.995, 3));
    corePointsGeometry.deleteAttribute("uv");
    corePointsGeometry.deleteAttribute("normal");
    const corePointsMaterial = track(
      new THREE.PointsMaterial({
        color: COLOR_BRAND,
        map: dotTexture,
        size: 0.1,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    );
    const corePoints = new THREE.Points(corePointsGeometry, corePointsMaterial);
    corePoints.renderOrder = 5;
    core.add(corePoints);

    /* Внутренняя оболочка: тёмный синий в глубине даёт ядру объём. */
    const coreInnerGeometry = track(new THREE.IcosahedronGeometry(CORE_RADIUS * 0.62, 2));
    coreInnerGeometry.deleteAttribute("uv");
    coreInnerGeometry.deleteAttribute("normal");
    const coreInnerMaterial = track(
      new THREE.PointsMaterial({
        color: COLOR_BRAND_DARK,
        map: dotTexture,
        size: 0.09,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    const coreInnerPoints = new THREE.Points(coreInnerGeometry, coreInnerMaterial);
    coreInnerPoints.renderOrder = 5;
    core.add(coreInnerPoints);

    /* Плоское кольцо вокруг ядра — «прицел», смотрит в камеру. */
    const coreRingGeometry = track(
      new THREE.RingGeometry(CORE_RADIUS * 1.3, CORE_RADIUS * 1.319, 128),
    );
    const coreRingMaterial = track(
      new THREE.MeshBasicMaterial({
        color: workColor.copy(brandLightColor).lerp(brandColor, 0.45).getHex(),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const coreRing = new THREE.Mesh(coreRingGeometry, coreRingMaterial);
    coreRing.renderOrder = 5;
    root.add(coreRing);

    /* ================= Орбиты и точки-каналы ================= */

    type ChannelRuntime = {
      config: ChannelConfig;
      /** Ориентация плоскости орбиты. */
      quaternion: THREE.Quaternion;
      /** Нормаль плоскости орбиты — вокруг неё считается выгиб дуги. */
      normal: THREE.Vector3;
      node: THREE.Mesh;
      /** Текущая позиция канала. */
      position: THREE.Vector3;
      /** Опорная точка кривой Безье «канал → ядро» (входящий поток). */
      control: THREE.Vector3;
      /** Зеркальная опорная точка «ядро → канал» (ответы идут своей дугой). */
      controlOut: THREE.Vector3;
      /** Точка входа в ядро. */
      target: THREE.Vector3;
    };

    /* Общие ресурсы точек-каналов. */
    const nodeGeometry = track(new THREE.SphereGeometry(0.075, 16, 12));
    const nodeMaterial = track(new THREE.MeshBasicMaterial({ color: COLOR_BRAND }));
    const nodeRingGeometry = track(new THREE.RingGeometry(0.142, 0.164, 44));
    const nodeRingMaterial = track(
      new THREE.MeshBasicMaterial({
        color: COLOR_BRAND,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );

    /* Орбита — лента, а не GL-линия: ближняя к камере половина заметно темнее
       дальней, и кольцо само по себе рисует глубину. */
    const orbitNearColor = new THREE.Color(COLOR_BRAND_LIGHT).lerp(brandColor, 0.3);
    const orbitFarColor = lineSoftColor;
    const orbitMaterial = track(
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );

    const ORBIT_SEGMENTS = 200;
    const orbitIndices = createStripIndices(ORBIT_SEGMENTS);
    const orbitPoint = new THREE.Vector3();
    const orbitOutward = new THREE.Vector3();

    const channels: ChannelRuntime[] = CHANNELS.map((config) => {
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(config.tiltX, 0, config.tiltZ),
      );

      const vertexCount = (ORBIT_SEGMENTS + 1) * 2;
      const ringPositions = new Float32Array(vertexCount * 3);
      const ringColors = new Float32Array(vertexCount * 4);
      for (let i = 0; i <= ORBIT_SEGMENTS; i += 1) {
        const angle = (i / ORBIT_SEGMENTS) * TAU;
        orbitPoint
          .set(Math.cos(angle) * config.radius, 0, Math.sin(angle) * config.radius)
          .applyQuaternion(quaternion);
        orbitOutward.copy(orbitPoint).normalize();

        /* Глубина берётся из z: кольцо почти не крутится, поэтому цвет можно
           запечь один раз и не трогать в цикле. */
        const depth = smoothstep(-0.8, 0.8, orbitPoint.z / config.radius);
        workColor.copy(orbitFarColor).lerp(orbitNearColor, depth);
        const alpha = 0.45 + 0.55 * depth;

        for (let side = 0; side < 2; side += 1) {
          const offset = side === 0 ? ORBIT_HALF_WIDTH : -ORBIT_HALF_WIDTH;
          const v = i * 2 + side;
          ringPositions[v * 3] = orbitPoint.x + orbitOutward.x * offset;
          ringPositions[v * 3 + 1] = orbitPoint.y + orbitOutward.y * offset;
          ringPositions[v * 3 + 2] = orbitPoint.z + orbitOutward.z * offset;
          ringColors[v * 4] = workColor.r;
          ringColors[v * 4 + 1] = workColor.g;
          ringColors[v * 4 + 2] = workColor.b;
          ringColors[v * 4 + 3] = alpha;
        }
      }
      const ringGeometry = track(new THREE.BufferGeometry());
      ringGeometry.setAttribute("position", new THREE.BufferAttribute(ringPositions, 3));
      ringGeometry.setAttribute("color", new THREE.BufferAttribute(ringColors, 4));
      ringGeometry.setIndex(new THREE.BufferAttribute(orbitIndices, 1));
      const ring = new THREE.Mesh(ringGeometry, orbitMaterial);
      ring.renderOrder = 1;
      root.add(ring);

      /* Точка-канал: шарик плюс кольцо-ореол. */
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.renderOrder = 6;
      const nodeRing = new THREE.Mesh(nodeRingGeometry, nodeRingMaterial);
      nodeRing.renderOrder = 6;
      node.add(nodeRing);
      root.add(node);

      return {
        config,
        quaternion,
        normal: new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion).normalize(),
        node,
        position: new THREE.Vector3(),
        control: new THREE.Vector3(),
        controlOut: new THREE.Vector3(),
        target: new THREE.Vector3(),
      };
    });

    /* ================= Входящий поток обращений ================= */

    const incomingCount = channels.length * INCOMING_PER_CHANNEL;
    const incomingPositions = new Float32Array(incomingCount * 3);
    const incomingColors = new Float32Array(incomingCount * 4);
    const incomingProgress = new Float32Array(incomingCount);
    const incomingSpeed = new Float32Array(incomingCount);
    const incomingChannel = new Uint8Array(incomingCount);

    for (let c = 0; c < channels.length; c += 1) {
      for (let k = 0; k < INCOMING_PER_CHANNEL; k += 1) {
        const index = c * INCOMING_PER_CHANNEL + k;
        incomingChannel[index] = c;
        incomingProgress[index] = (k + random() * 0.85) / INCOMING_PER_CHANNEL;
        /* Полёт обращения занимает 4.5–7 секунд — движение спокойное. */
        incomingSpeed[index] = 0.145 + random() * 0.075;
      }
    }

    const incomingGeometry = track(new THREE.BufferGeometry());
    const incomingPositionAttribute = new THREE.BufferAttribute(incomingPositions, 3);
    const incomingColorAttribute = new THREE.BufferAttribute(incomingColors, 4);
    incomingPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    incomingColorAttribute.setUsage(THREE.DynamicDrawUsage);
    incomingGeometry.setAttribute("position", incomingPositionAttribute);
    incomingGeometry.setAttribute("color", incomingColorAttribute);
    const incomingMaterial = track(
      new THREE.PointsMaterial({
        map: dotTexture,
        size: 0.16,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    );
    const incomingPoints = new THREE.Points(incomingGeometry, incomingMaterial);
    incomingPoints.frustumCulled = false;
    incomingPoints.renderOrder = 6;
    root.add(incomingPoints);

    /* ================= Ответы: ровные светлые импульсы ================= */

    const outgoingCount = channels.length * OUTGOING_PER_CHANNEL;
    const outgoingPositions = new Float32Array(outgoingCount * 4 * 3);
    const outgoingColors = new Float32Array(outgoingCount * 4 * 4);
    const outgoingProgress = new Float32Array(outgoingCount);
    const outgoingSpeed = new Float32Array(outgoingCount);
    const outgoingChannel = new Uint8Array(outgoingCount);

    for (let c = 0; c < channels.length; c += 1) {
      for (let k = 0; k < OUTGOING_PER_CHANNEL; k += 1) {
        const index = c * OUTGOING_PER_CHANNEL + k;
        outgoingChannel[index] = c;
        /* Ответы идут ровно, с одинаковым шагом — это порядок, а не хаос. */
        outgoingProgress[index] = k / OUTGOING_PER_CHANNEL + c * 0.07;
        outgoingSpeed[index] = 0.33;
      }
    }

    const outgoingGeometry = track(new THREE.BufferGeometry());
    const outgoingPositionAttribute = new THREE.BufferAttribute(outgoingPositions, 3);
    const outgoingColorAttribute = new THREE.BufferAttribute(outgoingColors, 4);
    outgoingPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    outgoingColorAttribute.setUsage(THREE.DynamicDrawUsage);
    outgoingGeometry.setAttribute("position", outgoingPositionAttribute);
    outgoingGeometry.setAttribute("color", outgoingColorAttribute);
    outgoingGeometry.setIndex(new THREE.BufferAttribute(createQuadIndices(outgoingCount), 1));
    const outgoingMaterial = track(
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const outgoingRibbons = new THREE.Mesh(outgoingGeometry, outgoingMaterial);
    outgoingRibbons.frustumCulled = false;
    outgoingRibbons.renderOrder = 6;
    root.add(outgoingRibbons);

    /* Голова импульса-ответа: точка, чтобы штрих читался и на retina. */
    const outgoingHeadPositions = new Float32Array(outgoingCount * 3);
    const outgoingHeadColors = new Float32Array(outgoingCount * 4);
    const outgoingHeadGeometry = track(new THREE.BufferGeometry());
    const outgoingHeadPositionAttribute = new THREE.BufferAttribute(outgoingHeadPositions, 3);
    const outgoingHeadColorAttribute = new THREE.BufferAttribute(outgoingHeadColors, 4);
    outgoingHeadPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    outgoingHeadColorAttribute.setUsage(THREE.DynamicDrawUsage);
    outgoingHeadGeometry.setAttribute("position", outgoingHeadPositionAttribute);
    outgoingHeadGeometry.setAttribute("color", outgoingHeadColorAttribute);
    const outgoingHeadMaterial = track(
      new THREE.PointsMaterial({
        map: dotTexture,
        size: 0.12,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    );
    const outgoingHeads = new THREE.Points(outgoingHeadGeometry, outgoingHeadMaterial);
    outgoingHeads.frustumCulled = false;
    outgoingHeads.renderOrder = 6;
    root.add(outgoingHeads);

    /* ================= Эскалация человеку (янтарная) ================= */

    /* Точка входа в ядро и опорная точка для дуги к человеку. */
    const humanDirection = HUMAN_POINT.clone().normalize();
    const escalationStart = humanDirection.clone().multiplyScalar(CORE_RADIUS * 0.96);
    const escalationControl = escalationStart
      .clone()
      .add(HUMAN_POINT)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(-0.42, 0.66, 0.3));

    /* Пунктирная направляющая — маршрут читается и между импульсами.
       Это часть той же янтарной истории, других тёплых акцентов в сцене нет. */
    const dashCount = 13;
    const dashPositions = new Float32Array(dashCount * 4 * 3);
    const dashColors = new Float32Array(dashCount * 4 * 4);
    const dashHead = new THREE.Vector3();
    const dashTail = new THREE.Vector3();
    for (let i = 0; i < dashCount; i += 1) {
      const from = 0.02 + (i / dashCount) * 0.96;
      const to = from + 0.042;
      evaluateBezier(dashTail, escalationStart, escalationControl, HUMAN_POINT, from);
      evaluateBezier(dashHead, escalationStart, escalationControl, HUMAN_POINT, to);
      const alpha = 0.34 + 0.24 * (i / (dashCount - 1));
      writeRibbonQuad(
        dashPositions,
        dashColors,
        i,
        dashHead,
        dashTail,
        GUIDE_HALF_WIDTH,
        GUIDE_HALF_WIDTH,
        amberColor,
        alpha,
        amberColor,
        alpha,
      );
    }
    const dashGeometry = track(new THREE.BufferGeometry());
    dashGeometry.setAttribute("position", new THREE.BufferAttribute(dashPositions, 3));
    dashGeometry.setAttribute("color", new THREE.BufferAttribute(dashColors, 4));
    dashGeometry.setIndex(new THREE.BufferAttribute(createQuadIndices(dashCount), 1));
    const dashMaterial = track(
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const dashRoute = new THREE.Mesh(dashGeometry, dashMaterial);
    dashRoute.renderOrder = 1;
    root.add(dashRoute);

    /* Хвост янтарного импульса — сплошная лента с сужением к концу. */
    const escalationQuads = ESCALATION_TRAIL - 1;
    const escalationPositions = new Float32Array(escalationQuads * 4 * 3);
    const escalationColors = new Float32Array(escalationQuads * 4 * 4);
    const escalationGeometry = track(new THREE.BufferGeometry());
    const escalationPositionAttribute = new THREE.BufferAttribute(escalationPositions, 3);
    const escalationColorAttribute = new THREE.BufferAttribute(escalationColors, 4);
    escalationPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    escalationColorAttribute.setUsage(THREE.DynamicDrawUsage);
    escalationGeometry.setAttribute("position", escalationPositionAttribute);
    escalationGeometry.setAttribute("color", escalationColorAttribute);
    escalationGeometry.setIndex(new THREE.BufferAttribute(createQuadIndices(escalationQuads), 1));
    const escalationMaterial = track(
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const escalationTrail = new THREE.Mesh(escalationGeometry, escalationMaterial);
    escalationTrail.frustumCulled = false;
    escalationTrail.renderOrder = 8;
    escalationTrail.visible = false;
    root.add(escalationTrail);

    /* Голова импульса и её ореол. */
    const escalationHeadGeometry = track(new THREE.SphereGeometry(0.082, 18, 14));
    const escalationHeadMaterial = track(
      new THREE.MeshBasicMaterial({ color: COLOR_AMBER, transparent: true, opacity: 1 }),
    );
    const escalationHead = new THREE.Mesh(escalationHeadGeometry, escalationHeadMaterial);
    escalationHead.renderOrder = 9;
    escalationHead.visible = false;
    root.add(escalationHead);

    const escalationGlowMaterial = track(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: COLOR_AMBER,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        fog: false,
      }),
    );
    const escalationGlow = new THREE.Sprite(escalationGlowMaterial);
    escalationGlow.scale.setScalar(0.62);
    escalationGlow.renderOrder = 8;
    escalationGlow.visible = false;
    root.add(escalationGlow);

    /* Метка человека: точка плюс кольца, которые коротко разгораются. */
    const humanGroup = new THREE.Group();
    humanGroup.position.copy(HUMAN_POINT);
    root.add(humanGroup);

    const humanCoreGeometry = track(new THREE.SphereGeometry(0.082, 16, 12));
    const humanCoreMaterial = track(
      new THREE.MeshBasicMaterial({ color: COLOR_AMBER, transparent: true, opacity: 0.85 }),
    );
    const humanCore = new THREE.Mesh(humanCoreGeometry, humanCoreMaterial);
    humanCore.renderOrder = 7;
    humanGroup.add(humanCore);

    const humanRingGeometry = track(new THREE.RingGeometry(0.185, 0.207, 52));
    const humanRingMaterial = track(
      new THREE.MeshBasicMaterial({
        color: COLOR_AMBER,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const humanRing = new THREE.Mesh(humanRingGeometry, humanRingMaterial);
    humanRing.renderOrder = 7;
    humanGroup.add(humanRing);

    const humanHaloGeometry = track(new THREE.RingGeometry(0.278, 0.291, 56));
    const humanHaloMaterial = track(
      new THREE.MeshBasicMaterial({
        color: COLOR_AMBER,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const humanHalo = new THREE.Mesh(humanHaloGeometry, humanHaloMaterial);
    humanHalo.renderOrder = 7;
    humanGroup.add(humanHalo);

    /* ================= Декор: внешнее кольцо-горизонт ================= */

    /* Одно спокойное кольцо, обращённое к зрителю: держит композицию
       по центру и намекает на границу системы. */
    const horizonGeometry = track(
      new THREE.RingGeometry(HORIZON_RADIUS, HORIZON_RADIUS + 0.019, 192),
    );
    const horizonMaterial = track(
      new THREE.MeshBasicMaterial({
        color: COLOR_LINE,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    horizon.renderOrder = 0;
    root.add(horizon);

    /* ================= Состояние анимации ================= */

    const tempA = new THREE.Vector3();
    const tempB = new THREE.Vector3();

    let baseDistance = 12;
    let scrollProgress = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;

    /** Пересчитывает положение каналов и опорные точки их траекторий. */
    function updateChannels(elapsed: number): void {
      for (const channel of channels) {
        const { config } = channel;
        const angle = config.phase + elapsed * config.speed;
        channel.position
          .set(Math.cos(angle) * config.radius, 0, Math.sin(angle) * config.radius)
          .applyQuaternion(channel.quaternion);
        channel.node.position.copy(channel.position);

        /* Точка входа в ядро — на его поверхности, со стороны канала. */
        channel.target.copy(channel.position).normalize().multiplyScalar(CORE_RADIUS * 0.94);

        /* Опорная точка: середина, сдвинутая поперёк орбиты — получается дуга. */
        tempA.copy(channel.position).normalize();
        tempB.copy(tempA).cross(channel.normal).normalize();
        channel.control
          .copy(channel.position)
          .add(channel.target)
          .multiplyScalar(0.5)
          .addScaledVector(tempB, config.bend)
          .addScaledVector(tempA, 0.12);

        /* Ответы возвращаются зеркальной дугой — встречный поток виден отдельно. */
        channel.controlOut
          .copy(channel.position)
          .add(channel.target)
          .multiplyScalar(0.5)
          .addScaledVector(tempB, -config.bend)
          .addScaledVector(tempA, 0.12);
      }
    }

    /** Входящие обращения: летят от канала к ядру и растворяются в нём.
        Цвет темнеет по мере приближения — так виден не рой, а направление. */
    function updateIncoming(dt: number, flow: number): void {
      for (let i = 0; i < incomingCount; i += 1) {
        let u = incomingProgress[i] + incomingSpeed[i] * dt * flow;
        if (u >= 1) {
          u -= Math.floor(u);
        }
        incomingProgress[i] = u;

        const channel = channels[incomingChannel[i]];
        evaluateBezier(tempA, channel.position, channel.control, channel.target, u);
        incomingPositions[i * 3] = tempA.x;
        incomingPositions[i * 3 + 1] = tempA.y;
        incomingPositions[i * 3 + 2] = tempA.z;

        workColor
          .copy(brandLightColor)
          .lerp(brandColor, smoothstep(0, 0.45, u))
          .lerp(brandDarkColor, smoothstep(0.5, 0.95, u) * 0.7);
        incomingColors[i * 4] = workColor.r;
        incomingColors[i * 4 + 1] = workColor.g;
        incomingColors[i * 4 + 2] = workColor.b;
        /* Проявляется на выходе из канала, гаснет уже внутри ядра. */
        incomingColors[i * 4 + 3] =
          smoothstep(0, 0.09, u) * (1 - 0.92 * smoothstep(0.82, 1, u));
      }
      incomingGeometry.attributes.position.needsUpdate = true;
      incomingGeometry.attributes.color.needsUpdate = true;
    }

    /** Ответы: ровные светлые штрихи от ядра к каналам. */
    function updateOutgoing(dt: number, flow: number): void {
      for (let i = 0; i < outgoingCount; i += 1) {
        let u = outgoingProgress[i] + outgoingSpeed[i] * dt * flow;
        if (u >= 1) {
          u -= Math.floor(u);
        }
        outgoingProgress[i] = u;

        const channel = channels[outgoingChannel[i]];
        const head = u;
        const tail = Math.max(0, u - OUTGOING_TAIL);

        /* Своя дуга, от ядра наружу к каналу. */
        evaluateBezier(tempA, channel.target, channel.controlOut, channel.position, head);
        evaluateBezier(tempB, channel.target, channel.controlOut, channel.position, tail);

        const envelope = smoothstep(0, 0.12, u) * (1 - smoothstep(0.86, 1, u));
        workColor.copy(brandLightColor).lerp(brandColor, 0.3);
        workColorAlt.copy(brandLightColor);
        writeRibbonQuad(
          outgoingPositions,
          outgoingColors,
          i,
          tempA,
          tempB,
          OUTGOING_HALF_WIDTH,
          OUTGOING_HALF_WIDTH * 0.3,
          workColor,
          envelope * 0.95,
          workColorAlt,
          0,
        );

        outgoingHeadPositions[i * 3] = tempA.x;
        outgoingHeadPositions[i * 3 + 1] = tempA.y;
        outgoingHeadPositions[i * 3 + 2] = tempA.z;
        outgoingHeadColors[i * 4] = workColor.r;
        outgoingHeadColors[i * 4 + 1] = workColor.g;
        outgoingHeadColors[i * 4 + 2] = workColor.b;
        outgoingHeadColors[i * 4 + 3] = envelope;
      }
      outgoingGeometry.attributes.position.needsUpdate = true;
      outgoingGeometry.attributes.color.needsUpdate = true;
      outgoingHeadGeometry.attributes.position.needsUpdate = true;
      outgoingHeadGeometry.attributes.color.needsUpdate = true;
    }

    /** Эскалация: один янтарный импульс уходит в сторону человека. */
    function updateEscalation(elapsed: number): void {
      const phase = (elapsed + ESCALATION_OFFSET) % ESCALATION_PERIOD;
      const flying = phase < ESCALATION_TRAVEL;

      escalationTrail.visible = flying;
      escalationHead.visible = flying;
      escalationGlow.visible = flying;

      if (flying) {
        const u = easeInOutCubic(phase / ESCALATION_TRAVEL);
        const fade = smoothstep(0, 0.08, u) * (1 - smoothstep(0.9, 1, u));

        /* Хвост собирается из звеньев: голова широкая и плотная,
           конец сходит на нет — след виден, но не превращается в комету. */
        evaluateBezier(tempB, escalationStart, escalationControl, HUMAN_POINT, u);
        for (let i = 0; i < escalationQuads; i += 1) {
          const nextShare = (i + 1) / escalationQuads;
          const point = Math.max(0, u - nextShare * ESCALATION_TRAIL_SPAN);
          evaluateBezier(tempA, escalationStart, escalationControl, HUMAN_POINT, point);

          const headShare = i / escalationQuads;
          const headTaper = (1 - headShare) ** 1.35;
          const tailTaper = (1 - nextShare) ** 1.35;
          writeRibbonQuad(
            escalationPositions,
            escalationColors,
            i,
            tempB,
            tempA,
            ESCALATION_TAIL_HALF_WIDTH +
              (ESCALATION_HEAD_HALF_WIDTH - ESCALATION_TAIL_HALF_WIDTH) * headTaper,
            ESCALATION_TAIL_HALF_WIDTH +
              (ESCALATION_HEAD_HALF_WIDTH - ESCALATION_TAIL_HALF_WIDTH) * tailTaper,
            amberColor,
            fade * headTaper,
            amberColor,
            fade * tailTaper,
          );
          tempB.copy(tempA);
        }
        escalationGeometry.attributes.position.needsUpdate = true;
        escalationGeometry.attributes.color.needsUpdate = true;

        evaluateBezier(tempA, escalationStart, escalationControl, HUMAN_POINT, u);
        escalationHead.position.copy(tempA);
        escalationGlow.position.copy(tempA);
        escalationHeadMaterial.opacity = fade;
        escalationGlowMaterial.opacity = fade * 0.55;
      }

      /* Отклик метки человека: коротко разгорается после прилёта импульса. */
      const afterArrival = phase - ESCALATION_TRAVEL;
      const glow = flying ? 0 : Math.exp(-Math.max(0, afterArrival) * 1.5);
      humanCoreMaterial.opacity = 0.78 + 0.22 * glow;
      humanRingMaterial.opacity = 0.42 + 0.45 * glow;
      humanRing.scale.setScalar(1 + 0.38 * glow);
      humanHaloMaterial.opacity = 0.18 + 0.3 * glow;
      humanHalo.scale.setScalar(1 + 0.2 * glow);
    }

    /** Один кадр сцены. */
    function update(elapsed: number, dt: number): void {
      updateChannels(elapsed);
      updateIncoming(dt, 1 + 0.6 * scrollProgress);
      updateOutgoing(dt, 1 + 0.45 * scrollProgress);
      updateEscalation(elapsed);

      /* Ядро: медленное вращение и еле заметная пульсация. */
      core.rotation.y = elapsed * (TAU / 38);
      core.rotation.x = Math.sin(elapsed * 0.12) * 0.08;
      const pulse = 1 + Math.sin(elapsed * 0.55) * 0.014 + Math.sin(elapsed * 1.31) * 0.005;
      const breath = 0.5 + 0.5 * Math.sin(elapsed * 0.55);
      core.scale.setScalar(pulse);
      coreRing.scale.setScalar(pulse);
      corePointsMaterial.opacity = 0.9 + 0.08 * breath;
      coreGlowMaterial.opacity = 0.64 + 0.1 * breath;
      coreEdgesMaterial.color.copy(brandLightColor).lerp(brandColor, 0.34 + 0.12 * breath);

      /* Параллакс с инерцией плюс еле заметное покачивание.
         Именно покачивание, а не полный оборот: иначе кольца периодически
         встают «с ребра» и превращаются в прямую черту через весь кадр. */
      pointerX += (pointerTargetX - pointerX) * 0.045;
      pointerY += (pointerTargetY - pointerY) * 0.045;
      root.rotation.y = Math.sin(elapsed * (TAU / 96)) * 0.07 + pointerX * 0.16;
      root.rotation.x = Math.sin(elapsed * (TAU / 132)) * 0.045 + pointerY * 0.1;

      /* Скролл слегка приближает камеру. */
      const distance = baseDistance * (1 - 0.07 * scrollProgress);
      camera.position.set(pointerX * 0.22, -pointerY * 0.16, distance);
      camera.lookAt(0, 0, 0);
    }

    /* ================= Размер, камера, туман ================= */

    function applySize(): void {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width === 0 || height === 0) {
        return;
      }

      const aspect = width / height;
      camera.aspect = aspect;

      /* Дистанция подбирается так, чтобы сфера FIT_RADIUS влезала по обеим осям. */
      const verticalFov = (CAMERA_FOV * Math.PI) / 180;
      const distanceByHeight = FIT_RADIUS / Math.tan(verticalFov / 2);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
      const distanceByWidth = FIT_RADIUS / Math.tan(horizontalFov / 2);
      baseDistance = Math.min(26, Math.max(distanceByHeight, distanceByWidth));

      camera.position.z = baseDistance;
      camera.far = baseDistance + 26;
      camera.updateProjectionMatrix();

      /* Туман привязан к дистанции: дальняя половина сцены тает в белом.
         Дальняя граница отодвинута — иначе дальние дуги белеют полностью
         и глубина превращается в бледность. */
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.near = baseDistance - 0.3;
        scene.fog.far = baseDistance + 14;
      }

      /* Размер точки в three не учитывает FOV: gl_PointSize = size * height / (2 * z).
         Пересчитываем размеры так, чтобы точка держала заданные CSS-пиксели. */
      const pixel = (2 * baseDistance) / height;
      incomingMaterial.size = 5.8 * pixel;
      outgoingHeadMaterial.size = 4 * pixel;
      corePointsMaterial.size = 3.4 * pixel;
      coreInnerMaterial.size = 2.9 * pixel;

      renderer.setSize(width, height, false);
    }

    applySize();

    /* ================= Цикл и его выключатели ================= */

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    let frameId = 0;
    let lastTime = 0;
    /* Стартуем с того же момента, что и статичный кадр, — без рывка. */
    let elapsedTime = STATIC_FRAME_TIME;
    let visible = true;
    /* Пока контекст потерян, рисовать нечем: цикл стоит, на экране фолбэк. */
    let contextLost = false;

    function readScroll(): void {
      const span = Math.max(1, window.innerHeight * 1.5);
      scrollProgress = clamp01(window.scrollY / span);
    }

    function renderStaticFrame(): void {
      if (contextLost) {
        return;
      }
      readScroll();
      pointerX = 0;
      pointerY = 0;
      pointerTargetX = 0;
      pointerTargetY = 0;
      update(STATIC_FRAME_TIME, 0);
      renderer.render(scene, camera);
    }

    function tick(now: number): void {
      frameId = window.requestAnimationFrame(tick);
      /* Ограничиваем dt: после возврата на вкладку сцена не должна «прыгать». */
      const dt = lastTime === 0 ? 0.016 : Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsedTime += dt;

      readScroll();
      update(elapsedTime, dt);
      renderer.render(scene, camera);
    }

    function shouldRun(): boolean {
      return visible && !contextLost && !document.hidden && !motionQuery.matches;
    }

    function start(): void {
      if (frameId !== 0 || !shouldRun()) {
        return;
      }
      lastTime = 0;
      frameId = window.requestAnimationFrame(tick);
    }

    function stop(): void {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    function sync(): void {
      if (shouldRun()) {
        start();
      } else {
        stop();
        /* Статичный кадр нужен только зрителю: в скрытой вкладке и вне
           вьюпорта не рисуем вообще ничего. */
        if (motionQuery.matches && visible && !document.hidden) {
          renderStaticFrame();
        }
      }
    }

    /* --- Наблюдатели --- */

    const resizeObserver = new ResizeObserver(() => {
      applySize();
      if (!shouldRun()) {
        renderStaticFrame();
      }
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    /* --- Ввод --- */

    function handlePointerMove(event: PointerEvent): void {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      pointerTargetX = clamp01(x + 0.5) * 2 - 1;
      pointerTargetY = clamp01(y + 0.5) * 2 - 1;
    }

    function handlePointerLeave(): void {
      pointerTargetX = 0;
      pointerTargetY = 0;
    }

    /* Доступность параллакса пересчитывается на каждое изменение медиазапросов:
       пользователь может включить «уменьшить движение» или подключить мышь
       к планшету уже после монтирования. */
    let parallaxAttached = false;

    function syncParallax(): void {
      const enabled = !coarsePointerQuery.matches && !motionQuery.matches;
      if (enabled === parallaxAttached) {
        return;
      }
      if (enabled) {
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        document.addEventListener("pointerleave", handlePointerLeave);
        parallaxAttached = true;
        return;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      parallaxAttached = false;
      handlePointerLeave();
    }

    syncParallax();

    function handleVisibilityChange(): void {
      sync();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    function handleMotionChange(): void {
      syncParallax();
      if (motionQuery.matches) {
        pointerTargetX = 0;
        pointerTargetY = 0;
      }
      sync();
    }
    motionQuery.addEventListener("change", handleMotionChange);

    function handlePointerKindChange(): void {
      syncParallax();
    }
    coarsePointerQuery.addEventListener("change", handlePointerKindChange);

    /* --- Потеря и восстановление GL-контекста ---
       Мобильные браузеры регулярно отбирают контекст при нехватке памяти или
       сворачивании вкладки. Без этой пары обработчиков канвас после потери
       остаётся навсегда пустым, а фолбэк — спрятанным. */
    const canvas = renderer.domElement;

    function handleContextLost(event: Event): void {
      /* preventDefault обязателен: без него браузер не станет восстанавливать контекст. */
      event.preventDefault();
      contextLost = true;
      stop();
      setFallbackVisible(true);
    }

    function handleContextRestored(): void {
      contextLost = false;
      applySize();
      /* Кадр рисуем до показа канваса — иначе между фолбэком и первым
         кадром цикла мелькнёт пустота. */
      renderer.render(scene, camera);
      setFallbackVisible(false);
      lastTime = 0;
      sync();
    }

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    /* Первый кадр рисуем сразу — сцена не должна «вспыхивать» пустотой. */
    renderStaticFrame();
    sync();

    /* ================= Уборка ================= */

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionChange);
      coarsePointerQuery.removeEventListener("change", handlePointerKindChange);
      /* Слушателей контекста снимаем до forceContextLoss — иначе собственный
         обработчик сработает уже на размонтированной сцене. */
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      if (parallaxAttached) {
        window.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerleave", handlePointerLeave);
        parallaxAttached = false;
      }

      disposables.forEach((resource) => resource.dispose());
      scene.clear();
      renderer.dispose();
      /* Отпускаем GL-контекст сразу: при переходах по роутам они иначе
         копятся до лимита браузера, и очередная сцена не поднимется. */
      renderer.forceContextLoss();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      setFallbackVisible(true);
    };
  }, []);

  const rootClassName = ["relative h-full w-full", className].filter(Boolean).join(" ");

  return (
    <div ref={containerRef} className={rootClassName} aria-hidden="true">
      <div ref={fallbackRef} className="absolute inset-0">
        <StaticFallback />
      </div>
    </div>
  );
}
