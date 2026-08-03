import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Book } from "@/types/book";

type ShelfSceneCallbacks = {
  onSelectionChange: (index: number | null) => void;
  onReady: () => void;
};

type RuntimeBook = {
  root: THREE.Group;
  mesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseRotation: number;
  targetX: number;
  targetLift: number;
  targetDepth: number;
  targetRotation: number;
  targetScale: number;
};

export const SHELF_SCENE_VERSION = 15;

const millimetersPerSceneUnit = 80;
const bookGap = 0.045;
const shelfTop = 0.3;
const bookShelfClearance = 0.018;

export class ShelfScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly books: Book[];
  private readonly callbacks: ShelfSceneCallbacks;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  private readonly shelfGroup = new THREE.Group();
  private readonly runtimeBooks: RuntimeBook[] = [];
  private readonly pickTargets: THREE.Object3D[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private frame = 0;
  private hoveredIndex: number | null = null;
  private selectedIndex: number | null = null;
  private selectionProgress = 0;
  private returningToShelf = false;
  private dragging = false;
  private pointerId: number | null = null;
  private pointerLastX = 0;
  private pointerTravel = 0;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    books: Book[],
    callbacks: ShelfSceneCallbacks,
  ) {
    this.canvas = canvas;
    this.books = books;
    this.callbacks = callbacks;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera.position.set(0, 1.65, 7.8);
    this.camera.lookAt(0, 1.32, 0);
    this.scene.fog = new THREE.Fog("#e8e0d2", 10, 22);
    this.scene.add(this.shelfGroup);

    this.setupLighting();
    this.createShelf();
    this.createBooks();
    this.bindEvents();

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas);
    this.resize();
    this.callbacks.onReady();
    this.animate();
  }

  focusBook(index: number) {
    if (!this.runtimeBooks[index]) return;
    this.selectedIndex = index;
    this.hoveredIndex = null;
    this.selectionProgress = 0;
    this.returningToShelf = false;
    this.updateBookTargets();
    this.callbacks.onSelectionChange(index);
  }

  returnToShelf() {
    if (this.selectedIndex === null || this.returningToShelf) return;
    this.returningToShelf = true;
    this.callbacks.onSelectionChange(null);
    this.canvas.focus({ preventScroll: true });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.unbindEvents();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => {
        const map = (material as THREE.MeshStandardMaterial).map;
        map?.dispose();
        material.dispose();
      });
    });
    this.renderer.dispose();
  }

  private setupLighting() {
    this.scene.add(new THREE.HemisphereLight("#fff8ec", "#665045", 2.6));

    const key = new THREE.DirectionalLight("#fff4df", 4.2);
    key.position.set(-4, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -2;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight("#bed0da", 1.8);
    rim.position.set(5, 3, -4);
    this.scene.add(rim);

    const warmBounce = new THREE.PointLight("#d38b58", 2.4, 10, 2);
    warmBounce.position.set(-3, 0.5, 4);
    this.scene.add(warmBounce);
  }

  private createShelf() {
    const totalWidth = getShelfContentWidth(this.books);
    const shelfWidth = Math.max(totalWidth + 6, 12);
    const wood = new THREE.MeshPhysicalMaterial({
      color: "#674636",
      roughness: 0.58,
      clearcoat: 0.12,
      clearcoatRoughness: 0.65,
    });
    const shelf = new THREE.Mesh(
      new RoundedBoxGeometry(shelfWidth, 0.24, 2.05, 4, 0.055),
      wood,
    );
    shelf.position.set(0, 0.18, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    this.shelfGroup.add(shelf);

    const lip = new THREE.Mesh(
      new RoundedBoxGeometry(shelfWidth, 0.13, 0.16, 3, 0.025),
      new THREE.MeshStandardMaterial({ color: "#4a3027", roughness: 0.48 }),
    );
    lip.position.set(0, 0.225, 1.02);
    lip.castShadow = true;
    this.shelfGroup.add(lip);
  }

  private createBooks() {
    const loader = new THREE.TextureLoader();
    let cursor = -getShelfContentWidth(this.books) / 2;

    this.books.forEach((book, index) => {
      const thickness = getThickness(book);
      const height = book.heightMm / millimetersPerSceneUnit;
      const coverWidth = book.widthMm / millimetersPerSceneUnit;
      cursor += thickness / 2;

      const color = getBookColor(book.id);
      const board = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.72,
        sheen: 0.35,
        sheenColor: new THREE.Color("#fff1dc"),
      });
      const pages = new THREE.MeshStandardMaterial({
        color: "#e8ddc7",
        roughness: 0.92,
      });
      const cover = board.clone();
      const spine = board.clone();
      const materials = [cover, board, pages, pages, spine, board];
      const geometry = new RoundedBoxGeometry(
        thickness,
        height,
        coverWidth,
        5,
        0.035,
      );
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.bookIndex = index;

      const root = new THREE.Group();
      const baseRotation = ((index % 4) - 1.5) * 0.018;
      const baseY =
        shelfTop +
        bookShelfClearance +
        (height / 2) * Math.cos(baseRotation) +
        (thickness / 2) * Math.abs(Math.sin(baseRotation));
      root.position.set(cursor, baseY, 0);
      root.rotation.z = baseRotation;
      root.add(mesh);
      this.shelfGroup.add(root);

      const runtime: RuntimeBook = {
        root,
        mesh,
        baseX: cursor,
        baseY,
        baseRotation,
        targetX: cursor,
        targetLift: 0,
        targetDepth: 0,
        targetRotation: 0,
        targetScale: 1,
      };
      this.runtimeBooks.push(runtime);
      this.pickTargets.push(mesh);

      loader.load(
        book.coverImage,
        (texture) => {
          if (this.disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            this.renderer.capabilities.getMaxAnisotropy(),
          );
          cover.map = texture;
          cover.color.set("#ffffff");
          cover.needsUpdate = true;

          const spineTexture = createSpineTexture(
            texture.image as CanvasImageSource,
            book,
            color,
          );
          spineTexture.colorSpace = THREE.SRGBColorSpace;
          spineTexture.anisotropy = Math.min(
            8,
            this.renderer.capabilities.getMaxAnisotropy(),
          );
          spine.map = spineTexture;
          spine.color.set("#ffffff");
          spine.needsUpdate = true;
        },
        undefined,
        () => undefined,
      );

      cursor += thickness / 2 + bookGap;
    });
  }

  private updateBookTargets() {
    this.runtimeBooks.forEach((book, index) => {
      const isSelected = index === this.selectedIndex;
      const isHovered = index === this.hoveredIndex && this.selectedIndex === null;
      if (isSelected) {
        setExtractionPose(book, this.selectionProgress);
        return;
      }
      book.targetX = book.baseX;
      book.targetDepth = isHovered ? 0.26 : 0;
      book.targetLift = 0;
      book.targetRotation = 0;
      book.targetScale = 1;
    });
  }

  private animate = () => {
    if (this.disposed) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const smoothing = 1 - Math.exp(-8 * delta);

    if (this.selectedIndex !== null) {
      const direction = this.returningToShelf ? -1 : 1;
      this.selectionProgress = THREE.MathUtils.clamp(
        this.selectionProgress + (delta / 0.9) * direction,
        0,
        1,
      );
      if (this.returningToShelf && this.selectionProgress === 0) {
        this.selectedIndex = null;
        this.returningToShelf = false;
      }
      this.updateBookTargets();
    }

    this.runtimeBooks.forEach((book, index) => {
      const interpolation = index === this.selectedIndex ? 1 : smoothing;
      book.root.position.x = THREE.MathUtils.lerp(
        book.root.position.x,
        book.targetX,
        interpolation,
      );
      book.root.position.y = THREE.MathUtils.lerp(
        book.root.position.y,
        book.baseY + book.targetLift,
        interpolation,
      );
      book.root.position.z = THREE.MathUtils.lerp(
        book.root.position.z,
        book.targetDepth,
        interpolation,
      );
      book.root.rotation.y = THREE.MathUtils.lerp(
        book.root.rotation.y,
        book.targetRotation,
        interpolation,
      );
      book.root.rotation.z = THREE.MathUtils.lerp(
        book.root.rotation.z,
        book.targetLift > 0.2 ? 0 : book.baseRotation,
        interpolation,
      );
      const scale = THREE.MathUtils.lerp(
        book.root.scale.x,
        book.targetScale,
        interpolation,
      );
      book.root.scale.setScalar(scale);
    });

    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  };

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    const compact = rect.width < 720;
    this.camera.position.set(0, compact ? 1.72 : 1.65, compact ? 9.8 : 7.8);
    this.alignShelfWithViewportBottom();
    this.camera.updateProjectionMatrix();
  };

  private alignShelfWithViewportBottom() {
    const shelfFrontBottom = new THREE.Vector3(0, 0.06, 1.05);
    const angleToShelf = Math.atan2(
      shelfFrontBottom.y - this.camera.position.y,
      this.camera.position.z - shelfFrontBottom.z,
    );
    const lowerFrameAngle = THREE.MathUtils.degToRad(this.camera.fov * 0.495);
    const cameraPitch = angleToShelf + lowerFrameAngle;
    const lookAtY =
      this.camera.position.y + Math.tan(cameraPitch) * this.camera.position.z;

    this.camera.lookAt(0, lookAtY, 0);
  }

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("keydown", this.onKeyDown);
  }

  private unbindEvents() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("keydown", this.onKeyDown);
  }

  private onPointerDown = (event: PointerEvent) => {
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.pointerLastX = event.clientX;
    this.pointerTravel = 0;
    this.canvas.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.selectedIndex === null) {
      this.setHoveredIndex(this.getBookIndex(event));
    }
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    const movement = event.clientX - this.pointerLastX;
    this.pointerTravel += Math.abs(movement);
    this.pointerLastX = event.clientX;
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    this.dragging = false;
    this.canvas.releasePointerCapture(event.pointerId);
    if (this.pointerTravel < 8) this.pickBook(event);
    this.pointerId = null;
  };

  private pickBook(event: PointerEvent) {
    if (this.selectedIndex !== null) {
      this.returnToShelf();
      return;
    }

    const index = this.getBookIndex(event);
    if (index === null) return;
    this.focusBook(index);
  }

  private getBookIndex(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickTargets, false)[0];
    const index = hit?.object.userData.bookIndex;
    return typeof index === "number" ? index : null;
  }

  private setHoveredIndex(index: number | null) {
    if (this.hoveredIndex === index) return;
    this.hoveredIndex = index;
    this.canvas.style.cursor = index === null ? "default" : "pointer";
    this.updateBookTargets();
  }

  private onPointerLeave = () => {
    if (this.selectedIndex === null) this.setHoveredIndex(null);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === "Enter" &&
      this.selectedIndex === null &&
      this.hoveredIndex !== null
    ) {
      this.focusBook(this.hoveredIndex);
    }
    if (event.key === "Escape" && this.selectedIndex !== null) {
      this.returnToShelf();
    }
  };
}

