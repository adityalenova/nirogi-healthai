import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/profile.functions";
import { getHealthScore } from "@/lib/health-score.functions";
import { getHeartRate } from "@/lib/wellness.functions";

export type OrganKey = "brain" | "heart" | "lungs" | "liver" | "stomach" | "kidneys" | "bones";

export type OrganStatus = {
  key: OrganKey;
  label: string;
  status: "good" | "watch" | "risk" | "none";
  note: string;
};

export const COLORS: Record<OrganStatus["status"], number> = {
  good: 0x34d399,
  watch: 0xfbbf24,
  risk: 0xf87171,
  none: 0x94a3b8,
};

/** Organ-specific accent colour used for the live animation glow. */
export const ORGAN_ACCENT: Record<OrganKey, number> = {
  brain: 0x60a5fa,
  heart: 0xff5566,
  lungs: 0x22d3ee,
  liver: 0xf97316,
  stomach: 0xfbbf24,
  kidneys: 0x38bdf8,
  bones: 0xe2e8f0,
};

export type OrganInfo = {
  key: OrganKey;
  label: string;
  whatItDoes: string;
  specialist: string;
  toolSlugs: string[];
};

export const ORGAN_INFO: Record<OrganKey, OrganInfo> = {
  brain: {
    key: "brain",
    label: "Brain & mind",
    whatItDoes:
      "Your command centre — it runs memory, mood, focus and every signal your body sends and receives. Sleep and stress load affect it the most day-to-day.",
    specialist: "Neurologist / Psychiatrist",
    toolSlugs: ["cancersense", "scaniq"],
  },
  heart: {
    key: "heart",
    label: "Heart & circulation",
    whatItDoes:
      "A muscular pump that beats roughly 100,000 times a day, pushing oxygen-rich blood to every organ. Its rhythm and rate are strong early indicators of overall health.",
    specialist: "Cardiologist",
    toolSlugs: ["heartsense", "cancersense"],
  },
  lungs: {
    key: "lungs",
    label: "Lungs & breathing",
    whatItDoes:
      "Two spongy organs that exchange oxygen and carbon dioxide roughly 16 times a minute at rest, feeding oxygen into the bloodstream your whole body relies on.",
    specialist: "Pulmonologist",
    toolSlugs: ["sensecheck", "cancersense"],
  },
  liver: {
    key: "liver",
    label: "Liver & metabolism",
    whatItDoes:
      "Your body's chemical processing plant — it clears toxins, manages blood sugar and produces the bile that digests fat. It regenerates but is very sensitive to alcohol and excess weight.",
    specialist: "Hepatologist / Gastroenterologist",
    toolSlugs: ["sugarsense", "medguard"],
  },
  stomach: {
    key: "stomach",
    label: "Stomach & gut",
    whatItDoes:
      "Breaks food down with acid and enzymes in slow peristaltic waves, then hands nutrients to the intestines. Stress and irregular meals are its biggest disruptors.",
    specialist: "Gastroenterologist",
    toolSlugs: ["calorieeye", "medguard"],
  },
  kidneys: {
    key: "kidneys",
    label: "Kidneys & hydration",
    whatItDoes:
      "A pair of filters that clean roughly 180 litres of blood a day, balancing fluids, salts and blood pressure. They rely heavily on you staying hydrated.",
    specialist: "Nephrologist",
    toolSlugs: ["sugarsense", "medverify"],
  },
  bones: {
    key: "bones",
    label: "Bones & joints",
    whatItDoes:
      "Your structural frame and mineral store — bones remodel constantly and joints need regular movement and strength work to stay resilient.",
    specialist: "Orthopedist",
    toolSlugs: ["scaniq", "cancersense"],
  },
};

const has = (text: string | null | undefined, words: string[]) => {
  const t = (text ?? "").toLowerCase();
  return words.some((w) => t.includes(w));
};

/**
 * Shared hook that turns the user's saved profile + health score into a
 * colour-coded organ status list (good / watch / risk / no-data-yet). Reused
 * by the full 3D body view, the Body Systems dashboard cards and each organ's
 * detail page so the mapping stays in one place.
 */
