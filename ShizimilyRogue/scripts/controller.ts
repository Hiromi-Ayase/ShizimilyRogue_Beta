module ShizimilyRogue.Controller {
    // ダンジョンの論理サイズ
    var WIDTH = 25;
    var HEIGHT = 25;

    export class Game {
        private sceneManager: View.SceneManager;
        private map: Dungeon.Map;

        constructor() {
        }

        // フレームごとに呼ばれる
        public updateFrame(): void {
        }

        // 入力ごとに呼ばれる
        public inputHandler(code:Dungeon.Input): void {
        }

        // ゲームの開始
        public start(): void {
            // Dungeon(Model)とSceneManager(View)の作成
            this.sceneManager = new View.SceneManager();
            var t = this;

            // Initialize view
            View.Scene.init(function () {
                t.newGame();
            });
        }

        private newGame(): void {
            // Map生成
            this.map = new Dungeon.Map(WIDTH, HEIGHT);
            // SceneをGameSceneに
            var floorTable = this.map.getTable(Common.Layer.Floor);
            var groundTable = this.map.getTable(Common.Layer.Ground);
            this.sceneManager.scene = new View.GameScene(floorTable, groundTable);
        }

        // ゲームの終了判定
        private isEnd(): void {
        }
    }
} 