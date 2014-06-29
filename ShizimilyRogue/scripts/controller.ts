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
        private player: Common.IPlayer;
        private get fov(): Common.IFOVData {
            return this.dungeonManager.getFOV();
        }

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
                    if (this.fov.movable[dir]) {
                        var action = Common.Action.Move(dir);
                        this.viewUpdate(action);
                    } else {
                        this.player.dir = dir;
                        this.viewUpdate();
                    }
                } else if (a == true) {
                    var action = Common.Action.Attack(this.player.dir);
                    this.viewUpdate(action);
                } else if (b == true) {
                    this._view.showMenu(View.MenuType.Main, ["攻撃", "アイテム"], n => {
                        if (n == 1) {
                            var itemNames = this.player.inventory.map(item => item.name);
                            this._view.showMenu(View.MenuType.Item, itemNames, m => {
                                this._view.closeMenu();
                                var action = Common.Action.Use(this.player.inventory[m]);
                                this.viewUpdate(action);
                            });
                        }
                    }, false);
                }
            }
            return null;
        }

        private viewUpdate(action: Common.Action = null): void {
            var results = action != null ? this.dungeonManager.next(action): [];
            this._view.update(this.fov, results);
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
                    this.dungeonManager.objects,
                    this.dungeonManager.getMap()
                );
            this.player = this.dungeonManager.player;
            this._view = new View.GameScene(data, fov);
        }
    }
} 