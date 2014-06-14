module ShizimilyRogue.Controller {
    // ダンジョンの論理サイズ
    var WIDTH = 15;
    var HEIGHT = 15;

    export class Game {
        private scene: Scene;

        // ゲームの開始
        public start(): void {
            View.Scene.init(() => {
                // 最初はタイトル
                this.setScene(new GameScene());
            });
        }

        private setScene(scene: Scene) {
            this.scene = scene;
            View.Scene.setScene(scene.view, (e) => {
                var scene = this.scene.update(e);
                if (scene != null) {
                    this.setScene(scene);
                }
            });
        }
    }

    interface Scene {
        update(e): Scene;
        view: View.Scene;
    }

    class TitleScene implements Scene {
        private _view: View.TitleScene = new View.TitleScene();

        update(e): Scene {
            var a = View.Scene.keyA;
            if (a) {
                return new GameScene();
            }
            return null;
        }

        get view() {
            return this._view;
        }
    }

    class GameScene implements Scene {
        private dungeonManager: Model.DungeonManager;
        private _view: View.GameScene;

        constructor() {
            this.init();
        }

        update(e): Scene {
            if (!View.Scene.animating) {
                var dir = View.Scene.keyDirection;
                var a = View.Scene.keyA;
                var b = View.Scene.keyB;
                if (dir != null) {
                    View.Scene.resetKeys();
                    var action = new Common.MoveAction(dir);
                    var results = this.dungeonManager.next(action);
                    this._view.updateUnit(results);
                    var fov = this.dungeonManager.getFOV();
                    this._view.updateShadow(fov);
                }
            }
            return null;
        }

        get view() {
            return this._view;
        }

        private init(): void {
            // Dungeon(Model)とSceneManager(View)の作成
            this.dungeonManager = new Model.DungeonManager(WIDTH, HEIGHT);

            // Map生成
            var fov = this.dungeonManager.getFOV();
            var units = this.dungeonManager.units;
            var items = this.dungeonManager.items;
            var floorTable = this.dungeonManager.getMap(Common.Layer.Floor);
            var groundTable = this.dungeonManager.getMap(Common.Layer.Ground);
            var width = this.dungeonManager.width;
            var height = this.dungeonManager.height;

            this._view = new View.GameScene(width, height, floorTable, groundTable, units, items);
        }
    }
} 