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
            Input.init();
            Scene.game.onload = () => {
                Scene.game.addEventListener(enchant.Event.ENTER_FRAME, Input.update);
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

        
        static set keyLock(value: boolean) {
            Scene._keyLock = value;
            if (value)
                View.Input.resetKeys();
        }
        static get keyLock(): boolean {
            return Scene._keyLock;
        }

        static contollerUpdateHandler: (e: any) => void;
        static setScene(scene: Scene, updateHandler: (e) => void): void {
            Scene.game.removeEventListener(enchant.Event.ENTER_FRAME, Scene.contollerUpdateHandler);
            Scene.game.addEventListener(enchant.Event.ENTER_FRAME, updateHandler);
            Scene.contollerUpdateHandler = updateHandler;

            Scene.game.replaceScene(scene);
            Scene.keyLock = false;
        }
    }


    class OpeningScene extends Scene {
    }

    class EndingScene extends Scene {
    }

}
