module ShizimilyRogue.View {
    // ゲーム画面のサイズ
    export var VIEW_WIDTH = 640;
    export var VIEW_HEIGHT = 480;
    var FPS = 30;


    // シーン
    export class Scene extends enchant.Scene {
        static ASSETS = {
            WALL00: { URL: "./images/Map/Wall00.png", DATA: <enchant.Surface>null },
            FLOOR: { URL: "./images/Map/Floor.png", DATA: <enchant.Surface>null },

            MESSAGE_WINDOW: { URL: "./images/Message/MessageWindow.png", DATA: <enchant.Surface>null },
            MESSAGE_ICON: { URL: "./images/Message/MessageIcon.png", DATA: <enchant.Surface>null },

            MENU_CURSOR: { URL: "./images/Menu/MenuCursor.png", DATA: <enchant.Surface>null },
            MENU_WINDOW: { URL: "./images/Menu/MenuWindow.png", DATA: <enchant.Surface>null },

            CPU: { URL: "./images/Item/CPU.png", DATA: <enchant.Surface>null },
            GRAPHIC_BOARD: { URL: "./images/Item/GraphicBoard.png", DATA: <enchant.Surface>null },
            HDD: { URL: "./images/Item/HDD.png", DATA: <enchant.Surface>null },
            MEMORY: { URL: "./images/Item/Memory.png", DATA: <enchant.Surface>null },
            SWEET: { URL: "./images/Item/Sweet.png", DATA: <enchant.Surface>null },
            DVD: { URL: "./images/Item/DVD.png", DATA: <enchant.Surface>null },
            PC_CASE: { URL: "./images/Item/PCCase.png", DATA: <enchant.Surface>null },
            SD_CARD: { URL: "./images/Item/SDCard.png", DATA: <enchant.Surface>null },

            SHIZIMILY: { URL: "./images/Unit/Shizimi.png", DATA: <enchant.Surface>null },

            UNIT: { URL: "./images/unit.png", DATA: <enchant.Surface>null },
            TITLE: { URL: "./images/title.png", DATA: <enchant.Surface>null },
            SHADOW: { URL: "./images/shadow.png", DATA: <enchant.Surface>null },
            MINI_MAP: { URL: "./images/minimap.png", DATA: <enchant.Surface>null },

            BGM_MAIN: { URL: "./music/shizimily.mp3", DATA: <enchant.DOMSound>null },
        };

        static game: enchant.Core;
        static gameElapsedFrame: number;

        // キー入力フラグ（キーUp/Downイベントによる）
        private static _keyA: boolean = false;
        private static _keyB: boolean = false;
        private static _keyX: boolean = false;
        private static _keyY: boolean = false;

        private static _keyUp: boolean = false;
        private static _keyDown: boolean = false;
        private static _keyLeft: boolean = false;
        private static _keyRight: boolean = false;

        private static _keyUpLeft: boolean = false;
        private static _keyUpRight: boolean = false;
        private static _keyDownLeft: boolean = false;
        private static _keyDownRight: boolean = false;
        
        // キーDown経過フレームカウンタ
        private static _countKeyA: number = 0;
        private static _countKeyB: number = 0;
        private static _countKeyX: number = 0;
        private static _countKeyY: number = 0;

        private static _countKeyUp: number = 0;
        private static _countKeyDown: number = 0;
        private static _countKeyLeft: number = 0;
        private static _countKeyRight: number = 0;

        private static _countKeyUpLeft: number = 0;
        private static _countKeyUpRight: number = 0;
        private static _countKeyDownLeft: number = 0;
        private static _countKeyDownRight: number = 0;

        // 最後にキーDownイベントが発行されたフレームNo.
        private static _lastFrameKeyA: number = 0;
        private static _lastFrameKeyB: number = 0;
        private static _lastFrameKeyX: number = 0;
        private static _lastFrameKeyY: number = 0;

