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
            var a = View.Input.BtnA.count;
            if (a > 0) {
                return new GameScene();
            }
            return null;
        }

        get view() {
            return this._view;
        }
    }

    class GameOverScene implements Scene {
        private _view: View.GameOverScene = new View.GameOverScene();

        update(e): Scene {
            var a = View.Input.BtnA.count;
            if (a > 0) {
                return new TitleScene();
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
        private player: Common.IUnit;
        private getFov(): Common.IFOVData {
            return this.dungeonManager.getFOV(this.player);
        }

        private get cell(): Common.ICell {
            return this.dungeonManager.getCell(this.player.cell.coord.x, this.player.cell.coord.y);
        }

        constructor() {
            this.init();
        }

        update(e): Scene {
            if (!View.Scene.animating) {
                switch (this.dungeonManager.endState) {
                    case Common.EndState.GameOver:
                        return new GameOverScene();
                    case Common.EndState.Up:
                        return new GameScene();
                }

                if (this.dungeonManager.currentTurn == this.player && this._view.hasFieldFocus()) {
                    var dir = View.Input.keyDirection;

                    if (View.Input.BtnY.count > 0) {
                        // TBD:飛び道具
                        if (View.Input.BtnA.count > 0) {

                        // TBD:指定方向にダッシュ
                        } else if (View.Input.BtnB.count > 0 && dir != null) {
                            this.player.setDir(dir);

                        // 方向転換
                        } else if (dir != null) {
                            this.player.setDir(dir);
                        }

                    // 移動
                    } else if (dir != null) {
                        /*if (Common.DEBUG)
                            View.Scene.resetKeys();*/
                        this.player.setDir(dir);
                        if (View.Input.BtnX.count == 0 && this.getFov().movable[dir]) {
                            var action = Common.Action.Move();
                            this.input(action);
                        }

                    // 攻撃
                    } else if (View.Input.BtnA.count > 0) {
                        var action = Common.Action.Attack();
                        this.input(action);

                    // TBD:前方ダッシュ
                    } else if (View.Input.BtnB.count > 5) {

                    // メニュー
                    } else if (View.Input.BtnX.count > 0) {
                        this.showMainMenu();
                    }


                }
                this.viewUpdate();
            }
            this._view.updateFrame(10);
            return null;
        }

        private showMainMenu(): void {
            var mainItems = ["攻撃", "アイテム"];
            if (this.cell.isItem()) {
                mainItems.push("ひろう");
            } else if (this.cell.isExit()) {
                mainItems.push("次の階へ");
            }

            this._view.showMenu(View.MenuType.Main, mainItems, n => {
                if (n == 0) {
                    this._view.closeMenu();
                    var action = Common.Action.Attack();
                    this.input(action);
                }
                if (n == 1) { this.showItemMenu(); }
                if (n == 2) {
                    this._view.closeMenu();
                    if (this.cell.isItem()) {
                        var action = Common.Action.Pick();
                        this.input(action);
                    } else if (this.cell.isExit()) {
                        var action = Common.Action.None();
                        action.end = Common.EndState.Up;
                        this.input(action);
                    }
                }
            }, false);
        }

        private showItemMenu(): void {
            var itemNames = this.player.inventory.map(item => item.name);
            this._view.showMenu(View.MenuType.Item, itemNames, m => {
                var item = this.player.inventory[m];
                var commandNames = item.commands();
                this._view.showMenu(View.MenuType.Use, item.commands(), n => {
                    if (commandNames[n] == "見る") {
                        var pcCase = <Model.Case>item;
                        var innerItemNames = pcCase.innerItems.map(item => item.name);
                        this._view.showMenu(View.MenuType.Item, innerItemNames, l => {
                            this._view.closeMenu();
                            var next: Common.Action = item.select(0, [pcCase.innerItems[l]]);
                            this.input(next);
                        });
                    } else if (commandNames[n] == "入れる") {
                        this._view.showMenu(View.MenuType.Item, itemNames, l => {
                            this._view.closeMenu();
                            var next: Common.Action = item.select(1, [this.player.inventory[l]]);
                            this.input(next);
                        });
                    } else {
                        this._view.closeMenu();
                        var next: Common.Action = item.select(n);
                        this.input(next);
                    }
                });
            });
        }

        private input(action: Common.Action): void {
            this.dungeonManager.addInput([action]);
        }

        private viewUpdate(): void {
            while (this.dungeonManager.hasNext()) {
                var action = this.dungeonManager.update();
                this._view.updateAction(this.getFov(), action, 10);
                if (!action.isPick() && !action.isSystem() && !action.isNone()) {
                    break;
                }
            }
        }

        get view() {
            return this._view;
        }

        private init(): void {
            // Dungeon(Model)とSceneManager(View)の作成
            this.dungeonManager = new Model.DungeonManager(WIDTH, HEIGHT);
            var results = this.dungeonManager.init();
            this.player = this.dungeonManager.currentTurn;

            // Map生成
            var fov = this.getFov();
            var data = new View.GameSceneData(
                    this.player,
                    fov.width,
                    fov.height,
                    this.dungeonManager.objects,
                    (x, y) => this.dungeonManager.getCell(x, y)
                );

            this._view = new View.GameScene(data, fov);
            results.forEach(action => this._view.updateAction(fov, action, 10));
        }
    }
} 