function setExtractionPose(book: RuntimeBook, progress: number) {
  const pullEnd = 0.34;
  const moveEnd = 0.74;

  if (progress <= pullEnd) {
    const amount = smoothStep(progress / pullEnd);
    book.targetX = book.baseX;
    book.targetDepth = THREE.MathUtils.lerp(0, 2, amount);
    book.targetLift = THREE.MathUtils.lerp(0, 0.12, amount);
    book.targetRotation = 0;
    book.targetScale = THREE.MathUtils.lerp(1, 0.8, amount);
    return;
  }

  if (progress <= moveEnd) {
    const amount = smoothStep((progress - pullEnd) / (moveEnd - pullEnd));
    book.targetX = THREE.MathUtils.lerp(book.baseX, -1.05, amount);
    book.targetDepth = 2;
    book.targetLift = 0.12;
    book.targetRotation = THREE.MathUtils.lerp(0, -Math.PI / 2, amount);
    book.targetScale = 0.8;
    return;
  }

  const amount = smoothStep((progress - moveEnd) / (1 - moveEnd));
  book.targetX = -1.05;
  book.targetDepth = THREE.MathUtils.lerp(2, 1.2, amount);
  book.targetLift = THREE.MathUtils.lerp(0.12, 0.08, amount);
  book.targetRotation = -Math.PI / 2;
  book.targetScale = THREE.MathUtils.lerp(0.8, 0.92, amount);
}