        private static _lastFrameKeyUp: number = 0;
        private static _lastFrameKeyDown: number = 0;
        private static _lastFrameKeyLeft: number = 0;
        private static _lastFrameKeyRight: number = 0;

        private static _lastFrameKeyUpLeft: number = 0;
        private static _lastFrameKeyUpRight: number = 0;
        private static _lastFrameKeyDownLeft: number = 0;
        private static _lastFrameKeyDownRight: number = 0;

        // 移動キー入力のバッファ時間
        private static keyBufferFrame: number = 3;

        private static _animating: number = 0;
        private static _keyLock: boolean = false;


        static init(onloadHandler: () => void) {
            enchant();
            Scene.game = new enchant.Core(VIEW_WIDTH, VIEW_HEIGHT);
            Scene.game.fps = FPS;

            var assetsURL: string[] = [];
            for (var id in Scene.ASSETS)
                assetsURL.push(Scene.ASSETS[id].URL);

            Scene.game.preload(assetsURL);
            Scene.eventInit();
            Scene.game.onload = () => {
                for (var id in Scene.ASSETS)
                    Scene.ASSETS[id].DATA = Scene.game.assets[Scene.ASSETS[id].URL];
                onloadHandler();
            };
            Scene.game.start();
        }

        static addAnimating(): void {
            Scene._animating++;
            //Common.Debug.message("add animating:" + Scene._animating);
        }

        static decAnimating(): void {
            Scene._animating--;
            //Common.Debug.message("dec animating:" + Scene._animating);
        }

        static get animating(): boolean {
            return Scene._animating > 0;
        }

        static get CountKeyA(): number {
            return Scene._countKeyA;
        }
        static get CountKeyB(): number {
            return Scene._countKeyB;
        }
        static get CountKeyX(): number {
            return Scene._countKeyX;
        }
        static get CountKeyY(): number {
            return Scene._countKeyY;
        }

        static get CountKeyUp(): number {
            return Scene._countKeyUp;
        }
        static get CountKeyDown(): number {
            return Scene._countKeyDown;
        }
        static get CountKeyLeft(): number {
            return Scene._countKeyLeft;
        }
        static get CountKeyRight(): number {
            return Scene._countKeyRight;
        }

        static get CountKeyUpLeft(): number {
            return Scene._countKeyUpLeft;
        }
        static get CountKeyUpRight(): number {
            return Scene._countKeyUpRight;
        }
        static get CountKeyDownLeft(): number {
            return Scene._countKeyDownLeft;
        }
        static get CountKeyDownRight(): number {
            return Scene._countKeyDownRight;
        }

        static get keyDirection(): number {
            if (Scene.CountKeyUpLeft > 0)
                return Common.DIR.UP_LEFT;
            else if (Scene.CountKeyUpRight > 0)
                return Common.DIR.UP_RIGHT;
            else if (Scene.CountKeyDownLeft > 0)
                return Common.DIR.DOWN_LEFT;
            else if (Scene.CountKeyDownRight > 0)
                return Common.DIR.DOWN_RIGHT;

            else if (Scene.CountKeyUp && Scene.CountKeyLeft)
                return Common.DIR.UP_LEFT;
            else if (Scene.CountKeyUp && Scene.CountKeyRight)
                return Common.DIR.UP_RIGHT;
            else if (Scene.CountKeyDown && Scene.CountKeyLeft)
                return Common.DIR.DOWN_LEFT;
            else if (Scene.CountKeyDown && Scene.CountKeyRight)
                return Common.DIR.DOWN_RIGHT;
            
            else if (Scene.CountKeyUp > Scene.keyBufferFrame)
                return Common.DIR.UP;
            else if (Scene.CountKeyDown > Scene.keyBufferFrame)
                return Common.DIR.DOWN;
            else if (Scene.CountKeyLeft > Scene.keyBufferFrame)
                return Common.DIR.LEFT;
            else if (Scene.CountKeyRight > Scene.keyBufferFrame)
                return Common.DIR.RIGHT;

            else null;
        }

