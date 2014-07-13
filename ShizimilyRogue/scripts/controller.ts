﻿module ShizimilyRogue.Controller {
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

    class GameOverScene implements Scene {
        private _view: View.GameOverScene = new View.GameOverScene();

        update(e): Scene {
            var a = View.Scene.keyA;
            if (a) {
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

                if (this.dungeonManager.endState != Common.EndState.None) {
                    return new GameOverScene();
                }
                if (this.dungeonManager.currentTurn == this.player) {
                    var dir = View.Scene.keyDirection;
                    var a = View.Scene.keyA;
                    var b = View.Scene.keyB;
                    if (dir != null) {
                        if (Common.DEBUG)
                            View.Scene.resetKeys();
                        this.player.setDir(dir);
                        if (this.getFov().movable[dir]) {
                            var action = Common.Action.Move();
                            this.input(action);
                        }
                    } else if (a == true) {
                        var action = Common.Action.Attack(this.player.atk);
                        this.input(action);
                    } else if (b == true) {
                        this.showMainMenu();
                    }
                }
                this.viewUpdate();
            }
            return null;
        }

        private showMainMenu(): void {
            var mainItems = ["攻撃", "アイテム"];
            if (this.cell.isItem()) {
                mainItems.push("ひろう");
            }

            this._view.showMenu(View.MenuType.Main, mainItems, n => {
                if (n == 0) {
                    this._view.closeMenu();
                    var action = Common.Action.Attack(this.player.atk);
                    this.input(action);
                }
                if (n == 1) { this.showItemMenu(); }
                if (n == 2) {
                    this._view.closeMenu();
                    var action = Common.Action.Pick();
                    this.input(action);
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
                        var innerItemNames = item.innerItems.map(item => item.name);
                        this._view.showMenu(View.MenuType.Item, innerItemNames, l => {
                            this._view.closeMenu();
                            var next: Common.Action = item.select(0, [item.innerItems[l]]);
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
                if (!action.isPick() && !action.isSystem()) {
                    break;
                }
            }
            if (!this.dungeonManager.hasNext()) {
                this._view.updateFrame(this.getFov(), 10);
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