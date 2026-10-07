/**
 * Rookies - Turtle Racer Entity
 * Ultra-Cute Chibi Baby Sea Turtle Racer:
 * - Adorable chubby baby turtle proportions with sweet rosy blushing cheeks
 * - Large expressive kawaii anime eyes with multi-specular catchlight sparkles
 * - Charming curved baby smile that opens into a cheering mouth with pink tongue on crowd roar
 * - Stylish aerodynamic aviator goggles perched on the crown/forehead (eyes 100% visible)
 * - Organic, hydrodynamic curved baby sea turtle paddle flippers with natural swimming flutter
 * - Domed candy-gloss carapace with soft rounded scutes and team emblem
 * - Compact dual micro-booster jetpack with pulsing rocket exhaust & star sparkle particles
 * - Pure procedural HTML5 Canvas vector art (Zero external assets, zero emojis)
 */

class TurtleRacer {
  constructor(options) {
    this.name = options.name || 'Racer';
    this.team = options.team; // 'boys' or 'girls'
    this.laneY = options.laneY || 200;

    this.distance = 0;
    this.targetDistance = options.targetDistance || 6000;
    this.screenX = 120;

    // Physics tuned for lengthy, dramatic races
    this.speed = 0;
    this.maxSpeed = 8.5;
    this.acceleration = 0;
    this.friction = 0.94;

    // Madras College (MEC) Color Palettes & Chibi Styling
    if (this.team === 'boys') {
      // Boys: MEC Startup Lime skin + Tech Indigo/Purple shell + Electric Cyan accents
      this.colorSkin = '#bef264';         // Sunny baby lime
      this.colorSkinLight = '#ecfccb';    // Pale cream lime highlight
      this.colorSkinShadow = '#65a30d';   // Soft moss shadow
      this.colorSkinContour = '#365314';  // Dark forest line
      this.colorCheek = 'rgba(255, 120, 160, 0.42)'; // Rosy peach blush

      this.colorShell = '#312e81';        // Deep MEC Royal Indigo
      this.colorShellTop = '#6366f1';     // Vivid MEC Tech Purple
      this.colorShellRim = '#a78bfa';     // Glowing Iris rim
      this.colorPattern = '#c4b5fd';      // Soft lavender scute seams
      this.colorNeon = '#818cf8';         // Tech purple neon
      this.colorThruster = '#06b6d4';     // Electric cyan thruster flame
      this.eyeColor = '#3b82f6';          // Vivid sapphire iris
      this.goggleColor = '#06b6d4';       // Cyan aviator lenses
      this.gearType = 'goggles';
    } else {
      // Girls: MEC Fresh Lime skin + Sunset Coral/Ruby shell + Peach/Gold accents
      this.colorSkin = '#bef264';         // Sunny baby lime
      this.colorSkinLight = '#ecfccb';    // Pale cream lime highlight
      this.colorSkinShadow = '#65a30d';   // Soft moss shadow
      this.colorSkinContour = '#365314';  // Dark forest line
      this.colorCheek = 'rgba(251, 113, 133, 0.52)'; // Cute rosy pink blush

      this.colorShell = '#9f1239';        // Deep MEC Crimson Ruby
      this.colorShellTop = '#f43f5e';     // Vivid MEC Sunset Rose
      this.colorShellRim = '#fb7185';     // Glowing Coral rim
      this.colorPattern = '#fed7aa';      // Warm peach scute seams
      this.colorNeon = '#ff7c77';         // MEC Coral neon
      this.colorThruster = '#ff753a';     // Sunset orange thruster flame
      this.eyeColor = '#f43f5e';          // Vivid ruby iris
      this.goggleColor = '#ff7c77';       // Coral racing lenses
      this.gearType = 'visor';
    }

    this.paddleCycle = 0;
    this.bobCycle = 0;
    this.mouthOpen = 0;
    this.blinkTimer = Math.random() * 2 + 1;
    this.isBlinking = false;

    // Laser speed streaks & star particles
    this.particles = [];
  }