function smoothStep(value: number) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function getThickness(book: Book) {
  return Math.max(book.thicknessMm / millimetersPerSceneUnit, 0.15);
}

function getShelfContentWidth(books: Book[]) {
  return books.reduce(
    (width, book, index) =>
      width + getThickness(book) + (index === 0 ? 0 : bookGap),
    0,
  );
}

function getBookColor(id: string) {
  const palette = [
    "#bc5b42",
    "#31576b",
    "#d5a33e",
    "#596945",
    "#8e4c53",
    "#d37e47",
    "#315e58",
    "#73604e",
    "#48688a",
  ];
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[seed % palette.length];
}

type Rgb = { r: number; g: number; b: number };

function createSpineTexture(
  image: CanvasImageSource,
  book: Book,
  fallbackColor: string,
) {
  const dominant = extractDominantColor(image) ?? hexToRgb(fallbackColor);
  const canvas = document.createElement("canvas");
  canvas.height = 1024;
  canvas.width = Math.max(
    64,
    Math.round(canvas.height * (book.thicknessMm / book.heightMm)),
  );
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const shadow = mixColor(dominant, { r: 0, g: 0, b: 0 }, 0.2);
  const highlight = mixColor(dominant, { r: 255, g: 255, b: 255 }, 0.14);
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, rgbToCss(shadow));
  gradient.addColorStop(0.15, rgbToCss(highlight));
  gradient.addColorStop(0.55, rgbToCss(dominant));
  gradient.addColorStop(1, rgbToCss(shadow));
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const luminance = relativeLuminance(dominant);
  const ink = luminance > 0.52
    ? "rgba(26, 22, 18, 0.92)"
    : "rgba(255, 249, 238, 0.94)";
  const softInk = luminance > 0.52
    ? "rgba(26, 22, 18, 0.48)"
    : "rgba(255, 249, 238, 0.58)";

  context.strokeStyle = softInk;
  context.lineWidth = Math.max(1, canvas.width * 0.012);
  const ruleInset = canvas.width * 0.1;
  context.beginPath();
  context.moveTo(ruleInset, 72);
  context.lineTo(canvas.width - ruleInset, 72);
  context.moveTo(ruleInset, 952);
  context.lineTo(canvas.width - ruleInset, 952);
  context.stroke();

  context.fillStyle = ink;
  if (containsCjk(book.title)) {
    drawVerticalTitle(context, book.title);
  } else {
    drawRotatedTitle(context, book.title);
  }

  context.fillStyle = ink;
  context.font = `700 ${Math.max(12, canvas.width * 0.14)}px Georgia, "Times New Roman", serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("M", canvas.width / 2, 986);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function extractDominantColor(image: CanvasImageSource): Rgb | null {
  const sample = document.createElement("canvas");
  sample.width = 32;
  sample.height = 40;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  try {
    context.drawImage(image, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const buckets = new Map<
      string,
      { color: Rgb; count: number; saturation: number }
    >();

    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 180) continue;
      const color = {
        r: pixels[index],
        g: pixels[index + 1],
        b: pixels[index + 2],
      };
      const lightness =
        (Math.max(color.r, color.g, color.b) +
          Math.min(color.r, color.g, color.b)) /
        510;
      if (lightness < 0.06 || lightness > 0.96) continue;

      const saturation = rgbSaturation(color);
      const key = `${color.r >> 4}-${color.g >> 4}-${color.b >> 4}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.color.r += color.r;
        bucket.color.g += color.g;
        bucket.color.b += color.b;
        bucket.saturation += saturation;
        bucket.count += 1;
      } else {
        buckets.set(key, { color: { ...color }, count: 1, saturation });
      }
    }

    let winner: { color: Rgb; count: number; saturation: number } | null = null;
    let winnerScore = -1;
    buckets.forEach((bucket) => {
      const averageSaturation = bucket.saturation / bucket.count;
      const score = bucket.count * (0.72 + averageSaturation * 0.75);
      if (score > winnerScore) {
        winner = bucket;
        winnerScore = score;
      }
    });

    if (!winner) return null;
    const selected = winner as { color: Rgb; count: number };
    return {
      r: Math.round(selected.color.r / selected.count),
      g: Math.round(selected.color.g / selected.count),
      b: Math.round(selected.color.b / selected.count),
    };
  } catch {
    return null;
  }
}

