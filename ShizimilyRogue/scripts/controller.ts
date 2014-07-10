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
            return this.dungeonManager.getCell(this.player.coord.x, this.player.coord.y);
        }

        constructor() {
            this.init();
        }

        update(e): Scene {
            if (!View.Scene.animating) {
                if (this.dungeonManager.endState != Common.EndState.None) {
                    return new GameOverScene();
                }

                var dir = View.Scene.keyDirection;
                var a = View.Scene.keyA;
                var b = View.Scene.keyB;
                if (dir != null) {
                    if (Common.DEBUG)
                        View.Scene.resetKeys();
                    this.player.setDir(dir);
                    if (this.getFov().movable[dir]) {
                        var action = Common.Action.Move();
                        this.viewUpdate(action);
                    }
                } else if (a == true) {
                    var action = Common.Action.Attack(this.player.atk);
                    this.viewUpdate(action);
                } else if (b == true) {
                    this.showMainMenu();
                }
            }
            return null;
        }

        private showMainMenu(): void {
            var mainItems = ["攻撃", "アイテム"];
            if (this.cell.isItem()) {
                mainItems.push("ひろう");
            }

            this._view.showMenu(View.MenuType.Main, mainItems, n => {
                if (n == 1) { this.showItemMenu(); }
            }, false);
        }

        private showItemMenu(): void {
            var itemNames = this.player.inventory.map(item => item.name);
            this._view.showMenu(View.MenuType.Item, itemNames, m => {
                var item = this.player.inventory[m];
                var commandNames = [];
                var next: Common.Action[] = [];
                item.commands.forEach(command => {
                    switch (command) {
                        case Common.ActionType.Use:
                            commandNames.push("使う");
                            next.push(Common.Action.Use(item));
                            break;
                        case Common.ActionType.Throw:
                            commandNames.push("投げる");
                            next.push(Common.Action.Throw(item));
                            break;
                        case Common.ActionType.Place:
                            commandNames.push("置く");
                            next.push(Common.Action.Place(item));
                            break;
                    }
                });
                this._view.showMenu(View.MenuType.Use, commandNames, command => {
                    this._view.closeMenu();
                    var action = next[command];
                    this.viewUpdate(action);
                });
            });
        }

        private viewUpdate(input: Common.Action = null): void {
            if (input != null) {
                var results = [];
                this.dungeonManager.next(input, action => {
                    results.push(action);
                    this._view.update(this.getFov(), action, null, 10);
                }, (receiver, action) => {
                    this._view.update(this.getFov(), action, receiver, 10);
                });
                this._view.updateTurn(this.getFov(), results, 10);
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
            results.forEach(action => this._view.update(fov, action, null,  10));
            this._view.updateTurn(fov, results, 10);
        }
    }
} 