module ShizimilyRogue.View {
    export class TitleScene extends Scene {
        constructor() {
            super();
            var title = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            title.image = Scene.IMAGE.TITLE.DATA;
            var label = new enchant.Label();
            label.text = "Aボタンを押してね";
            this.addChild(title);
            this.addChild(label);
        }
    }
}