export function useOrganStatuses() {
  const fnProfile = useServerFn(getMyProfile);
  const fnScore = useServerFn(getHealthScore);
  const fnHeart = useServerFn(getHeartRate);
  const { data: profileData, isLoading: loadingProfile } = useQuery({ queryKey: ["my-profile"], queryFn: () => fnProfile() });
  const { data: score, isLoading: loadingScore } = useQuery({ queryKey: ["health-score"], queryFn: () => fnScore() });
  const { data: heart } = useQuery({ queryKey: ["heart-rate", null], queryFn: () => fnHeart({ data: {} }) });

  const organs: OrganStatus[] = useMemo(() => {
    const p = profileData?.profile;
    const conditions = `${p?.health_conditions ?? ""} ${p?.family_history ?? ""}`;
    const bmi = p?.bmi ?? null;
    const pillar = (k: string) => score?.pillars?.find((x) => x.key === k)?.points ?? null;
    const sleep = pillar("sleep");
    const activity = pillar("activity");
    const hydration = pillar("hydration");
    const hasProfile = !!p && (p.full_name || p.age || p.health_conditions);

    const heartRisk = has(conditions, ["heart", "cardiac", "hypertension", "blood pressure", "cholesterol"]);
    const lungRisk = has(conditions, ["asthma", "copd", "smok", "bronch", "lung"]);
    const liverRisk = has(conditions, ["liver", "fatty", "alcohol", "hepat"]);
    const stomachRisk = has(conditions, ["gastr", "acidity", "ulcer", "ibs", "reflux"]);
    const kidneyRisk = has(conditions, ["kidney", "renal", "stone"]);
    const boneRisk = has(conditions, ["arthrit", "osteo", "joint", "back pain"]);
    const brainRisk = has(conditions, ["migraine", "anxiety", "depress", "insomnia", "stress"]);

    return [
      {
        key: "brain",
        label: "Brain & mind",
        status: brainRisk ? "risk" : sleep != null && sleep < 12 ? "watch" : sleep == null ? "none" : "good",
        note: brainRisk
          ? "You've noted a neurological or mental-health condition. Sleep, breathing sessions and steady routines help most."
          : sleep != null && sleep < 12
            ? "Short or poor sleep is the biggest drag on focus and mood right now."
            : sleep == null
              ? "No sleep data logged yet — track a few nights to see this update."
              : "Sleep and stress markers look steady. Keep the wind-down routine going.",
      },
      {
        key: "heart",
        label: "Heart & circulation",
        status: heartRisk ? "risk" : activity != null && activity < 10 ? "watch" : activity == null && !heart?.last ? "none" : "good",
        note: heartRisk
          ? "Cardiovascular risk noted in your profile — keep to your medicines and log your pulse regularly."
          : activity != null && activity < 10
            ? "Under 150 active minutes this week. Brisk walking is the single best heart habit."
            : activity == null && !heart?.last
              ? "No activity or heart-rate data yet — log a workout or a pulse reading."
              : "Activity levels are supporting your heart well.",
      },
      {
        key: "lungs",
        label: "Lungs & breathing",
        status: lungRisk ? "risk" : "good",
        note: lungRisk
          ? "Respiratory condition noted. Avoid smoke and pollution peaks; use the guided breathing sessions."
          : "No respiratory flags. Try a 5-minute breathing session to build lung capacity.",
      },
      {
        key: "liver",
        label: "Liver & metabolism",
        status: liverRisk ? "risk" : bmi != null && bmi >= 30 ? "watch" : bmi == null ? "none" : "good",
        note: liverRisk
          ? "Liver-related history noted — avoid alcohol and check with your doctor before new medicines."
          : bmi != null && bmi >= 30
            ? "A higher BMI raises fatty-liver risk. Small calorie deficits work better than crash diets."
            : bmi == null
              ? "Add your weight and height to estimate this."
              : "Metabolic markers look fine from what you've shared.",
      },
      {
        key: "stomach",
        label: "Stomach & gut",
        status: stomachRisk ? "watch" : hasProfile ? "good" : "none",
        note: stomachRisk
          ? "Digestive symptoms noted — regular meal times and fewer late dinners usually help."
          : hasProfile
            ? "No digestive flags. Fibre and water keep this system happy."
            : "Complete your profile to see this update.",
      },
      {
        key: "kidneys",
        label: "Kidneys & hydration",
        status: kidneyRisk ? "risk" : hydration != null && hydration < 12 ? "watch" : hydration == null ? "none" : "good",
        note: kidneyRisk
          ? "Kidney history noted — stay hydrated and avoid painkillers that aren't prescribed."
          : hydration != null && hydration < 12
            ? "Hydration is below your goal. Water reminders in the tracker will fix that fast."
            : hydration == null
              ? "No hydration data yet — log a glass of water to start tracking."
              : "Hydration is on track for healthy kidney function.",
      },
      {
        key: "bones",
        label: "Bones & joints",
        status: boneRisk ? "watch" : hasProfile ? "good" : "none",
        note: boneRisk
          ? "Joint or bone pain noted — low-impact activity plus vitamin D and calcium usually help."
          : hasProfile
            ? "No bone or joint flags recorded. Strength work twice a week keeps it that way."
            : "Complete your profile to see this update.",
      },
    ];
  }, [profileData, score, heart]);

  const bpm = heart?.last?.bpm ?? heart?.avg ?? 72;

  return { organs, bpm, isLoading: loadingProfile || loadingScore };
}

