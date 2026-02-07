import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeScene = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.6, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const pyramidMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.75,
      roughness: 0.2,
      emissive: new THREE.Color(0x2e230c),
      emissiveIntensity: 0.8,
    });

    const pyramidGeometry = new THREE.ConeGeometry(1.05, 1.7, 4, 1);
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.rotation.y = Math.PI / 4;

    const pyramidEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(pyramidGeometry),
      new THREE.LineBasicMaterial({
        color: 0xffe7a6,
        transparent: true,
        opacity: 0.55,
      })
    );
    pyramidEdges.rotation.y = Math.PI / 4;

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfff2c4,
        metalness: 0.4,
        roughness: 0.1,
        emissive: new THREE.Color(0xffd56b),
        emissiveIntensity: 1.2,
      })
    );

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.06, 12, 80),
      new THREE.MeshStandardMaterial({
        color: 0x5a461b,
        metalness: 0.85,
        roughness: 0.25,
        emissive: new THREE.Color(0x3a2a0e),
        emissiveIntensity: 0.45,
      })
    );
    ring.rotation.x = Math.PI / 2.4;

    const group = new THREE.Group();
    group.add(pyramid, pyramidEdges, core, ring);
    scene.add(group);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(2.8, 2.4, 3.6);

    const rimLight = new THREE.PointLight(0xd4af37, 0.9, 6);
    rimLight.position.set(-2.6, 1.4, 2.2);

    const fillLight = new THREE.PointLight(0x6b5c2a, 0.5, 5);
    fillLight.position.set(0, -1.8, 2.2);

    scene.add(ambientLight, keyLight, rimLight, fillLight);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    let animationFrame = null;

    const render = () => {
      renderer.render(scene, camera);
    };

    const animate = () => {
      const t = Date.now() * 0.0005;
      group.rotation.y += 0.0028;
      group.rotation.x = Math.sin(t) * 0.08;
      core.rotation.y -= 0.006;
      ring.rotation.z += 0.0018;
      core.position.y = Math.sin(t * 1.4) * 0.08;
      render();
      animationFrame = window.requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) {
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      render();
    }

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      renderer.dispose();
      pyramid.geometry.dispose();
      pyramidMaterial.dispose();
      pyramidEdges.geometry.dispose();
      pyramidEdges.material.dispose();
      core.geometry.dispose();
      core.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      ambientLight.dispose();
      keyLight.dispose();
      rimLight.dispose();
      container.innerHTML = '';
    };
  }, []);

  return <div className="three-scene" ref={containerRef} aria-hidden="true" />;
};

export default ThreeScene;
