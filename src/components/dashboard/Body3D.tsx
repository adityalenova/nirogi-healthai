import { useEffect, useRef, useState } from "react";

export type OrganKey = "brain" | "heart" | "lungs" | "liver" | "stomach" | "kidneys" | "bones";

export type OrganStatus = { key: OrganKey; label: string; status: "good" | "watch" | "risk"; note: string };

const COLORS: Record<OrganStatus["status"], number> = {
  good: 0x34d399,
  watch: 0xfbbf24,
  risk: 0xf87171,
};

/**
 * Lightweight procedural 3D body. Organs are simple meshes coloured by the
 * user's health data; clicking one selects it. three.js is imported lazily so
 * nothing runs during SSR.
 */
export function Body3D({
  organs,
  selected,
  onSelect,
}: {
  organs: OrganStatus[];
  selected: OrganKey | null;
  onSelect: (k: OrganKey) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const organsRef = useRef(organs);
  organsRef.current = organs;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (!mount || disposed) return;

      const width = mount.clientWidth;
      const height = mount.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.2, 6.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0x7ff0e0, 1.1);
      key.position.set(3, 5, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x2dd4bf, 0.7);
      rim.position.set(-4, 1, -4);
      scene.add(rim);

      const group = new THREE.Group();
      scene.add(group);

      // Translucent body shell.
      const shellMat = new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.14,
        roughness: 0.35,
        metalness: 0.1,
      });
      const addShell = (geo: import("three").BufferGeometry, x: number, y: number, z = 0, rz = 0) => {
        const m = new THREE.Mesh(geo, shellMat);
        m.position.set(x, y, z);
        m.rotation.z = rz;
        group.add(m);
        return m;
      };

      addShell(new THREE.SphereGeometry(0.42, 32, 32), 0, 2.1);
      addShell(new THREE.CylinderGeometry(0.16, 0.2, 0.28, 20), 0, 1.72);
      addShell(new THREE.CapsuleGeometry(0.62, 1.15, 12, 32), 0, 0.85);
      addShell(new THREE.CapsuleGeometry(0.42, 0.5, 10, 24), 0, -0.35);
      addShell(new THREE.CapsuleGeometry(0.15, 1.15, 8, 20), -0.78, 0.85, 0, 0.18);
      addShell(new THREE.CapsuleGeometry(0.15, 1.15, 8, 20), 0.78, 0.85, 0, -0.18);
      addShell(new THREE.CapsuleGeometry(0.19, 1.5, 8, 20), -0.28, -1.6);
      addShell(new THREE.CapsuleGeometry(0.19, 1.5, 8, 20), 0.28, -1.6);

      // Organs.
      const meshes: { key: OrganKey; mesh: import("three").Mesh }[] = [];
      const organMesh = (
        k: OrganKey,
        geo: import("three").BufferGeometry,
        pos: [number, number, number],
        scale: [number, number, number] = [1, 1, 1],
      ) => {
        const mat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x000000, roughness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...pos);
        mesh.scale.set(...scale);
        mesh.userData['organ'] = k;
        group.add(mesh);
        meshes.push({ key: k, mesh });
        return mesh;
      };

      organMesh("brain", new THREE.SphereGeometry(0.26, 24, 24), [0, 2.2, 0.05], [1, 0.85, 1]);
      organMesh("heart", new THREE.SphereGeometry(0.18, 20, 20), [-0.12, 1.15, 0.22], [1, 1.15, 0.9]);
      organMesh("lungs", new THREE.CapsuleGeometry(0.15, 0.32, 8, 16), [-0.34, 1.15, 0.08]);
      organMesh("lungs", new THREE.CapsuleGeometry(0.15, 0.32, 8, 16), [0.34, 1.15, 0.08]);
      organMesh("liver", new THREE.SphereGeometry(0.22, 20, 20), [0.24, 0.6, 0.2], [1.25, 0.6, 0.7]);
      organMesh("stomach", new THREE.SphereGeometry(0.18, 20, 20), [-0.2, 0.5, 0.22], [1, 0.9, 0.7]);
      organMesh("kidneys", new THREE.SphereGeometry(0.1, 16, 16), [-0.26, 0.15, -0.18], [0.8, 1.3, 0.8]);
      organMesh("kidneys", new THREE.SphereGeometry(0.1, 16, 16), [0.26, 0.15, -0.18], [0.8, 1.3, 0.8]);
      organMesh("bones", new THREE.CylinderGeometry(0.06, 0.06, 1.5, 12), [0, 0.9, -0.3]);

      const applyColors = () => {
        for (const { key: k, mesh } of meshes) {
          const info = organsRef.current.find((o) => o.key === k);
          const color = COLORS[info?.status ?? "good"];
          const mat = mesh.material as import("three").MeshStandardMaterial;
          mat.color.setHex(color);
          const isSel = selectedRef.current === k;
          mat.emissive.setHex(isSel ? color : 0x000000);
          mat.emissiveIntensity = isSel ? 0.65 : 0;
        }
      };
      applyColors();

      // Interaction: drag to rotate, click to select.
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let dragging = false;
      let moved = false;
      let lastX = 0;
      let lastY = 0;
      let autoSpin = true;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        moved = false;
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 3) {
          moved = true;
          autoSpin = false;
        }
        group.rotation.y += dx * 0.01;
        group.rotation.x = Math.max(-0.5, Math.min(0.5, group.rotation.x + dy * 0.005));
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onUp = (e: PointerEvent) => {
        dragging = false;
        if (moved) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(meshes.map((m) => m.mesh), false);
        const organ = hits[0]?.object.userData['organ'] as OrganKey | undefined;
        if (organ) {
          autoSpin = false;
          selectRef.current(organ);
        }
      };

      const el = renderer.domElement;
      el.style.touchAction = "none";
      el.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (autoSpin) group.rotation.y += 0.004;
        applyColors();
        renderer.render(scene, camera);
      };
      tick();
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        el.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/40 to-background sm:h-[520px]">
      <div ref={mountRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Loading 3D body…
        </div>
      )}
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-muted-foreground">
        Drag to rotate · tap an organ for insight
      </p>
    </div>
  );
}
