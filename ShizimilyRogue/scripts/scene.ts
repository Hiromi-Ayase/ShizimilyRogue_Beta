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
            TITLE: { URL: "./images/title.png", DATA: <enchant.Surface>null },
            MESSAGE: { URL: "./images/MessageWindow.png", DATA: <enchant.Surface>null },
            ITEM_WINDOW: { URL: "./images/ItemWindow.png", DATA: <enchant.Surface>null },
            MESSAGE_ICON: { URL: "./images/shizimily_faceIcon_A0.png", DATA: <enchant.Surface>null },
            SHADOW: { URL: "./images/shadow.png", DATA: <enchant.Surface>null },
            MEMU_MAIN: { URL: "./images/MainMenu.png", DATA: <enchant.Surface>null },
            CURSOR: { URL: "./images/cursor.png", DATA: <enchant.Surface>null },
            ITEM: { URL: "./images/cake.png", DATA: <enchant.Surface>null },
        };

        static game: enchant.Core;

        private static _keyUp: boolean = false;
        private static _keyDown: boolean = false;
        private static _keyLeft: boolean = false;
        private static _keyRight: boolean = false;
        private static _keyA: boolean = false;
        private static _keyB: boolean = false;
        private static _animating: number = 0;
        private static _keyLock: boolean = false;

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
        }

        static decAnimating(): void {
            Scene._animating--;
        }

        static get animating(): boolean {
            return Scene._animating > 0;
        }
        static get keyUp(): boolean {
            return Scene._keyUp;
        }
        static get keyDown(): boolean {
            return Scene._keyDown;
        }
        static get keyLeft(): boolean {
            return Scene._keyLeft;
        }
        static get keyRight(): boolean {
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

        static resetKeys(): void {
            this._keyUp = false;
            this._keyDown = false;
            this._keyLeft = false;
            this._keyRight = false;
            this._keyA = false;
            this._keyB = false;
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

            Scene.game.addEventListener(enchant.Event.UP_BUTTON_DOWN, function (e) {
                Scene._keyUp = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_DOWN, function (e) {
                Scene._keyDown = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_DOWN, function (e) {
                Scene._keyRight = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_DOWN, function (e) {
                Scene._keyLeft = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.A_BUTTON_DOWN, function (e) {
                Scene._keyA = !Scene.keyLock && true;
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_DOWN, function (e) {
                Scene._keyB = !Scene.keyLock && true;
            });

            Scene.game.addEventListener(enchant.Event.UP_BUTTON_UP, function (e) {
                Scene._keyUp = false;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_UP, function (e) {
                Scene._keyDown = false;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_UP, function (e) {
                Scene._keyRight = false;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_UP, function (e) {
                Scene._keyLeft = false;
            });
            Scene.game.addEventListener(enchant.Event.A_BUTTON_UP, function (e) {
                Scene._keyA = false;
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_UP, function (e) {
                Scene._keyB = false;
            });
        }

        static setScene(scene: Scene, updateHandler: (e) => void): void {
            Scene.game.clearEventListener(enchant.Event.ENTER_FRAME);
            Scene.game.replaceScene(scene);
            Scene.game.addEventListener(enchant.Event.ENTER_FRAME, updateHandler);
        }
    }


    class OpeningScene extends Scene {
    }

    class EndingScene extends Scene {
    }

}
