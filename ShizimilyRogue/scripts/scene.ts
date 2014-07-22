module ShizimilyRogue.View {
    // ゲーム画面のサイズ
    export var VIEW_WIDTH = 640;
    export var VIEW_HEIGHT = 480;
    var FPS = 30;


    // シーン
    export class Scene extends enchant.Scene {
        static IMAGE = {
            WALL: { URL: "./images/wall_01.png", DATA: <enchant.Surface>null },
            FLOOR: { URL: "./images/floor_01.png", DATA: <enchant.Surface>null },
            UNIT: { URL: "./images/unit.png", DATA: <enchant.Surface>null },
            SHIZIMILY: { URL: "./images/shizimi.png", DATA: <enchant.Surface>null },
            TITLE: { URL: "./images/title.png", DATA: <enchant.Surface>null },
            MESSAGE: { URL: "./images/MessageWindow.png", DATA: <enchant.Surface>null },
            ITEM_WINDOW: { URL: "./images/ItemWindow.png", DATA: <enchant.Surface>null },
            MESSAGE_ICON: { URL: "./images/shizimily_faceIcon_A0.png", DATA: <enchant.Surface>null },
            SHADOW: { URL: "./images/shadow.png", DATA: <enchant.Surface>null },
            MEMU_MAIN: { URL: "./images/MainMenu.png", DATA: <enchant.Surface>null },
            CURSOR: { URL: "./images/cursor.png", DATA: <enchant.Surface>null },
            OBJECT: { URL: "./images/cake.png", DATA: <enchant.Surface>null },
            USE_MENU: { URL: "./images/UseMenu.png", DATA: <enchant.Surface>null },
            MINI_MAP: { URL: "./images/minimap.png", DATA: <enchant.Surface>null },
        };

        static game: enchant.Core;

        private static _keyUp: number = 0;
        private static _keyDown: number = 0;
        private static _keyLeft: number = 0;
        private static _keyRight: number = 0;
        private static _keyA: boolean = false;
        private static _keyB: boolean = false;
        private static _keyX: boolean = false;
        private static _animating: number = 0;
        private static _keyLock: boolean = false;

        // 移動キー入力のバッファ時間
        private static keyBufferFrame: number = 1;

        static init(onloadHandler: () => void) {
            enchant();
            Scene.game = new enchant.Core(VIEW_WIDTH, VIEW_HEIGHT);
            Scene.game.fps = FPS;

            var imageUrl: string[] = [];
            for (var id in Scene.IMAGE)
                imageUrl.push(Scene.IMAGE[id].URL);

            Scene.game.preload(imageUrl);
            Scene.eventInit();
            Scene.game.onload = () => {
                for (var id in Scene.IMAGE)
                    Scene.IMAGE[id].DATA = Scene.game.assets[Scene.IMAGE[id].URL];
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
        static get keyUp(): number {
            return Scene._keyUp;
        }
        static get keyDown(): number {
            return Scene._keyDown;
        }
        static get keyLeft(): number {
            return Scene._keyLeft;
        }
        static get keyRight(): number {
            return Scene._keyRight;
        }
        static get keyDirection(): number {
            if (Scene._keyUp && Scene._keyLeft)
                return Common.DIR.UP_LEFT;
            else if (Scene._keyUp && Scene._keyRight)
                return Common.DIR.UP_RIGHT;
            else if (Scene._keyDown && Scene._keyRight)
                return Common.DIR.DOWN_RIGHT;
            else if (Scene._keyDown && Scene._keyLeft)
                return Common.DIR.DOWN_LEFT;
            else if (Scene._keyDown)
                return Common.DIR.DOWN;
            else if (Scene._keyUp)
                return Common.DIR.UP;
            else if (Scene._keyRight)
                return Common.DIR.RIGHT;
            else if (Scene._keyLeft)
                return Common.DIR.LEFT;
            else null;
        }

        static get keyA(): boolean {
            return Scene._keyA;
        }
        static get keyB(): boolean {
            return Scene._keyB;
        }
        static get keyX(): boolean {
            return Scene._keyX;
        }

        static resetKeys(): void {
            this._keyUp = 0;
            this._keyDown = 0;
            this._keyLeft = 0;
            this._keyRight = 0;
            this._keyA = false;
            this._keyB = false;
            this._keyX = false;
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

            Scene.game.keybind(104, "up");       // Num 8
            Scene.game.keybind(105, "upright");  // Num 9
            Scene.game.keybind(102, "right");    // Num 6
            Scene.game.keybind(99, "downright"); // Num 3
            Scene.game.keybind(98, "down");      // Num 2
            Scene.game.keybind(97, "downleft");  // Num 1
            Scene.game.keybind(100, "left");     // Num 4
            Scene.game.keybind(103, "upleft");   // Num 7

            Scene.game.addEventListener(enchant.Event.UP_BUTTON_DOWN, function (e) {
                Scene._keyUp = !Scene.keyLock && Scene._keyUp+1;
            });
            Scene.game.addEventListener(enchant.Event.UP_BUTTON_UP, function (e) {
                Scene._keyUp = 0;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_DOWN, function (e) {
                Scene._keyDown = !Scene.keyLock && Scene._keyDown+1;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_UP, function (e) {
                Scene._keyDown = 0;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_DOWN, function (e) {
                Scene._keyRight = !Scene.keyLock && Scene._keyRight+1;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_UP, function (e) {
                Scene._keyRight = 0;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_DOWN, function (e) {
                Scene._keyLeft = !Scene.keyLock && Scene._keyLeft+1;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_UP, function (e) {
                Scene._keyLeft = 0;
            });

            Scene.game.addEventListener(enchant.Event.A_BUTTON_DOWN, function (e) {
                Scene._keyA = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.A_BUTTON_UP, function (e) {
                Scene._keyA = false;
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_DOWN, function (e) {
                Scene._keyB = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_UP, function (e) {
                Scene._keyB = false;
            });
            Scene.game.addEventListener("xbuttondown", function (e) {
                Scene._keyX = !Scene.keyLock && true;
            });
            Scene.game.addEventListener("xbuttonup", function (e) {
                Scene._keyX = !Scene.keyLock && false;
            });

            Scene.game.addEventListener("upleftbuttondown", function (e) {
                Scene._keyUp = !Scene.keyLock && Scene._keyUp+1;
                Scene._keyLeft = !Scene.keyLock && Scene._keyLeft+1;
            });
            Scene.game.addEventListener("upleftbuttonup", function (e) {
                Scene._keyUp = !Scene.keyLock && 0;
                Scene._keyLeft = !Scene.keyLock && 0;
            });
            Scene.game.addEventListener("uprightbuttondown", function (e) {
                Scene._keyUp = !Scene.keyLock && Scene._keyUp+1;
                Scene._keyRight = !Scene.keyLock && Scene._keyRight+1;
            });
            Scene.game.addEventListener("uprightbuttonup", function (e) {
                Scene._keyUp = !Scene.keyLock && 0;
                Scene._keyRight = !Scene.keyLock && 0;
            });
            Scene.game.addEventListener("downrightbuttondown", function (e) {
                Scene._keyDown = !Scene.keyLock && Scene._keyDown+1;
                Scene._keyRight = !Scene.keyLock && Scene._keyRight+1;
            });
            Scene.game.addEventListener("downrightbuttonup", function (e) {
                Scene._keyDown = !Scene.keyLock && 0;
                Scene._keyRight = !Scene.keyLock && 0;
            });
            Scene.game.addEventListener("downleftbuttondown", function (e) {
                Scene._keyDown = !Scene.keyLock && Scene._keyDown+1;
                Scene._keyLeft = !Scene.keyLock && Scene._keyLeft+1;
            });
            Scene.game.addEventListener("downleftbuttonup", function (e) {
                Scene._keyDown = !Scene.keyLock && 0;
                Scene._keyLeft = !Scene.keyLock && 0;
            });
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
