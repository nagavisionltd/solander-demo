// Input Manager for Keyboard, Gamepad, Pointer, and Touch Joystick controls
export interface InputVector {
  x: number; // -1 to 1 (left/right)
  y: number; // -1 to 1 (backward/forward)
}

export class InputManager {
  public keys: { [key: string]: boolean } = {};
  public moveVector: InputVector = { x: 0, y: 0 };
  public lookDelta: { x: number; y: number } = { x: 0, y: 0 };
  public isInteractPressed: boolean = false;
  public isJumpPressed: boolean = false;
  public isMeleePressed: boolean = false;
  public isLaserPressed: boolean = false;
  public isRollPressed: boolean = false;
  public isSprintHeld: boolean = false;
  public isCarryPressed: boolean = false;
  public isMouseDown: boolean = false;

  private touchJoystickActive: boolean = false;
  private touchJoystickVector: InputVector = { x: 0, y: 0 };
  private listenersAttached: boolean = false;

  constructor() {
    this.attachListeners();
  }

  public attachListeners() {
    if (this.listenersAttached || typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.isInteractPressed = true;
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        this.isJumpPressed = true;
        if (e.target === document.body || (e.target as HTMLElement)?.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }
      if (e.code === 'KeyJ' || e.code === 'KeyF') this.isMeleePressed = true;
      if (e.code === 'KeyK' || e.code === 'KeyL') this.isLaserPressed = true;
      if (e.code === 'KeyC' || e.code === 'KeyR') this.isRollPressed = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isSprintHeld = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyE') this.isInteractPressed = false;
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') this.isJumpPressed = false;
      if (e.code === 'KeyJ' || e.code === 'KeyF') this.isMeleePressed = false;
      if (e.code === 'KeyK' || e.code === 'KeyL') this.isLaserPressed = false;
      if (e.code === 'KeyC' || e.code === 'KeyR') this.isRollPressed = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isSprintHeld = false;
    });

    window.addEventListener('mousedown', (e) => {
      // Ignore if clicking UI elements
      if ((e.target as HTMLElement)?.closest('.no-game-input')) return;
      if (e.button === 0) {
        this.isMeleePressed = true;
        this.isMouseDown = true;
      } else if (e.button === 2) {
        this.isLaserPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
        this.isMeleePressed = false;
      } else if (e.button === 2) {
        this.isLaserPressed = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent default right click menu in game view
      if (!(e.target as HTMLElement)?.closest('.no-game-input')) {
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        this.lookDelta.x += e.movementX;
        this.lookDelta.y += e.movementY;
      }
    });

    this.listenersAttached = true;
  }

  public setJoystickVector(x: number, y: number) {
    this.touchJoystickVector = { x, y };
    this.touchJoystickActive = Math.abs(x) > 0.05 || Math.abs(y) > 0.05;
  }

  public update(): InputVector {
    let x = 0;
    let y = 0;

    // Check Connected Gamepads
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          // Left Analog Stick
          const lx = gp.axes[0] || 0;
          const ly = gp.axes[1] || 0;
          if (Math.hypot(lx, ly) > 0.15) {
            x = lx;
            y = ly;
          }

          // Right Analog Stick for Camera Look
          const rx = gp.axes[2] || 0;
          const ry = gp.axes[3] || 0;
          if (Math.hypot(rx, ry) > 0.15) {
            this.lookDelta.x += rx * 12;
            this.lookDelta.y += ry * 12;
          }

          // Buttons: 0=A (Jump), 1=B (Roll), 2=X (Melee), 3=Y (Laser), 5=R1 (Sprint)
          if (gp.buttons[0]?.pressed) this.isJumpPressed = true;
          if (gp.buttons[1]?.pressed) this.isRollPressed = true;
          if (gp.buttons[2]?.pressed) this.isMeleePressed = true;
          if (gp.buttons[3]?.pressed) this.isLaserPressed = true;
          if (gp.buttons[5]?.pressed) this.isSprintHeld = true;
        }
      }
    }

    if (this.touchJoystickActive) {
      x = this.touchJoystickVector.x;
      y = this.touchJoystickVector.y;
    } else if (x === 0 && y === 0) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

      // Normalize diagonal keyboard movement
      const len = Math.hypot(x, y);
      if (len > 0) {
        x /= len;
        y /= len;
      }
    }

    this.moveVector = { x, y };
    return this.moveVector;
  }

  public consumeLookDelta(): { x: number; y: number } {
    const delta = { ...this.lookDelta };
    this.lookDelta = { x: 0, y: 0 };
    return delta;
  }

  public consumeInteract(): boolean {
    const pressed = this.isInteractPressed;
    this.isInteractPressed = false;
    return pressed;
  }

  public consumeJump(): boolean {
    const pressed = this.isJumpPressed;
    this.isJumpPressed = false;
    return pressed;
  }

  public consumeMelee(): boolean {
    const pressed = this.isMeleePressed;
    this.isMeleePressed = false;
    return pressed;
  }

  public consumeLaser(): boolean {
    const pressed = this.isLaserPressed;
    this.isLaserPressed = false;
    return pressed;
  }

  public consumeRoll(): boolean {
    const pressed = this.isRollPressed;
    this.isRollPressed = false;
    return pressed;
  }

  public consumeCarry(): boolean {
    const pressed = this.isCarryPressed;
    this.isCarryPressed = false;
    return pressed;
  }
}

export const inputManager = new InputManager();

