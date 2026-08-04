import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { useOrganStatuses, ORGAN_ACCENT, COLORS, type OrganKey } from "@/components/dashboard/Body3D";

/** Tiny, cheap per-organ three.js animation used inside each Body Systems card. */
function MiniOrgan({ organKey, color }: { organKey: OrganKey; color: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (!mount || disposed) return;
      const size = 96;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
      camera.position.set(0, 0, 2.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(size, size);
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const light = new THREE.PointLight(0x14e0c8, 1.6, 6);
      light.position.set(1, 1, 2);
      scene.add(light);

      const geo =
        organKey === "lungs"
          ? new THREE.CapsuleGeometry(0.45, 0.5, 8, 16)
          : organKey === "liver"
            ? new THREE.SphereGeometry(0.6, 18, 18)
            : organKey === "bones"
              ? new THREE.CylinderGeometry(0.18, 0.18, 1.3, 10)
              : new THREE.SphereGeometry(0.55, 20, 20);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, roughness: 0.4 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      const accent = ORGAN_ACCENT[organKey];
      let raf = 0;
      const clock = new THREE.Clock();
      const speed =
        organKey === "heart" ? 72 / 60 : organKey === "lungs" ? 16 / 60 : organKey === "stomach" ? 0.25 : organKey === "liver" ? 1 / 8 : 0.3;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        const phase = (Math.sin(t * speed * Math.PI * 2) + 1) / 2;
        const s = 1 + phase * 0.18;
        mesh.scale.set(s, s, s);
        mesh.rotation.y += 0.006;
        (mat as import("three").MeshStandardMaterial).emissive.setHex(accent);
        (mat as import("three").MeshStandardMaterial).emissiveIntensity = 0.2 + phase * 0.6;
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        renderer.dispose();
        geo.dispose();
        mat.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [organKey, color]);

  return <div ref={mountRef} className="mx-auto size-24" />;
}

const STATUS_LABEL = { good: "Healthy", watch: "Watch", risk: "Attention", none: "No data" } as const;
const STATUS_DOT = {
  good: "bg-success",
  watch: "bg-warning",
  risk: "bg-destructive",
  none: "bg-muted-foreground",
} as const;

/**
 * "Body Systems" dashboard section — a horizontally scrollable row of organ
 * cards, each with a live mini 3D animation coloured by the user's data, that
 * link to a detailed per-organ page.
 */
export function BodySystems() {
  const { organs } = useOrganStatuses();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Boxes className="size-5" /></span>
        <div>
          <h2 className="font-display text-lg font-semibold">Body Systems</h2>
          <p className="text-xs text-muted-foreground">Live 3D organ simulations built from your health data</p>
        </div>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {organs.map((o) => (
          <Link
            key={o.key}
            to="/dashboard/organs/$organ"
            params={{ organ: o.key }}
            className="flex h-[200px] w-[160px] shrink-0 flex-col items-center justify-between rounded-2xl border border-border bg-[#030711] p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-elegant"
          >
            {mounted ? <MiniOrgan organKey={o.key} color={COLORS[o.status]} /> : <div className="size-24" />}
            <div>
              <p className="font-display text-sm font-bold text-white">{o.label}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/70">
                <span className={`size-1.5 rounded-full ${STATUS_DOT[o.status]}`} />
                {STATUS_LABEL[o.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
