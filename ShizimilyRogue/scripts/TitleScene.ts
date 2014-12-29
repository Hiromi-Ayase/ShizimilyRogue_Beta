module ShizimilyRogue.View {
    export class TitleScene extends Scene {
        private static CONTENT_WIDTH: number = 400;
        private static CONTENT_HEIGHT: number = 100;
        private static CONTENT_TOP: number = 300;

        constructor() {
            super();

            var titleBackground = new enchant.Sprite(TitleScene.CONTENT_WIDTH, TitleScene.CONTENT_HEIGHT);
            var surface = new enchant.Surface(TitleScene.CONTENT_WIDTH, TitleScene.CONTENT_HEIGHT);
            titleBackground.image = surface;
            titleBackground.opacity = 0.7;
            titleBackground.x = (VIEW_WIDTH - TitleScene.CONTENT_WIDTH) / 2;
            titleBackground.y = TitleScene.CONTENT_TOP;

            surface.context.fillStyle = "black";
            surface.context.fillRect(0, 0, TitleScene.CONTENT_WIDTH, TitleScene.CONTENT_HEIGHT);

            var img = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            img.image = Scene.ASSETS.TITLE.DATA;

            var content = new enchant.Label();
            content.text = "Aボタンを押してね";
            content.color = "white";
            content.textAlign = "center";
            content.width = TitleScene.CONTENT_WIDTH;
            content.font = "26px cursive";
            content.y = TitleScene.CONTENT_TOP + (titleBackground.height - 20) / 2;
            content.x = titleBackground.x;

            var title = new enchant.Sprite(Scene.ASSETS.LOGO.DATA.width, Scene.ASSETS.LOGO.DATA.height);
            title.image = Scene.ASSETS.LOGO.DATA;
            title.x = 30;
            title.y = 30;

            this.addChild(img);
            this.addChild(titleBackground);
            this.addChild(content);
            this.addChild(title);
        }
    }
}

