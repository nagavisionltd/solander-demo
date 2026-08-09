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
  public isAttackPressed: boolean = false;
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
      if (e.code === 'Space') this.isJumpPressed = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ' || e.code === 'KeyF') {
        this.isAttackPressed = true;
      }
      if (e.code === 'KeyC') this.isCarryPressed = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyE') this.isInteractPressed = false;
      if (e.code === 'Space') this.isJumpPressed = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ' || e.code === 'KeyF') {
        this.isAttackPressed = false;
      }
      if (e.code === 'KeyC') this.isCarryPressed = false;
    });

    window.addEventListener('mousedown', (e) => {
      // Ignore if clicking UI elements
      if ((e.target as HTMLElement)?.closest('.no-game-input')) return;
      this.isMouseDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
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

          // Buttons: 0=A (Jump), 1=B (Interact), 2=X (Attack), 3=Y (Carry)
          if (gp.buttons[0]?.pressed) this.isJumpPressed = true;
          if (gp.buttons[1]?.pressed) this.isInteractPressed = true;
          if (gp.buttons[2]?.pressed) this.isAttackPressed = true;
          if (gp.buttons[3]?.pressed) this.isCarryPressed = true;
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

  public consumeAttack(): boolean {
    const pressed = this.isAttackPressed;
    this.isAttackPressed = false;
    return pressed;
  }

  public consumeCarry(): boolean {
    const pressed = this.isCarryPressed;
    this.isCarryPressed = false;
    return pressed;
  }
}

export const inputManager = new InputManager();