function drawRotatedTitle(context: CanvasRenderingContext2D, title: string) {
  context.save();
  context.translate(context.canvas.width / 2, 104);
  context.rotate(Math.PI / 2);
  context.textAlign = "left";
  context.textBaseline = "middle";
  const availableLength = context.canvas.height - 208;
  let fontSize = Math.min(96, context.canvas.width * 0.68);
  context.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
  while (context.measureText(title).width > availableLength && fontSize > 12) {
    fontSize -= 1;
    context.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
  }
  context.fillText(title, 0, 0);
  context.restore();
}

function drawVerticalTitle(context: CanvasRenderingContext2D, title: string) {
  const characters = Array.from(title.replace(/\s+/g, ""));
  const fontSize = Math.min(
    context.canvas.width * 0.68,
    760 / Math.max(characters.length, 1),
  );
  const lineHeight = fontSize * 1.08;
  const startY = Math.max(
    120,
    (context.canvas.height - lineHeight * characters.length) / 2,
  );
  context.font = `700 ${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  characters.forEach((character, index) => {
    context.fillText(
      character,
      context.canvas.width / 2,
      startY + index * lineHeight,
    );
  });
}

function containsCjk(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
}

function rgbSaturation({ r, g, b }: Rgb) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const lightness = (max + min) / 2;
  return (max - min) / (1 - Math.abs(2 * lightness - 1));
}

function relativeLuminance({ r, g, b }: Rgb) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return channel(r) * 0.2126 + channel(g) * 0.7152 + channel(b) * 0.0722;
}

function mixColor(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: Math.round(THREE.MathUtils.lerp(from.r, to.r, amount)),
    g: Math.round(THREE.MathUtils.lerp(from.g, to.g, amount)),
    b: Math.round(THREE.MathUtils.lerp(from.b, to.b, amount)),
  };
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToCss({ r, g, b }: Rgb) {
  return `rgb(${r} ${g} ${b})`;
}
