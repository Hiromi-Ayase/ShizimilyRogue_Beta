module ShizimilyRogue.View {
    // ゲーム画面のサイズ
    var VIEW_WIDTH = 640;
    var VIEW_HEIGHT = 480;
    var FPS = 30;

    // シーン
    export class Scene extends enchant.Scene {
        static IMAGES: string[] = ["../images/wall_01.png", "../images/floor_01.png"];
        static IMAGE_WALL: enchant.Surface;
        static IMAGE_FLOOR: enchant.Surface;

        static game: enchant.Core;

        static init(onloadHandler:Function) {
            enchant();
            Scene.game = new enchant.Core(VIEW_WIDTH, VIEW_HEIGHT);
            Scene.game.fps = FPS;
            Scene.game.preload(Scene.IMAGES);
            Scene.game.onload = () => {
                Scene.IMAGE_WALL = Scene.game.assets[Scene.IMAGES[0]];
                Scene.IMAGE_FLOOR = Scene.game.assets[Scene.IMAGES[1]];
                onloadHandler();
            };
            Scene.game.start();
        }
    }

    export class SceneManager {
        set scene(scene: Scene) {
            Scene.game.replaceScene(scene);
        }
    }

    class OpeningScene extends Scene {
    }

    class EndingScene extends Scene {
    }

}