/**
 * Lightweight procedural 3D body. Organs are simple meshes coloured by the
 * user's health data with live physiological animation (heartbeat, breathing,
 * peristalsis, liver pulse and a red blood-flow particle stream). three.js is
 * imported lazily so nothing runs during SSR. Tapping an organ zooms the
 * camera to it and reports the selection to the parent.
 */
export function Body3D({
  organs,
  selected,
  onSelect,
  bpm = 72,
}: {
  organs: OrganStatus[];
  selected: OrganKey | null;
  onSelect: (k: OrganKey) => void;
  bpm?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const organsRef = useRef(organs);
  organsRef.current = organs;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

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
      scene.background = new THREE.Color(0x030711);
      scene.fog = new THREE.FogExp2(0x030711, 0.05);
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.2, 6.4);
      const camTarget = new THREE.Vector3(0, 0.5, 0);
      const camGoalPos = camera.position.clone();
      const camGoalTarget = camTarget.clone();

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x33507a, 0.55));
      const key = new THREE.DirectionalLight(0x7ff0e0, 0.9);
      key.position.set(3, 5, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x2dd4bf, 0.6);
      rim.position.set(-4, 1, -4);
      scene.add(rim);
      // Blue-teal ambient glow rising from below, like a scan bed light.
      const under = new THREE.PointLight(0x14e0c8, 2.4, 8, 2);
      under.position.set(0, -3, 1.2);
      scene.add(under);

      const group = new THREE.Group();
      scene.add(group);

      // Translucent x-ray body shell so organs read clearly through the skin.
      const shellMat = new THREE.MeshPhysicalMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.1,
        roughness: 0.3,
        metalness: 0.05,
        transmission: 0.4,
        side: THREE.DoubleSide,
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
      type OrganMesh = { key: OrganKey; mesh: import("three").Mesh; basePos: import("three").Vector3; baseScale: import("three").Vector3 };
      const meshes: OrganMesh[] = [];
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
        meshes.push({ key: k, mesh, basePos: mesh.position.clone(), baseScale: mesh.scale.clone() });
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

      // Blood-flow particles streaming out from the heart (capped for perf).
      const PARTICLE_COUNT = 60;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const seeds = new Float32Array(PARTICLE_COUNT);
      const heartPos = meshes.find((m) => m.key === "heart")!.basePos;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = heartPos.x;
        positions[i * 3 + 1] = heartPos.y;
        positions[i * 3 + 2] = heartPos.z;
        seeds[i] = Math.random();
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({ color: 0xff3b4e, size: 0.03, transparent: true, opacity: 0.85 });
      const particles = new THREE.Points(particleGeo, particleMat);
      group.add(particles);
      const dirs = Array.from({ length: PARTICLE_COUNT }, () => new THREE.Vector3(
        (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.3) * 1.6,
        (Math.random() - 0.5) * 1.4,
      ));

      const applyColors = () => {
        for (const { key: k, mesh } of meshes) {
          const info = organsRef.current.find((o) => o.key === k);
          const color = COLORS[info?.status ?? "none"];
          const mat = mesh.material as import("three").MeshStandardMaterial;
          mat.color.setHex(color);
          const isSel = selectedRef.current === k;
          if (!isSel) {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      };
      applyColors();

      // Interaction: drag to rotate, click to select + zoom.
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let dragging = false;
      let moved = false;
      let lastX = 0;
      let lastY = 0;
      let autoSpin = true;

      const zoomTo = (k: OrganKey | null) => {
        if (!k) {
          camGoalPos.set(0, 0.2, 6.4);
          camGoalTarget.set(0, 0.5, 0);
          return;
        }
        const m = meshes.find((x) => x.key === k);
        if (!m) return;
        const p = m.basePos;
        camGoalTarget.set(p.x, p.y, p.z);
        camGoalPos.set(p.x * 1.4, p.y + 0.25, p.z + 1.9);
      };
      zoomTo(selected);

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
          zoomTo(organ);
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

      let lastSel: OrganKey | null = selected;
      let raf = 0;
      const clock = new THREE.Clock();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();

        if (selectedRef.current !== lastSel) {
          lastSel = selectedRef.current;
          zoomTo(lastSel);
        }

        if (autoSpin) group.rotation.y += 0.0025;
        applyColors();

        // Heartbeat — real-ish BPM driven pulse + red glow.
        const heartHz = Math.max(0.4, bpmRef.current / 60);
        const heartPhase = Math.max(0, Math.sin(t * heartHz * Math.PI * 2)) ** 3;
        const heart = meshes.find((m) => m.key === "heart");
        if (heart) {
          const s = 1 + heartPhase * 0.22;
          heart.mesh.scale.set(heart.baseScale.x * s, heart.baseScale.y * s, heart.baseScale.z * s);
          const mat = heart.mesh.material as import("three").MeshStandardMaterial;
          mat.emissive.setHex(0xff2233);
          mat.emissiveIntensity = 0.25 + heartPhase * 0.9;
        }

        // Breathing — 16 breaths/min lung expansion + cyan glow.
        const breathHz = 16 / 60;
        const breathPhase = (Math.sin(t * breathHz * Math.PI * 2) + 1) / 2;
        for (const m of meshes.filter((x) => x.key === "lungs")) {
          const s = 1 + breathPhase * 0.18;
          m.mesh.scale.set(m.baseScale.x * s, m.baseScale.y * s * 1.05, m.baseScale.z * s);
          const mat = m.mesh.material as import("three").MeshStandardMaterial;
          mat.emissive.setHex(0x22d3ee);
          mat.emissiveIntensity = 0.15 + breathPhase * 0.55;
        }

        // Stomach peristaltic wave — one ripple every 4 seconds, amber glow.
        const stomachPhase = (t % 4) / 4;
        const wave = Math.exp(-((stomachPhase - 0.5) ** 2) * 40);
        const stomach = meshes.find((m) => m.key === "stomach");
        if (stomach) {
          const s = 1 + wave * 0.15;
          stomach.mesh.scale.set(stomach.baseScale.x * s, stomach.baseScale.y, stomach.baseScale.z * s);
          const mat = stomach.mesh.material as import("three").MeshStandardMaterial;
          mat.emissive.setHex(0xfbbf24);
          mat.emissiveIntensity = 0.1 + wave * 0.7;
        }

        // Liver — slow 8-second pulse, orange glow.
        const liverPhase = (Math.sin((t / 8) * Math.PI * 2) + 1) / 2;
        const liver = meshes.find((m) => m.key === "liver");
        if (liver) {
          const s = 1 + liverPhase * 0.08;
          liver.mesh.scale.set(liver.baseScale.x * s, liver.baseScale.y * s, liver.baseScale.z * s);
          const mat = liver.mesh.material as import("three").MeshStandardMaterial;
          mat.emissive.setHex(0xf97316);
          mat.emissiveIntensity = 0.1 + liverPhase * 0.45;
        }

        // Selected organ keeps its status-colour highlight on top of any glow.
        if (selectedRef.current) {
          const sel = meshes.find((m) => m.key === selectedRef.current);
          if (sel) {
            const info = organsRef.current.find((o) => o.key === sel.key);
            const mat = sel.mesh.material as import("three").MeshStandardMaterial;
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.5);
            if (mat.emissiveIntensity < 0.55) mat.emissive.setHex(COLORS[info?.status ?? "none"]);
          }
        }

        // Blood flow particles pulse outward from the heart on each beat.
        const posAttr = particleGeo.getAttribute("position") as import("three").BufferAttribute;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const phase = (t * heartHz + seeds[i]) % 1;
          const d = dirs[i];
          posAttr.setXYZ(
            i,
            heartPos.x + d.x * phase,
            heartPos.y + d.y * phase,
            heartPos.z + d.z * phase,
          );
        }
        posAttr.needsUpdate = true;
        particleMat.opacity = 0.15 + heartPhase * 0.6;

        // Smooth camera zoom toward the selected organ.
        camera.position.lerp(camGoalPos, 0.06);
        camTarget.lerp(camGoalTarget, 0.06);
        camera.lookAt(camTarget);

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
        particleGeo.dispose();
        particleMat.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-[#030711] sm:h-[520px]">
      <div ref={mountRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Loading 3D body…
        </div>
      )}
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-white/60">
        Drag to rotate · tap an organ to zoom in
      </p>
    </div>
  );
}
