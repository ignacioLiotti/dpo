"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface GradientAvatarProps {
  username: string
  size?: number
  className?: string
}

export function GradientAvatar({ username, size = 45, className = "" }: GradientAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Generate a deterministic number between min and max based on the username and salt
  const getSeededRandom = (username: string, salt: string, min: number, max: number) => {
    // Use a simpler seed generation, Math.random() was making it non-deterministic
    const seed = username + salt + '984asdasdrsqweqweqasdasdar98798'
    let hash = 0

    // Simple string hash function
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }

    // Normalize between 0 and 1, then scale to range
    const random = Math.abs(hash) / 2147483647; // Use max 32-bit signed integer value
    return min + random * (max - min);
  }

  // Convert HSL color to Hex format
  const hslToHex = (h: number, s: number, l: number): string => {
    const numToHexLocal = (num: number) => {
      // Clamp num between 0 and 1 before scaling
      const clampedNum = Math.min(Math.max(0, num), 1);
      const hex = Math.round(clampedNum * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    // Ensure h is within [0, 360)
    h = ((h % 360) + 360) % 360;

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2

    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { [r, g, b] = [c, x, 0] }
    else if (h >= 60 && h < 120) { [r, g, b] = [x, c, 0] }
    else if (h >= 120 && h < 180) { [r, g, b] = [0, c, x] }
    else if (h >= 180 && h < 240) { [r, g, b] = [0, x, c] }
    else if (h >= 240 && h < 300) { [r, g, b] = [x, 0, c] }
    else { [r, g, b] = [c, 0, x] } // h >= 300 && h < 360

    const rHex = numToHexLocal(r + m)
    const gHex = numToHexLocal(g + m)
    const bHex = numToHexLocal(b + m)

    return `#${rHex}${gHex}${bHex}`
  }

  // Generate a color based on hue, saturation, and lightness derived from username
  const generateColor = (username: string, salt: string, hue: number) => {
    const s = getSeededRandom(username, salt + "sat", 0.65, 0.95) // Increased saturation
    const l = getSeededRandom(username, salt + "light", 0.4, 0.65) // Keep lightness range
    return hslToHex(hue, s, l)
  }

  // Generate the gradient for the avatar
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = size * 2 // Higher resolution for better quality
    canvas.height = size * 2

    // Generate distinct hues based on username
    const baseHue = getSeededRandom(username, "baase", 0, 360);
    // const topHue = (baseHue + getSeededRandom(username, "topOffset", 0, 30)) // Smaller offset for top
    // const bottomHue = (baseHue + getSeededRandom(username, "bottomOffset", -30, 0)) // Distinct bottom hue

    const hueOffset = getSeededRandom(username, "hueOffset", 0, 90);
    const topHue = (baseHue + hueOffset)
    const bottomHue = (baseHue + -hueOffset)
    // Generate colors using the generated hues
    const topColor = generateColor(username, "top", topHue);
    const bottomColor = generateColor(username, "bottom", bottomHue);

    // Sine wave parameters (derived from username for consistency)
    const waveFrequency = getSeededRandom(username, "waveFrequency", 1, 3)
    const waveAmplitude = getSeededRandom(username, "waveAmplitude", 80, 100)
    const wavePhase = getSeededRandom(username, "wavePhase", 0, Math.PI * 2);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create offscreen buffer for the distorted image
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offCtx = offscreenCanvas.getContext('2d');

    if (!offCtx) return;

    // First, draw the normal gradient to the offscreen canvas
    const radius = canvas.width / 2;

    // Get angle for the gradient direction
    const angle = getSeededRandom(username, "angle", 0, 360);
    const gradientAngle = angle * (Math.PI / 180);

    // Adjust gradient start/end points to ensure full coverage
    const x0 = radius - Math.cos(gradientAngle) * radius;
    const y0 = radius - Math.sin(gradientAngle) * radius;
    const x1 = radius + Math.cos(gradientAngle) * radius;
    const y1 = radius + Math.sin(gradientAngle) * radius;

    const gradient = offCtx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    // Fill entire offscreen canvas with gradient (avoid transparent edges causing black spots)
    offCtx.fillStyle = gradient;
    offCtx.beginPath();
    offCtx.arc(offscreenCanvas.width / 2, offscreenCanvas.height / 2, radius, 0, Math.PI * 2);
    offCtx.fill();
    offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Now, apply the wave distortion by sampling from the offscreen canvas
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    // Wave parameters - adjust these for different wave effects
    const waveDirection = getSeededRandom(username, "waveDir", 0, Math.PI); // Direction of wave propagation

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Calculate distance from center
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only process pixels within the circle
        if (distance <= radius) {
          // Create wave distortion across the entire image
          // Calculate directional components for the wave
          const xComponent = Math.cos(waveDirection);
          const yComponent = Math.sin(waveDirection);

          // Primary wave - moves along the wave direction
          const primaryWave = Math.sin((x * xComponent + y * yComponent) / (canvas.width / waveFrequency) * Math.PI * 2 + wavePhase);

          // Secondary wave - perpendicular to create more complex pattern
          const x2Component = Math.cos(waveDirection + Math.PI / 2);
          const y2Component = Math.sin(waveDirection + Math.PI / 2);
          const secondaryWave = Math.sin((x * x2Component + y * y2Component) / (canvas.width / (waveFrequency * 0.7)) * Math.PI * 2 + wavePhase * 1.5);

          // Combine waves and adjust amplitude
          // Make amplitude stronger in the middle and fade toward edges for a smooth circle edge
          const edgeFade = Math.pow(1 - distance / radius, 0.5); // Smooth fade at edges
          const waveStrength = waveAmplitude * edgeFade;

          // Calculate wave offset for both dimensions
          const offsetX = (primaryWave * 0.7 + secondaryWave * 0.3) * waveStrength * xComponent;
          const offsetY = (primaryWave * 0.7 + secondaryWave * 0.3) * waveStrength * yComponent;

          // Sample from the source with the wave offset
          const sampleX = Math.max(0, Math.min(canvas.width - 1, x + offsetX));
          const sampleY = Math.max(0, Math.min(canvas.height - 1, y + offsetY));

          // Sample color from the original gradient
          const imageDataOffscreen = offCtx.getImageData(sampleX, sampleY, 1, 1).data;

          // Set pixel in the final image
          const pixelIndex = (y * canvas.width + x) * 4;
          data[pixelIndex] = imageDataOffscreen[0];     // R
          data[pixelIndex + 1] = imageDataOffscreen[1]; // G
          data[pixelIndex + 2] = imageDataOffscreen[2]; // B
          data[pixelIndex + 3] = 255;                   // A (fully opaque)
        } else {
          // Pixel is outside the circle, make it transparent
          const pixelIndex = (y * canvas.width + x) * 4;
          data[pixelIndex + 3] = 0;
        }
      }
    }

    // Add noise effect (optional, can be adjusted or removed)
    const noiseAmount = getSeededRandom(username, "noise", 0.01, 0.02); // Reduced noise
    const noiseScale = getSeededRandom(username, "scale", 50, 150);

    if (noiseAmount > 0) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // Only apply noise to non-transparent pixels
          const noiseVal = (Math.random() * 2 - 1) * noiseAmount * 255;
          const noiseFactor = (i % Math.floor(noiseScale) === 0) ? 1 : 0.3;
          const noise = noiseVal * noiseFactor;

          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
      }
    }

    // Put the processed image data back to the canvas
    ctx.putImageData(imageData, 0, 0);

    // Apply the canvas as background to the avatar fallback
    if (avatarRef.current) {
      const dataUrl = canvas.toDataURL("image/png");
      avatarRef.current.style.backgroundImage = `url(${dataUrl})`;
    }
  }, [username, size]); // Dependencies: username and size

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Avatar className={className} style={{ width: size, height: size }}>
        <AvatarFallback
          ref={avatarRef}
          className="text-white font-medium"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.4,
            backgroundSize: "cover",
            backgroundColor: 'transparent',
          }}
        >
          {/* Display initials only if background fails? Or remove completely? Removing for now.*/}
        </AvatarFallback>
      </Avatar>
    </>
  );
}