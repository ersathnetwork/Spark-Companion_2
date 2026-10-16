import React, { useEffect, useRef } from 'react';
import { CharacterShape, CharacterState, CharacterEmote, OutfitId } from '../types';
import { soundFX } from '../utils/audio';

interface MochiCanvasProps {
  shape?: CharacterShape;
  state?: CharacterState;
  emote?: CharacterEmote | null;
  outfit?: OutfitId;
  size?: number; // width & height in px
  className?: string;
  isMorphingToBox?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const MochiCanvas: React.FC<MochiCanvasProps> = ({
  shape = 'mochi',
  state = 'idle',
  emote = null,
  outfit = 'none',
  size = 76,
  className = '',
  isMorphingToBox = false,
  interactive = true,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentLookRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const blinkProgressRef = useRef<number>(1);
  const nextBlinkRef = useRef<number>(Date.now() + 2000);
  const squishRef = useRef<{ sx: number; sy: number }>({ sx: 1, sy: 1 });
  const timeRef = useRef<number>(0);

  // Track mouse coordinates inside window or parent
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / Math.max(150, window.innerWidth / 2);
      const dy = (e.clientY - cy) / Math.max(150, window.innerHeight / 2);
      // Clamp to [-1, 1]
      mouseTargetRef.current = {
        x: Math.max(-1, Math.min(1, dx)),
        y: Math.max(-1, Math.min(1, dy)),
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleClick = () => {
    // Squish rebound animation
    squishRef.current = { sx: 1.25, sy: 0.72 };
    soundFX.playSquish();
    if (onClick) onClick();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      timeRef.current += 0.035;
      const t = timeRef.current;
      const now = Date.now();

      // Smooth eye look tracking (spring toward mouse)
      currentLookRef.current.x += (mouseTargetRef.current.x - currentLookRef.current.x) * 0.12;
      currentLookRef.current.y += (mouseTargetRef.current.y - currentLookRef.current.y) * 0.12;

      // Handle blinks
      if (now > nextBlinkRef.current) {
        blinkProgressRef.current = 0;
        nextBlinkRef.current = now + 2500 + Math.random() * 3500;
      }
      if (blinkProgressRef.current < 1) {
        blinkProgressRef.current += 0.14;
        if (blinkProgressRef.current > 1) blinkProgressRef.current = 1;
      }

      // Handle squish relaxation
      squishRef.current.sx += (1 - squishRef.current.sx) * 0.16;
      squishRef.current.sy += (1 - squishRef.current.sy) * 0.16;

      // Dpr scaling
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = size * dpr;
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
      }

      ctx.save();
      ctx.clearRect(0, 0, px, px);
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;

      // State-specific colors & glow
      let baseGradTop = '#FFFAF5';
      let baseGradBot = '#E5D8CC';
      let glowColor = 'rgba(255, 255, 255, 0.2)';
      let lookX = currentLookRef.current.x;
      let lookY = currentLookRef.current.y;
      let tilt = 0;

      if (shape === 'galet') {
        baseGradTop = '#F7F8FA';
        baseGradBot = '#B5BAC3';
      } else if (shape === 'lueur') {
        baseGradTop = '#F0F4F8';
        baseGradBot = '#A9B7C6';
      }

      // Breathing or state adjustments
      const breathe = Math.sin(t * 2) * 1.5;
      let bodyScaleY = squishRef.current.sy;
      let bodyScaleX = squishRef.current.sx;

      if (state === 'working') {
        glowColor = '#3B9EFF';
        baseGradBot = '#C5E0FD';
      } else if (state === 'finished') {
        glowColor = '#34D399';
        baseGradBot = '#C6F6D5';
      } else if (state === 'error') {
        glowColor = '#F4505E';
        baseGradBot = '#FECDD3';
        lookX += Math.sin(t * 14) * 0.15;
      } else if (state === 'thinking') {
        glowColor = '#8B5CF6';
        lookY = -0.65;
        lookX = 0.35;
      } else if (state === 'approval') {
        glowColor = '#F5A524';
        bodyScaleY *= 1 + Math.sin(t * 6) * 0.08;
      } else if (state === 'question') {
        glowColor = '#22D3EE';
        tilt = 0.18;
      } else if (state === 'sleeping') {
        glowColor = '#94A3B8';
        baseGradBot = '#CBD5E1';
        bodyScaleY *= 1 + Math.sin(t * 1.2) * 0.05;
      } else if (state === 'dizzy') {
        glowColor = '#F472B6';
        tilt = Math.sin(t * 5) * 0.25;
      }

      // Draw ambient backdrop glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, size * 0.48);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // Transform for body (squish, breath, tilt)
      ctx.save();
      ctx.translate(cx, cy + breathe);
      ctx.rotate(tilt);
      ctx.scale(bodyScaleX, bodyScaleY);

      const r = size * 0.36;

      // Draw Main Character Body
      if (isMorphingToBox) {
        // Morphed delivery box when receiving files
        ctx.fillStyle = '#C28E58';
        ctx.strokeStyle = '#8E6032';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-r * 0.9, -r * 0.8, r * 1.8, r * 1.6, 6);
        ctx.fill();
        ctx.stroke();

        // Box tape
        ctx.fillStyle = '#E8BD8C';
        ctx.fillRect(-r * 0.25, -r * 0.8, r * 0.5, r * 1.6);
      } else if (shape === 'mochi') {
        // Fluffy flattened rice cake
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.4, 2, 0, 0, r * 1.1);
        bodyGrad.addColorStop(0, baseGradTop);
        bodyGrad.addColorStop(0.7, baseGradTop);
        bodyGrad.addColorStop(1, baseGradBot);

        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        // Squashed mochi dome
        ctx.ellipse(0, 0, r * 1.05, r * 0.88, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Blushing pink cheeks
        const blushGradL = ctx.createRadialGradient(-r * 0.55, r * 0.15, 0, -r * 0.55, r * 0.15, r * 0.22);
        blushGradL.addColorStop(0, 'rgba(255, 120, 150, 0.45)');
        blushGradL.addColorStop(1, 'transparent');
        ctx.fillStyle = blushGradL;
        ctx.beginPath();
        ctx.arc(-r * 0.55, r * 0.15, r * 0.22, 0, Math.PI * 2);
        ctx.fill();

        const blushGradR = ctx.createRadialGradient(r * 0.55, r * 0.15, 0, r * 0.55, r * 0.15, r * 0.22);
        blushGradR.addColorStop(0, 'rgba(255, 120, 150, 0.45)');
        blushGradR.addColorStop(1, 'transparent');
        ctx.fillStyle = blushGradR;
        ctx.beginPath();
        ctx.arc(r * 0.55, r * 0.15, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'galet') {
        // Matte pebble
        const galetGrad = ctx.createLinearGradient(0, -r, 0, r);
        galetGrad.addColorStop(0, baseGradTop);
        galetGrad.addColorStop(1, baseGradBot);

        ctx.fillStyle = galetGrad;
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 9;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      } else {
        // Lueur - Glowing orb
        const lueurGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
        lueurGrad.addColorStop(0, '#FFFFFF');
        lueurGrad.addColorStop(0.4, baseGradTop);
        lueurGrad.addColorStop(1, baseGradBot);

        ctx.fillStyle = lueurGrad;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      }

      // EYES RENDERING (with 3D spherical lookAt offset)
      if (!isMorphingToBox) {
        const eyeSpacing = shape === 'mochi' ? r * 0.38 : r * 0.32;
        const eyeBaseY = shape === 'mochi' ? -r * 0.08 : -r * 0.04;
        const eyeOffsetMax = r * 0.18;
        const curEyeX = lookX * eyeOffsetMax;
        const curEyeY = eyeBaseY + lookY * (eyeOffsetMax * 0.8);

        const isBlinking = blinkProgressRef.current < 0.6 || state === 'sleeping';
        const isHeart = emote === 'love';
        const isHappy = state === 'finished' || emote === 'happy';
        const isDizzy = state === 'dizzy';

        ctx.fillStyle = '#1A1412';

        if (isDizzy) {
          // Spiral dizzy eyes
          [-eyeSpacing, eyeSpacing].forEach((sideX) => {
            ctx.save();
            ctx.translate(sideX + curEyeX, curEyeY);
            ctx.rotate(t * 8);
            ctx.strokeStyle = '#1A1412';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.12, 0, Math.PI * 1.6);
            ctx.stroke();
            ctx.restore();
          });
        } else if (isHeart) {
          // Heart eyes
          [-eyeSpacing, eyeSpacing].forEach((sideX) => {
            ctx.save();
            ctx.translate(sideX + curEyeX, curEyeY - 2);
            ctx.fillStyle = '#FF4D6D';
            const s = r * 0.18;
            ctx.beginPath();
            ctx.moveTo(0, s * 0.38);
            ctx.bezierCurveTo(-s * 1.05, -s * 0.15, -s * 0.5, -s * 0.95, 0, -s * 0.38);
            ctx.bezierCurveTo(s * 0.5, -s * 0.95, s * 1.05, -s * 0.15, 0, s * 0.38);
            ctx.fill();
            ctx.restore();
          });
        } else if (isHappy) {
          // Smiling curved eyes ^ ^
          [-eyeSpacing, eyeSpacing].forEach((sideX) => {
            ctx.save();
            ctx.translate(sideX + curEyeX, curEyeY);
            ctx.strokeStyle = '#1A1412';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 2, r * 0.13, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
            ctx.restore();
          });
        } else if (isBlinking) {
          // Closed eyelid slits - -
          [-eyeSpacing, eyeSpacing].forEach((sideX) => {
            ctx.save();
            ctx.translate(sideX + curEyeX, curEyeY);
            ctx.strokeStyle = '#1A1412';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-r * 0.12, 0);
            ctx.lineTo(r * 0.12, 0);
            ctx.stroke();
            ctx.restore();
          });
        } else {
          // Normal open eyes (round or pill) with glossy white highlight reflections!
          const eyeW = shape === 'galet' ? r * 0.11 : r * 0.13;
          const eyeH = shape === 'galet' ? r * 0.24 : r * 0.17;

          [-eyeSpacing, eyeSpacing].forEach((sideX) => {
            const ex = sideX + curEyeX;
            const ey = curEyeY;

            // Pupil
            ctx.beginPath();
            ctx.ellipse(ex, ey, eyeW, eyeH, 0, 0, Math.PI * 2);
            ctx.fill();

            // Catchlight reflection (makes Mochi alive!)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(ex - eyeW * 0.3, ey - eyeH * 0.35, eyeW * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1A1412';
          });
        }

        // Tiny cute mouth
        if (state === 'working' || state === 'thinking') {
          // Concentrating tiny o mouth
          ctx.beginPath();
          ctx.arc(curEyeX, curEyeY + r * 0.22, r * 0.05, 0, Math.PI * 2);
          ctx.fill();
        } else if (isHappy || isHeart) {
          // Little smile
          ctx.strokeStyle = '#1A1412';
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(curEyeX, curEyeY + r * 0.18, r * 0.09, 0.1, Math.PI - 0.1);
          ctx.stroke();
        }
      }

      // OUTFITS & HATS
      if (outfit !== 'none' && !isMorphingToBox) {
        ctx.save();
        ctx.translate(0, -r * 0.78);

        if (outfit === 'detective') {
          // Fedora
          ctx.fillStyle = '#6E4C33';
          ctx.beginPath();
          ctx.ellipse(0, 4, r * 0.85, r * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#533621';
          ctx.beginPath();
          ctx.roundRect(-r * 0.45, -r * 0.4, r * 0.9, r * 0.45, [6, 6, 2, 2]);
          ctx.fill();

          // Ribbon
          ctx.fillStyle = '#2A180E';
          ctx.fillRect(-r * 0.45, -r * 0.08, r * 0.9, r * 0.12);
        } else if (outfit === 'beret') {
          // French Beret
          ctx.fillStyle = '#2C3E50';
          ctx.beginPath();
          ctx.ellipse(r * 0.1, -r * 0.05, r * 0.65, r * 0.3, -0.2, 0, Math.PI * 2);
          ctx.fill();
          // Stalk
          ctx.strokeStyle = '#1A252F';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(r * 0.1, -r * 0.25);
          ctx.lineTo(r * 0.15, -r * 0.35);
          ctx.stroke();
        } else if (outfit === 'party') {
          // Party Cone
          ctx.fillStyle = '#E11D48';
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.7);
          ctx.lineTo(r * 0.38, 2);
          ctx.lineTo(-r * 0.38, 2);
          ctx.closePath();
          ctx.fill();

          // Pompom
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.arc(0, -r * 0.72, r * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else if (outfit === 'sunglasses') {
          // Cool sunglasses right over the eyes
          ctx.restore();
          ctx.save();
          const eyeY = shape === 'mochi' ? -r * 0.08 : -r * 0.04;
          ctx.translate(lookX * r * 0.14, eyeY + lookY * r * 0.08);

          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.roundRect(-r * 0.6, -r * 0.18, r * 0.52, r * 0.32, 4);
          ctx.roundRect(r * 0.08, -r * 0.18, r * 0.52, r * 0.32, 4);
          ctx.fill();

          // Bridge
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-r * 0.08, -r * 0.06);
          ctx.lineTo(r * 0.08, -r * 0.06);
          ctx.stroke();
        } else if (outfit === 'wizard') {
          // Purple Wizard Hat
          ctx.fillStyle = '#7C3AED';
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.9);
          ctx.lineTo(r * 0.45, 3);
          ctx.lineTo(-r * 0.45, 3);
          ctx.closePath();
          ctx.fill();

          // Brim
          ctx.beginPath();
          ctx.ellipse(0, 3, r * 0.75, r * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();

          // Gold star
          ctx.fillStyle = '#FCD34D';
          ctx.beginPath();
          ctx.arc(0, -r * 0.35, r * 0.1, 0, Math.PI * 2);
          ctx.fill();
        } else if (outfit === 'winter') {
          // Knit beanie
          ctx.fillStyle = '#0284C7';
          ctx.beginPath();
          ctx.arc(0, -r * 0.15, r * 0.6, Math.PI, 0);
          ctx.fill();
          // Brim
          ctx.fillStyle = '#E0F2FE';
          ctx.beginPath();
          ctx.roundRect(-r * 0.62, -r * 0.2, r * 1.24, r * 0.22, 4);
          ctx.fill();
          // Pompom
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, -r * 0.78, r * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // STATE BADGES (Exclamation for approval, question mark for question, Zzz for sleeping)
      if (state === 'approval') {
        ctx.save();
        ctx.translate(r * 0.65, -r * 0.65);
        ctx.fillStyle = '#F5A524';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(r * 0.28)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 1);
        ctx.restore();
      } else if (state === 'question') {
        ctx.save();
        ctx.translate(r * 0.65, -r * 0.65);
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(r * 0.26)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 1);
        ctx.restore();
      } else if (state === 'sleeping') {
        ctx.save();
        ctx.fillStyle = '#94A3B8';
        ctx.font = `bold ${Math.round(r * 0.26)}px sans-serif`;
        const zOff = (t * 1.5) % 3;
        ctx.fillText('z', r * 0.6 + zOff * 4, -r * 0.4 - zOff * 6);
        ctx.fillText('Z', r * 0.8 + zOff * 5, -r * 0.7 - zOff * 8);
        ctx.restore();
      } else if (state === 'ratelimit') {
        // Sweat drop
        ctx.save();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(r * 0.7, -r * 0.35, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // restore body transform
      ctx.restore(); // restore dpr

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [shape, state, emote, outfit, size, isMorphingToBox]);

  return (
    <div
      className={`relative inline-block select-none ${interactive ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      onClick={interactive ? handleClick : undefined}
      title="Click Mochi to squish & play!"
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
};
