module ShizimilyRogue.Controller {
    // ダンジョンの論理サイズ
    var WIDTH = 25;
    var HEIGHT = 25;

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
                    if (Common.DEBUG)
                        View.Scene.resetKeys();
                    var action = new Common.Action(this.dungeonManager.player, Common.ActionType.Move, dir);
                    var results = this.dungeonManager.next(action);
                    var fov = this.dungeonManager.getFOV();
                    this._view.update(fov, results);
                } else if (b == true) {
                    this._view.showMenu(View.MenuType.Main, ["aaa", "bbb", "ccc", "ddd"], n => { }, false);
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
            var data = new View.GameSceneData(
                    this.dungeonManager.player,
                    this.dungeonManager.width,
                    this.dungeonManager.height,
                    this.dungeonManager.units,
                    this.dungeonManager.items,
                    null, // effects
                    this.dungeonManager.getMap()
                );

            this._view = new View.GameScene(data, fov);
        }
    }
} 