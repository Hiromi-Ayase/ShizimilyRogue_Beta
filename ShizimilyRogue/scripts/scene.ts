module ShizimilyRogue.View {
    // ゲーム画面のサイズ
    export var VIEW_WIDTH = 640;
    export var VIEW_HEIGHT = 480;
    var FPS = 30;

    // シーン
    export class Scene extends enchant.Scene {
        static IMAGES: string[] = [
            "./images/wall_01.png",
            "./images/floor_01.png",
            "./images/unit.png",
            "./images/title.png",
            "./images/message.png",
            "./images/messageIcon.png",
        ];
        static IMAGE_UNIT: enchant.Surface;
        static IMAGE_WALL: enchant.Surface;
        static IMAGE_FLOOR: enchant.Surface;
        static IMAGE_TITLE: enchant.Surface;
        static IMAGE_MESSAGE: enchant.Surface;
        static IMAGE_MESSAGE_ICON: enchant.Surface;
        static game: enchant.Core;

        private static _keyUp: boolean = false;
        private static _keyDown: boolean = false;
        private static _keyLeft: boolean = false;
        private static _keyRight: boolean = false;
        private static _keyA: boolean = false;
        private static _keyB: boolean = false;
        private static _animating: number = 0;

        static init(onloadHandler: () => void) {
            enchant();
            Scene.game = new enchant.Core(VIEW_WIDTH, VIEW_HEIGHT);
            Scene.game.fps = FPS;
            Scene.game.preload(Scene.IMAGES);
            Scene.eventInit();
            Scene.game.onload = () => {
                Scene.IMAGE_WALL = Scene.game.assets[Scene.IMAGES[0]];
                Scene.IMAGE_FLOOR = Scene.game.assets[Scene.IMAGES[1]];
                Scene.IMAGE_UNIT = Scene.game.assets[Scene.IMAGES[2]];
                Scene.IMAGE_TITLE = Scene.game.assets[Scene.IMAGES[3]];
                Scene.IMAGE_MESSAGE = Scene.game.assets[Scene.IMAGES[4]];
                Scene.IMAGE_MESSAGE_ICON = Scene.game.assets[Scene.IMAGES[5]];
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

        private static eventInit() {
            Scene.game.keybind('Z'.charCodeAt(0), "a");
            Scene.game.keybind('X'.charCodeAt(0), "b");

            Scene.game.addEventListener(enchant.Event.UP_BUTTON_DOWN, function (e) {
                Scene._keyUp = true;
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_DOWN, function (e) {
                Scene._keyDown = true;
            });
            Scene.game.addEventListener(enchant.Event.RIGHT_BUTTON_DOWN, function (e) {
                Scene._keyRight = true;
            });
            Scene.game.addEventListener(enchant.Event.LEFT_BUTTON_DOWN, function (e) {
                Scene._keyLeft = true;
            });
            Scene.game.addEventListener(enchant.Event.A_BUTTON_DOWN, function (e) {
                Scene._keyA = true;
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_DOWN, function (e) {
                Scene._keyB = true;
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
