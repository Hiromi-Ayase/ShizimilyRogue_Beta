module ShizimilyRogue.View {
    export class ClearScene extends Scene {
        constructor() {
            super();
            var title = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            title.image = Scene.ASSETS.TITLE.DATA;
            var label = new enchant.Label();
            label.text = "おめでとう！しじみりちゃんは帰れました！！  Aボタンでメニューに戻ります。";
            this.addChild(title);
            this.addChild(label);
        }
    }
}

