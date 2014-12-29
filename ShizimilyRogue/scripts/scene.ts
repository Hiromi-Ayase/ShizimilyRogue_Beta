module ShizimilyRogue.View {
    // ゲーム画面のサイズ
    export var VIEW_WIDTH = 640;
    export var VIEW_HEIGHT = 480;
    var FPS = 30;


    // シーン
    export class Scene extends enchant.Scene {
        static ASSETS = {
            WALL00: { URL: "./images/Map/wall_floor.png", DATA: <enchant.Surface>null },
            FLOOR: { URL: "./images/Map/Floor.png", DATA: <enchant.Surface>null },
            MINI_MAP: { URL: "./images/Map/minimap.png", DATA: <enchant.Surface>null },

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
            WORD: { URL: "./images/Unit/Word.png", DATA: <enchant.Surface>null },
            STAIRS: { URL: "./images/Object/Stairs.png", DATA: <enchant.Surface>null },

            UNIT: { URL: "./images/unit.png", DATA: <enchant.Surface>null },
            TITLE: { URL: "./images/title.png", DATA: <enchant.Surface>null },
            SHADOW: { URL: "./images/shadow.png", DATA: <enchant.Surface>null },

            BGM_MAIN: { URL: "./music/shizimily.mp3", DATA: <enchant.DOMSound>null },
            SE_ATTACK: { URL: "./sound/attack.mp3", DATA: <enchant.DOMSound>null },
            SE_HEAL: { URL: "./sound/heal.mp3", DATA: <enchant.DOMSound>null },
            SE_TAKE: { URL: "./sound/take.mp3", DATA: <enchant.DOMSound>null },
            SE_USE: { URL: "./sound/use.mp3", DATA: <enchant.DOMSound>null },
            SE_DIE: { URL: "./sound/die.mp3", DATA: <enchant.DOMSound>null },
            SE_STAIR: { URL: "./sound/stair.mp3", DATA: <enchant.DOMSound>null },
        };

        static game: enchant.Core;

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
            Input.init();
            Scene.game.onload = () => {
                Scene.game.addEventListener(enchant.Event.ENTER_FRAME, Input.update);
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

        static contollerUpdateHandler: (e: any) => void;
        static setScene(scene: Scene, updateHandler: (e) => void): void {
            Scene.game.removeEventListener(enchant.Event.ENTER_FRAME, Scene.contollerUpdateHandler);
            Scene.game.addEventListener(enchant.Event.ENTER_FRAME, updateHandler);
            Scene.contollerUpdateHandler = updateHandler;

            Scene.game.replaceScene(scene);
        }
    }


    class OpeningScene extends Scene {
    }

    class EndingScene extends Scene {
    }

}
