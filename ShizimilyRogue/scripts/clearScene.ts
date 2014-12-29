module ShizimilyRogue.View {
    export class ClearScene extends Scene {
        private static CONTENT_WIDTH: number = 400;
        private static CONTENT_HEIGHT: number = 100;
        private static CONTENT_TOP: number = 300;

        constructor() {
            super();

            var titleBackground = new enchant.Sprite(ClearScene.CONTENT_WIDTH, ClearScene.CONTENT_HEIGHT);
            var surface = new enchant.Surface(ClearScene.CONTENT_WIDTH, ClearScene.CONTENT_HEIGHT);
            titleBackground.image = surface;
            titleBackground.opacity = 0.7;
            titleBackground.x = (VIEW_WIDTH - ClearScene.CONTENT_WIDTH) / 2;
            titleBackground.y = ClearScene.CONTENT_TOP;

            surface.context.fillStyle = "black";
            surface.context.fillRect(0, 0, ClearScene.CONTENT_WIDTH, ClearScene.CONTENT_HEIGHT);

            var img = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            img.image = Scene.ASSETS.TITLE.DATA;

            var content = new enchant.Label();
            content.text = "タイトル画面へ！(Aボタン)";
            content.color = "white";
            content.textAlign = "center";
            content.width = ClearScene.CONTENT_WIDTH;
            content.font = "26px cursive";
            content.y = ClearScene.CONTENT_TOP + (titleBackground.height - 20) / 2;
            content.x = titleBackground.x;

            var title = new enchant.Label();
            title.text = "しじみりちゃんは<br/><br/>帰れました！";
            title.color = "white";
            title.textAlign = "center";
            title.width = VIEW_WIDTH;
            title.font = "56px cursive";
            title.y = 50;
            title.x = 0;

            var titleShadow = new enchant.Label();
            titleShadow.text = title.text
            titleShadow.color = "black";
            titleShadow.textAlign = "center";
            titleShadow.width = VIEW_WIDTH;
            titleShadow.font = "56px cursive";
            titleShadow.y = title.y + 4;
            titleShadow.x = 4;


            this.addChild(img);
            this.addChild(titleBackground);
            this.addChild(content);
            this.addChild(titleShadow);
            this.addChild(title);
        }
    }
}