        /* シーン切り替え時、フロア移動時にも呼ぶこと */
        static resetKeys(): void {
            this._keyA = false;
            this._keyB = false;
            this._keyX = false;
            this._keyY = false;

            this._keyUp = false;
            this._keyDown = false;
            this._keyLeft = false;
            this._keyRight = false;

            this._keyUpLeft = false;
            this._keyUpRight = false;
            this._keyDownLeft = false;
            this._keyDownRight = false;

            this._countKeyA = 0;
            this._countKeyB = 0;
            this._countKeyX = 0;
            this._countKeyY = 0;

            this._countKeyUp = 0;
            this._countKeyDown = 0;
            this._countKeyLeft = 0;
            this._countKeyRight = 0;

            this._countKeyUpLeft = 0;
            this._countKeyUpRight = 0;
            this._countKeyDownLeft = 0;
            this._countKeyDownRight = 0;
        }

        static set keyLock(value: boolean) {
            Scene._keyLock = value;
            if (value)
                Scene.resetKeys();
        }
        static get keyLock(): boolean {
            return Scene._keyLock;
        }

        private static eventInit() {
            Scene.game.keybind('Z'.charCodeAt(0), "a");
            Scene.game.keybind('X'.charCodeAt(0), "b");
            Scene.game.keybind('C'.charCodeAt(0), "x");
            Scene.game.keybind('V'.charCodeAt(0), "y");

            Scene.game.keybind(104, "up");       // Num 8
            Scene.game.keybind(105, "upright");  // Num 9
            Scene.game.keybind(102, "right");    // Num 6
            Scene.game.keybind(99, "downright"); // Num 3
            Scene.game.keybind(98, "down");      // Num 2
            Scene.game.keybind(97, "downleft");  // Num 1
            Scene.game.keybind(100, "left");     // Num 4
            Scene.game.keybind(103, "upleft");   // Num 7

            /* A, B, X, Y */
            Scene.game.addEventListener("abuttondown", function (e) {
                Scene._keyA = !Scene.keyLock && true;
                Scene._lastFrameKeyA = Scene.gameElapsedFrame;
            });
            Scene.game.addEventListener("abuttonup", function (e) {
                Scene._keyA = false;
            });
            Scene.game.addEventListener("bbuttondown", function (e) {
                Scene._keyB = !Scene.keyLock && true;
                Scene._lastFrameKeyB = Scene.gameElapsedFrame;
            });
            Scene.game.addEventListener("bbuttonup", function (e) {
                Scene._keyB = false;
            });
            Scene.game.addEventListener("xbuttondown", function (e) {
                Scene._keyX = !Scene.keyLock && true;
                Scene._lastFrameKeyX = Scene.gameElapsedFrame;
            });
            Scene.game.addEventListener("xbuttonup", function (e) {
                Scene._keyX = !Scene.keyLock && false;
            });
            Scene.game.addEventListener("ybuttondown", function (e) {
                Scene._keyY = !Scene.keyLock && true;
                Scene._lastFrameKeyY = Scene.gameElapsedFrame;
            });
            Scene.game.addEventListener("ybuttonup", function (e) {
                Scene._keyY = !Scene.keyLock && false;
            });

            /* ↑, ↓, ←, → */
            Scene.game.addEventListener(enchant.Event.UP_BUTTON_DOWN, function (e) {
                Scene._keyUp = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.UP_BUTTON_UP, function (e) {
                Scene._keyUp = false;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_DOWN, function (e) {
                Scene._keyDown = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_UP, function (e) {
                Scene._keyDown = false;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_DOWN, function (e) {
                Scene._keyRight = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_UP, function (e) {
                Scene._keyRight = false;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_DOWN, function (e) {
                Scene._keyLeft = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_UP, function (e) {
                Scene._keyLeft = false;
            });

            /* 左上, 右上, 左下, 右下 */
            Scene.game.addEventListener("upleftbuttondown", function (e) {
                Scene._keyUpLeft = !Scene.keyLock && true;
            });
            Scene.game.addEventListener("upleftbuttonup", function (e) {
                Scene._keyUpLeft = !Scene.keyLock && false;
            });
            Scene.game.addEventListener("uprightbuttondown", function (e) {
                Scene._keyUpRight = !Scene.keyLock && true;
            });
            Scene.game.addEventListener("uprightbuttonup", function (e) {
                Scene._keyUpRight = !Scene.keyLock && false;
            });
            Scene.game.addEventListener("downleftbuttondown", function (e) {
                Scene._keyDownLeft = !Scene.keyLock && true;
            });
            Scene.game.addEventListener("downleftbuttonup", function (e) {
                Scene._keyDownLeft = !Scene.keyLock && false;
            });
            Scene.game.addEventListener("downrightbuttondown", function (e) {
                Scene._keyDownRight = !Scene.keyLock && true;
            });
            Scene.game.addEventListener("downrightbuttonup", function (e) {
                Scene._keyDownRight = !Scene.keyLock && false;
            });
        }

        static updateKeyInput(): void {
            if (!Scene.keyLock) {
                Scene._countKeyA = (Scene._keyA) ? Scene._countKeyA + 1 : 0;
                Scene._countKeyB = (Scene._keyB) ? Scene._countKeyB + 1 : 0;
                Scene._countKeyX = (Scene._keyX) ? Scene._countKeyX + 1 : 0;
                Scene._countKeyY = (Scene._keyY) ? Scene._countKeyY + 1 : 0;

                Scene._countKeyUp = (Scene._keyUp) ? Scene._countKeyUp + 1 : 0;
                Scene._countKeyDown = (Scene._keyDown) ? Scene._countKeyDown + 1 : 0;
                Scene._countKeyLeft = (Scene._keyLeft) ? Scene._countKeyLeft + 1 : 0;
                Scene._countKeyRight = (Scene._keyRight) ? Scene._countKeyRight + 1 : 0;

                Scene._countKeyUpLeft = (Scene._keyUpLeft) ? Scene._countKeyUpLeft + 1 : 0;
                Scene._countKeyUpRight = (Scene._keyUpRight) ? Scene._countKeyUpRight + 1 : 0;
                Scene._countKeyDownLeft = (Scene._keyDownLeft) ? Scene._countKeyDownLeft + 1 : 0;
                Scene._countKeyDownRight = (Scene._keyDownRight) ? Scene._countKeyDownRight + 1 : 0;

                if (Scene._countKeyA ||
                    Scene._countKeyB ||
                    Scene._countKeyX ||
                    Scene._countKeyY ||
                    Scene._countKeyUp ||
                    Scene._countKeyDown ||
                    Scene._countKeyLeft ||
                    Scene._countKeyRight ||
                    Scene._countKeyUpLeft ||
                    Scene._countKeyUpRight ||
                    Scene._countKeyDownLeft ||
                    Scene._countKeyDownRight) {
                    Common.Debug.message(Scene._countKeyA + ":" +
                        Scene._countKeyB + ":" +
                        Scene._countKeyX + ":" +
                        Scene._countKeyY + ":" +
                        Scene._countKeyUp + ":" +
                        Scene._countKeyDown + ":" +
                        Scene._countKeyLeft + ":" +
                        Scene._countKeyRight + ":" +
                        Scene._countKeyUpLeft + ":" +
                        Scene._countKeyUpRight + ":" +
                        Scene._countKeyDownLeft + ":" +
                        Scene._countKeyDownRight)
                }
            }
        }

        static setScene(scene: Scene, updateHandler: (e) => void): void {
            Scene.game.clearEventListener(enchant.Event.ENTER_FRAME);
            Scene.game.replaceScene(scene);
            Scene.game.addEventListener(enchant.Event.ENTER_FRAME, updateHandler);
            Scene.keyLock = false;
        }
    }


    class OpeningScene extends Scene {
    }

    class EndingScene extends Scene {
    }

}