  update(db, isActive, isTurbo, dt = 1/60) {
    const floor = (typeof window !== 'undefined' && window.gameAudio && window.gameAudio.noiseFloor) ? window.gameAudio.noiseFloor : 42;

    if (isActive && db > floor) {
      const vocalMargin = Math.max(0, db - floor);
      // Normalized vocal drive from ambient floor up to crowd roar (~44 dB above room floor)
      const drive = Math.min(1.25, vocalMargin / 44);
      const powerFactor = Math.pow(drive, 1.3);
      this.acceleration = powerFactor * 0.46;
      if (isTurbo) {
        this.acceleration *= 1.38;
      }
    } else {
      this.acceleration = 0;
    }

    this.speed += this.acceleration;
    this.speed *= this.friction;
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    if (this.speed < 0.01) this.speed = 0;

    this.distance += this.speed;

    const paddleSpeed = Math.max(0.8, this.speed * 1.3);
    this.paddleCycle += paddleSpeed * 0.16;
    this.bobCycle += 0.08;

    const targetMouth = Math.min(1, Math.max(0, (db - floor) / 36));
    this.mouthOpen += (targetMouth - this.mouthOpen) * 0.25;

    // Natural cute blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.14) {
        this.isBlinking = false;
        this.blinkTimer = Math.random() * 3.5 + 2.0;
      }
    }

    // Spawn cute star & ember particles
    if (this.speed > 1.0 || isTurbo) {
      const count = isTurbo ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const isStar = Math.random() > 0.55;
        this.particles.push({
          x: this.screenX - 44,
          y: this.laneY + (Math.random() - 0.5) * 14,
          vx: -(this.speed * 1.8 + Math.random() * 5 + 3),
          vy: (Math.random() - 0.5) * 2.2,
          size: isStar ? (Math.random() * 4 + 3) : (Math.random() * 3 + 1.5),
          isStar: isStar,
          color: Math.random() > 0.35 ? this.colorNeon : '#ffffff',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 6,
          life: 1.0,
          decay: 3.2
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed * dt;
      p.life -= dt * p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    const x = this.screenX;
    const y = this.laneY + Math.sin(this.bobCycle) * 3;

    // 1. Draw Glossy Track Floor Reflection
    this._drawFloorReflection(ctx, x, y);

    // 2. Draw Horizontal Laser Speed Streaks
    this._drawLaserSpeedStreaks(ctx, x, y);

    // 3. Draw Sparkle & Ember Particles
    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.isStar) {
        // Cute 4-point sparkle star
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    // 4. Main Turtle Body
    ctx.save();
    ctx.translate(x, y);

    // Playful banking tilt based on speed & paddling
    const tilt = (this.speed / this.maxSpeed) * 0.08 + Math.cos(this.paddleCycle) * 0.035;
    ctx.rotate(tilt);

    // --- REAR FLIPPERS (Drawn behind body) ---
    const rearPaddleAngle = Math.sin(this.paddleCycle + Math.PI) * 0.4;
    this._drawFlipper(ctx, -24, -18, -rearPaddleAngle, false, false);
    this._drawFlipper(ctx, -24, 18, rearPaddleAngle, true, false);

    // --- JET BOOSTERS & FLAMES ---
    this._drawThrusters(ctx);

    // --- CUTE BABY TAIL ---
    this._drawTail(ctx);

    // --- MAIN ROUND CARAPACE (SHELL) ---
    this._drawShell(ctx);

    // --- FRONT FLIPPERS (Drawn on top of shell for cute swimming action) ---
    const frontPaddleAngle = Math.sin(this.paddleCycle) * 0.52;
    this._drawFlipper(ctx, 16, -24, -frontPaddleAngle, false, true);
    this._drawFlipper(ctx, 16, 24, frontPaddleAngle, true, true);

    // --- CHIBI HEAD, ANIME EYES & GOGGLES ---
    this._drawHead(ctx);

    ctx.restore();
  }

  // Soft Glossy Mirror Sheen on Track Floor
  _drawFloorReflection(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y + 42);
    ctx.scale(1, -0.32);
    ctx.globalAlpha = 0.16;

    // Rounded shell reflection
    ctx.fillStyle = this.colorShellRim;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chubby head reflection
    ctx.fillStyle = this.colorSkin;
    ctx.beginPath();
    ctx.ellipse(38, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Horizontal Laser Speed Trails shooting out behind shell
  _drawLaserSpeedStreaks(ctx, x, y) {
    const streakCount = 4;
    const baseLength = Math.max(26, this.speed * 11);

    ctx.save();
    for (let i = 0; i < streakCount; i++) {
      const offsetY = (i - 1.5) * 10;
      const len = baseLength * (0.65 + ((i % 3) * 0.22)) + Math.random() * 6;
      const startX = x - 34;
      const endX = startX - len;

      const grad = ctx.createLinearGradient(startX, y + offsetY, endX, y + offsetY);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, this.colorNeon);
      grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = grad;
      ctx.lineWidth = (i === 1 || i === 2) ? 4.0 : 2.4;
      ctx.lineCap = 'round';
      ctx.shadowColor = this.colorNeon;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(startX, y + offsetY);
      ctx.lineTo(endX, y + offsetY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Organic, curved baby sea turtle paddle flipper
  _drawFlipper(ctx, px, py, angle, isBottom, isFront) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    const flipSign = isBottom ? 1 : -1;

    if (isFront) {
      // Natural baby sea turtle hydro-paddle (curved wing shape)
      const grad = ctx.createLinearGradient(0, -6 * flipSign, 12, 32 * flipSign);
      grad.addColorStop(0, this.colorSkinLight);
      grad.addColorStop(0.4, this.colorSkin);
      grad.addColorStop(1, this.colorSkinShadow);

      ctx.fillStyle = grad;
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.shadowColor = this.colorSkin;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(-4, 0);
      // Sweeps forward then arcs hydrodynamically backwards
      ctx.bezierCurveTo(6, 8 * flipSign, 18, 22 * flipSign, 14, 34 * flipSign);
      // Soft rounded tip
      ctx.bezierCurveTo(11, 40 * flipSign, 1, 38 * flipSign, -5, 30 * flipSign);
      // Curves back to shoulder joint
      ctx.bezierCurveTo(-11, 22 * flipSign, -10, 10 * flipSign, -4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Cute little soft pastel freckle scales on flipper
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(4, 16 * flipSign, 2.2, 0, Math.PI * 2);
      ctx.arc(8, 26 * flipSign, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Soft leading edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(2, 6 * flipSign);
      ctx.bezierCurveTo(10, 16 * flipSign, 14, 24 * flipSign, 11, 32 * flipSign);
      ctx.stroke();

    } else {
      // Rear flipper: cute rounded rudder paddle
      const grad = ctx.createLinearGradient(0, 0, 0, 22 * flipSign);
      grad.addColorStop(0, this.colorSkin);
      grad.addColorStop(1, this.colorSkinShadow);

      ctx.fillStyle = grad;
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 1.8;

      ctx.shadowColor = this.colorSkin;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.ellipse(0, 14 * flipSign, 7.5, 14, 0.25 * flipSign, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Cute rear scale dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 16 * flipSign, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Cute Little Wiggling Baby Tail
  _drawTail(ctx) {
    ctx.save();
    const wag = Math.sin(this.paddleCycle * 1.5) * 3.5;
    ctx.translate(-38, 0);
    ctx.rotate((wag * Math.PI) / 180);

    const grad = ctx.createLinearGradient(0, 0, -14, 0);
    grad.addColorStop(0, this.colorSkin);
    grad.addColorStop(1, this.colorSkinShadow);

    ctx.fillStyle = grad;
    ctx.strokeStyle = this.colorSkinContour;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(-8, -3, -15, 0);
    ctx.quadraticCurveTo(-8, 3, 0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Compact Dual Micro-Thruster Backpack with Dynamic Rocket Flames
  _drawThrusters(ctx) {
    const nozzles = [-8, 8]; // Twin nozzles top & bottom of centerline
    const flameDrive = Math.max(0.2, this.speed / this.maxSpeed + this.mouthOpen * 0.4);

    ctx.save();
    for (const ny of nozzles) {
      // 1. Rocket Exhaust Flame (Shoots backwards)
      if (this.speed > 0.4 || this.mouthOpen > 0.2) {
        ctx.save();
        const flameLen = 14 + flameDrive * 26 + Math.random() * 4;
        const flameWidth = 5 + flameDrive * 3;

        // Outer neon aura flame
        const gradOuter = ctx.createLinearGradient(-44, ny, -44 - flameLen, ny);
        gradOuter.addColorStop(0, '#ffffff');
        gradOuter.addColorStop(0.3, this.colorThruster);
        gradOuter.addColorStop(0.8, this.colorNeon);
        gradOuter.addColorStop(1, 'transparent');

        ctx.fillStyle = gradOuter;
        ctx.shadowColor = this.colorThruster;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.moveTo(-44, ny - flameWidth);
        ctx.quadraticCurveTo(-44 - flameLen * 0.6, ny - flameWidth * 0.7, -44 - flameLen, ny);
        ctx.quadraticCurveTo(-44 - flameLen * 0.6, ny + flameWidth * 0.7, -44, ny + flameWidth);
        ctx.closePath();
        ctx.fill();

        // Inner white-hot plasma core
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(-44 - flameLen * 0.28, ny, flameLen * 0.28, flameWidth * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Thruster Nozzle Casing
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = this.colorShellRim;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.roundRect(-45, ny - 5.5, 12, 11, 2.5);
      ctx.fill();
      ctx.stroke();

      // Metallic trim ring
      ctx.fillStyle = this.colorThruster;
      ctx.beginPath();
      ctx.fillRect(-45, ny - 4.5, 2.5, 9);
      ctx.fill();
    }
    ctx.restore();
  }

  // Domed, Cute Candy-Gloss Carapace (Shell)
  _drawShell(ctx) {
    ctx.save();

    // Outer Neon Glow Aura
    ctx.shadowColor = this.colorShellRim;
    ctx.shadowBlur = 18;

    // Outer Rim Border
    ctx.strokeStyle = this.colorShellRim;
    ctx.lineWidth = 3.8;

    // Shell Gradient (Soft spherical 3D dome)
    const shellGrad = ctx.createRadialGradient(-6, -6, 5, 0, 0, 39);
    shellGrad.addColorStop(0, this.colorShellTop);
    shellGrad.addColorStop(0.68, this.colorShell);
    shellGrad.addColorStop(1, '#090d20');

    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 39, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Glossy Specular Highlight Arc on top rim (Toy-gloss sheen)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, -6, 33, 20, 0, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();

    // Secondary subtle lower rim bounce light
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 5, 33, 19, 0, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    // Adorable Rounded Scute Plates
    ctx.strokeStyle = this.colorPattern;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.8;

    // Center Rounded Hexagonal Medallion Plate
    ctx.beginPath();
    ctx.roundRect(-13, -11, 26, 22, 6);
    ctx.stroke();

    // Radiating Soft Plate Seams with rounded ends
    ctx.beginPath();
    ctx.moveTo(-13, 0); ctx.lineTo(-33, 0);
    ctx.moveTo(13, 0); ctx.lineTo(33, 0);
    ctx.moveTo(-7, -11); ctx.lineTo(-17, -23);
    ctx.moveTo(7, -11); ctx.lineTo(17, -23);
    ctx.moveTo(-7, 11); ctx.lineTo(-17, 23);
    ctx.moveTo(7, 11); ctx.lineTo(17, 23);
    ctx.stroke();

    // Center Glowing Vector Emblem Badge
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;

    // Circular badge base
    ctx.fillStyle = 'rgba(10, 15, 35, 0.75)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (this.team === 'boys') {
      // Golden Lightning Bolt with rounded tip
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-1, -6);
      ctx.lineTo(-5, -0.5);
      ctx.lineTo(-1, -0.5);
      ctx.lineTo(-2, 6);
      ctx.lineTo(4, -1);
      ctx.lineTo(0.5, -1);
      ctx.closePath();
      ctx.fill();

      // Sparkle core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cute Golden Heart Emblem with soft glow
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const hx = 0, hy = -1.5;
      ctx.moveTo(hx, hy + 4.5);
      ctx.bezierCurveTo(hx - 5.5, hy + 1.5, hx - 6.5, hy - 4, hx, hy - 1.5);
      ctx.bezierCurveTo(hx + 6.5, hy - 4, hx + 5.5, hy + 1.5, hx, hy + 4.5);
      ctx.closePath();
      ctx.fill();

      // Golden sparkle core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -0.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Chibi Baby Head with Chubby Cheeks, Large Anime Eyes & Forehead Aviator Goggles
  _drawHead(ctx) {
    ctx.save();
    const neckX = 36 + Math.cos(this.paddleCycle) * 2;
    ctx.translate(neckX, 0);

    // 1. Chubby Baby Turtle Head Shape
    ctx.shadowColor = this.colorSkin;
    ctx.shadowBlur = 10;

    const headGrad = ctx.createRadialGradient(8, -4, 4, 0, 0, 21);
    headGrad.addColorStop(0, this.colorSkinLight);
    headGrad.addColorStop(0.45, this.colorSkin);
    headGrad.addColorStop(1, this.colorSkinShadow);

    ctx.fillStyle = headGrad;
    ctx.strokeStyle = this.colorSkinContour;
    ctx.lineWidth = 2.0;

    // Pear-shaped chubby baby head: round forehead, chubby lower cheek and rounded snout
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    // Rounded crown
    ctx.bezierCurveTo(4, -18, 16, -14, 21, -6);
    // Cute rounded snout
    ctx.bezierCurveTo(25, 0, 24, 8, 19, 13);
    // Chubby cheek pouch
    ctx.bezierCurveTo(14, 18, 2, 18, -4, 12);
    // Neck base
    ctx.bezierCurveTo(-9, 6, -9, -6, -6, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 2. Rosy Blushing Cheek (Essential Kawaii Feature)
    ctx.save();
    const cheekGrad = ctx.createRadialGradient(10, 8, 0, 10, 8, 7.0);
    cheekGrad.addColorStop(0, this.colorCheek);
    cheekGrad.addColorStop(0.7, this.colorCheek);
    cheekGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = cheekGrad;
    ctx.beginPath();
    ctx.ellipse(10, 8, 7.0, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute baby freckles on cheek
    ctx.fillStyle = 'rgba(77, 124, 15, 0.45)';
    ctx.beginPath();
    ctx.arc(8, 7, 0.9, 0, Math.PI * 2);
    ctx.arc(11, 6, 0.9, 0, Math.PI * 2);
    ctx.arc(12, 9, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Cute Curved Baby Smile & Shouting Mouth
    if (this.mouthOpen > 0.18) {
      // Cheerful open mouth with cute pink tongue
      const openH = 4 + this.mouthOpen * 7.5;
      ctx.save();

      // Mouth cavity
      ctx.fillStyle = '#831843';
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.quadraticCurveTo(22, 5, 20, 4 + openH);
      ctx.quadraticCurveTo(14, 4 + openH + 1, 13, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cute pink tongue
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(16, 4 + openH - 1.5, 3.2, 2.2, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Tiny white tooth/beak highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(17, 4.8, 1.2, 0, Math.PI);
      ctx.fill();

      ctx.restore();
    } else {
      // Sweet curved baby smile `:3`
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(16, 4, 3.8, 0.15, Math.PI * 0.75);
      ctx.stroke();

      // Tiny dimple curve at the corner
      ctx.beginPath();
      ctx.arc(19.5, 4.2, 1.5, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();
    }

    // 4. LARGE EXPRESSIVE KAWAII ANIME EYE
    const eyeX = 8;
    const eyeY = -4;

    if (this.isBlinking) {
      // Cute blinking line (^ shape)
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(eyeX - 5, eyeY);
      ctx.quadraticCurveTo(eyeX, eyeY - 3, eyeX + 5, eyeY);
      ctx.stroke();
    } else {
      ctx.save();

      // Eye White (Sclera)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 9.8, 10.8, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Iris Gradient (Rich, deep anime iris)
      const irisGrad = ctx.createLinearGradient(eyeX, eyeY - 9, eyeX, eyeY + 9);
      irisGrad.addColorStop(0, '#0a0f1d');
      irisGrad.addColorStop(0.4, this.team === 'boys' ? '#1e1b4b' : '#4c0519');
      irisGrad.addColorStop(0.8, this.eyeColor);
      irisGrad.addColorStop(1, this.team === 'boys' ? '#38bdf8' : '#fb7185');

      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(eyeX + 1.2, eyeY, 7.8, 9.0, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Deep Pupil
      ctx.fillStyle = '#05070f';
      ctx.beginPath();
      ctx.ellipse(eyeX + 1.5, eyeY, 4.6, 5.4, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Lower Iris Crescent Sheen (Translucent anime glass bounce)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(eyeX + 1.5, eyeY + 4.5, 4.6, 2.0, 0, 0, Math.PI);
      ctx.fill();

      // SPECULAR CATCHLIGHT SPARKLES (The Soul of Kawaii Cuteness)
      // 1. Primary Big Twinkle (Top-Left)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX - 1.2, eyeY - 3.8, 3.3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Secondary Mini Twinkle (Bottom-Right)
      ctx.beginPath();
      ctx.arc(eyeX + 4.2, eyeY + 2.5, 1.7, 0, Math.PI * 2);
      ctx.fill();

      // 3. Tiny Star / Pinpoint Sparkle (Top-Right)
      ctx.beginPath();
      ctx.arc(eyeX + 3.8, eyeY - 2.8, 1.0, 0, Math.PI * 2);
      ctx.fill();

      // Turbo Excitement Star in Eye when roaring
      if (this.mouthOpen > 0.65) {
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const sx = eyeX + 1.5, sy = eyeY;
        ctx.moveTo(sx, sy - 2.5);
        ctx.lineTo(sx + 0.8, sy - 0.8);
        ctx.lineTo(sx + 2.5, sy);
        ctx.lineTo(sx + 0.8, sy + 0.8);
        ctx.lineTo(sx, sy + 2.5);
        ctx.lineTo(sx - 0.8, sy + 0.8);
        ctx.lineTo(sx - 2.5, sy);
        ctx.lineTo(sx - 0.8, sy - 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Cute upper eyelid curve & lash
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY - 2, 9.8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Eyelash styling: Double flutter lash for Girls, sporty flick for Boys
      if (this.team === 'girls') {
        ctx.lineWidth = 2.0;
        // Top flutter lash
        ctx.beginPath();
        ctx.moveTo(eyeX + 6.5, eyeY - 7.5);
        ctx.quadraticCurveTo(eyeX + 9.5, eyeY - 9.5, eyeX + 12, eyeY - 9);
        ctx.stroke();
        // Lower flutter lash
        ctx.beginPath();
        ctx.moveTo(eyeX + 8.5, eyeY - 4.5);
        ctx.quadraticCurveTo(eyeX + 11, eyeY - 5.5, eyeX + 12.8, eyeY - 4.8);
        ctx.stroke();
      } else {
        // Sporty lash flick
        ctx.beginPath();
        ctx.moveTo(eyeX + 7, eyeY - 7);
        ctx.lineTo(eyeX + 10, eyeY - 8.5);
        ctx.stroke();
      }

      // Cute expressive arched eyebrow
      ctx.strokeStyle = this.colorSkinContour;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      const browLift = this.mouthOpen * 2.5;
      ctx.arc(eyeX, eyeY - 14 - browLift, 7, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      ctx.restore();
    }

    // 5. STYLISH FOREHEAD RACING GOGGLES (Perched on crown, eyes 100% unobstructed)
    this._drawForeheadGoggles(ctx);

    ctx.restore();
  }

  // Forehead Aviator Goggles / Visor tilted up on crown
  _drawForeheadGoggles(ctx) {
    ctx.save();
    const goggleY = -15;

    // Elastic Strap wrapping around head
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-7, -9);
    ctx.quadraticCurveTo(0, goggleY - 1, 9, goggleY - 2);
    ctx.stroke();

    // Metallic Strap Accent
    ctx.strokeStyle = this.goggleColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7, -9);
    ctx.quadraticCurveTo(0, goggleY - 1, 9, goggleY - 2);
    ctx.stroke();

    if (this.gearType === 'goggles') {
      // BOYS: Twin Aviator Goggle Frames perched on crown
      const lenses = [3, 14];

      for (let i = 0; i < lenses.length; i++) {
        const lx = lenses[i];
        // Outer metallic frame
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = this.goggleColor;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = this.goggleColor;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.ellipse(lx, goggleY, 6.2, 5.0, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Glowing translucent lens
        const lensGrad = ctx.createLinearGradient(lx - 4, goggleY - 4, lx + 4, goggleY + 4);
        lensGrad.addColorStop(0, '#ffffff');
        lensGrad.addColorStop(0.4, this.goggleColor);
        lensGrad.addColorStop(1, '#0e7490');

        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.ellipse(lx, goggleY, 4.4, 3.4, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Glossy specular slash
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(lx - 2.5, goggleY - 2);
        ctx.lineTo(lx - 0.5, goggleY + 2);
        ctx.stroke();
      }

      // Bridge piece connecting twin frames
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = this.goggleColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(8, goggleY - 2, 4, 3, 1);
      ctx.fill();
      ctx.stroke();

    } else {
      // GIRLS: Rose-Gold Racing Pilot Goggles with an Adorable Mini-Bow on the strap
      const lenses = [3, 14];

      // Cute racing ribbon bow perched on the strap
      ctx.fillStyle = '#ff7c77';
      ctx.strokeStyle = '#9f1239';
      ctx.lineWidth = 1.2;

      // Left bow wing
      ctx.beginPath();
      ctx.ellipse(-6, goggleY - 1, 4.5, 3.0, -0.4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Right bow wing
      ctx.beginPath();
      ctx.ellipse(-1, goggleY, 4.5, 3.0, 0.4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Bow center golden pearl
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-3.5, goggleY - 0.5, 2.0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      for (let i = 0; i < lenses.length; i++) {
        const lx = lenses[i];
        // Outer rose-gold frame
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = this.goggleColor;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = this.goggleColor;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.ellipse(lx, goggleY, 6.2, 5.0, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Glowing Sunset Rose translucent lens
        const lensGrad = ctx.createLinearGradient(lx - 4, goggleY - 4, lx + 4, goggleY + 4);
        lensGrad.addColorStop(0, '#ffffff');
        lensGrad.addColorStop(0.35, '#fb7185');
        lensGrad.addColorStop(0.85, '#e11d48');
        lensGrad.addColorStop(1, '#ff753a');

        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.ellipse(lx, goggleY, 4.4, 3.4, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Glossy specular slash
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(lx - 2.5, goggleY - 2);
        ctx.lineTo(lx - 0.5, goggleY + 2);
        ctx.stroke();
      }

      // Bridge piece connecting twin frames
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = this.goggleColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(8, goggleY - 2, 4, 3, 1);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  reset() {
    this.distance = 0;
    this.speed = 0;
    this.acceleration = 0;
    this.particles = [];
    this.mouthOpen = 0;
  }
}
