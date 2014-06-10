module ShizimilyRogue.Controller {
    // ダンジョンの論理サイズ
    var WIDTH = 25;
    var HEIGHT = 25;

    export class Game {
        private dungeonManager: Model.DungeonManager;
        private gameScene: View.GameScene;

        constructor() {
        }

        // フレームごとに呼ばれる
        private update(e): any {
            if (!View.Scene.animating) {
                var unit = this.dungeonManager.next();
                var action: { [id: number]: Common.Action } = null;
                if (unit.id == Common.PLAYER_ID) {
                    if (View.Scene.keyDown) {
                        action = this.dungeonManager.phase(unit, Model.Action.Move(Common.DIR.DOWN));
                    } else if (View.Scene.keyLeft) {
                        action = this.dungeonManager.phase(unit, Model.Action.Move(Common.DIR.LEFT));
                    } else if (View.Scene.keyUp) {
                        action = this.dungeonManager.phase(unit, Model.Action.Move(Common.DIR.UP));
                    } else if (View.Scene.keyRight) {
                        action = this.dungeonManager.phase(unit, Model.Action.Move(Common.DIR.RIGHT));
                    }

                } else {
                    action = this.dungeonManager.phase(unit);
                }
                if (action != null)
                this.gameScene.updateUnit(unit,action[0]);
            }
        }

        // ゲームの開始
        public start(): void {
            View.Scene.init(() => {
                this.newGame();
            }, (e) => {
                this.update(e);
            });
        }

        private newGame(): void {
            // Dungeon(Model)とSceneManager(View)の作成
            this.dungeonManager = new Model.DungeonManager(WIDTH, HEIGHT);

            // Map生成
            var floorTable = this.dungeonManager.getMap(Common.Layer.Floor);
            var groundTable = this.dungeonManager.getMap(Common.Layer.Ground);
            var units = this.dungeonManager.units;

            this.gameScene = new View.GameScene(floorTable, groundTable, units);
            View.Scene.setScene(this.gameScene);
        }

        // ゲームの終了判定
        private isEnd(): void {
        }
    }
} 