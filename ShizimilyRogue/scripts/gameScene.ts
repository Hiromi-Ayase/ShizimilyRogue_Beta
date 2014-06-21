
module ShizimilyRogue.View {
    // セルのサイズ
    var OBJECT_WIDTH = 64;
    var OBJECT_HEIGHT = 64;

    // メニューオープン時のキーロック開放処理フレーム数
    var KEY_LOCK_RELEASE = 10;

    export enum MenuType { Main }

    export class GameSceneData {
        constructor(
            public player: Common.IPlayer,
            public width: number,
            public height: number,
            public units: Common.IUnit[],
            public items: Common.IItem[],
            public effects: Common.IEffect[],
            public getTable: (x: number, y: number, layer: Common.Layer) => Common.IObject) {
        }
    }

    export class GameScene extends Scene {
        private message: Message;
        private menuGroup: enchant.Group;
        private pathShadow: Shadow;
        private view: View;

        constructor(private data: GameSceneData, fov: Common.IFOVData) {
            super();

            this.message = new Message();
            this.pathShadow = GameScene.getPathShadow();
            this.view = new View(data, fov);
            this.menuGroup = new enchant.Group();

            this.addChild(this.view);
            this.addChild(this.pathShadow);
            this.addChild(this.message);
            this.addChild(this.menuGroup);

            this.addMenuKeyHandler();
            this.update(fov, []);
        }

        private addMenuKeyHandler(): void {
            Scene.game.addEventListener(enchant.Event.UP_BUTTON_UP, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    var menu = <Menu>this.menuGroup.lastChild;
                    menu.up();
                }
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_UP, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    var menu = <Menu>this.menuGroup.lastChild;
                    menu.down();
                }
            });
            Scene.game.addEventListener(enchant.Event.A_BUTTON_DOWN, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    var menu = <Menu>this.menuGroup.lastChild;
                    menu.select();
                }
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_DOWN, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    this.menuGroup.removeChild(this.menuGroup.lastChild);
                    if (this.menuGroup.childNodes.length == 0)
                        this.tl.delay(KEY_LOCK_RELEASE).then(() => Scene.keyLock = false);
                }
            });
        }

        private static getPathShadow() {
            var map: number[][] = [];

            var x = Math.floor(VIEW_WIDTH / OBJECT_WIDTH / 2);
            var y = Math.floor(VIEW_HEIGHT / OBJECT_HEIGHT / 2) + 1;
            map.push([x + 1, y - 1]);
            map.push([x + 1, y]);
            map.push([x + 1, y + 1]);
            map.push([x, y - 1]);
            map.push([x, y]);
            map.push([x, y + 1]);
            map.push([x - 1, y - 1]);
            map.push([x - 1, y]);
            map.push([x - 1, y + 1]);
            var pathShadow = new Shadow(VIEW_WIDTH / OBJECT_WIDTH + 2, VIEW_HEIGHT / OBJECT_HEIGHT + 2);

            pathShadow.x = 0;
            pathShadow.y = - OBJECT_HEIGHT / 3;

            pathShadow.update(map);
            return pathShadow;
        }

        showMenu(type: MenuType, data: string[], selectHandler: (n: number) => void, multiple: boolean): void {
            Scene.keyLock = true;
            if (type == MenuType.Main) {
                data[0] = "" + ROT.RNG.getUniform();
                var menu = new MainMenu(data, selectHandler, multiple);
                this.menuGroup.addChild(menu);
            }
        }

        update(fov: Common.IFOVData, results: Common.Result[]): void {
            var player = this.data.player;
            if (fov.getObject(player.coord.place, Common.Layer.Floor).type == Common.DungeonObjectType.Room) {
                this.pathShadow.visible = false;
            } else {
                this.pathShadow.visible = true;
            }
            var message = "";
            this.view.update(fov, results);
            results.forEach(result => {
                if (result.type == Common.ResultType.Attack) {
                    var unit = (<Common.IUnit>result.obj);
                    message += unit.name + "はこうげきした！<br/>";
                } else if (result.type == Common.ResultType.Damage) {
                    var unit = (<Common.IUnit>result.obj);
                    message += unit.name + "は" + result.amount + "のダメージ！<br/>";
                }
            });
            this.message.show(message);
        }
    }

    class Message extends enchant.Group {
        private static MESSAGE_TOP = 380;
        private static MESSAGE_LEFT = 250;
        private static MESSAGE_WIDTH = VIEW_WIDTH - Message.MESSAGE_LEFT;
        private static MESSAGE_HEIGHT = 100;
        private static MESSAGE_AREA_OPACITY = 0.8;

        private messageArea: enchant.Sprite;
        private message: enchant.Label;
        private icon: enchant.Sprite;

        constructor() {
            super();
            this.messageArea = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.messageArea.image = Scene.IMAGE.MESSAGE.DATA;
            this.messageArea.opacity = Message.MESSAGE_AREA_OPACITY;
            this.icon = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.icon.image = Scene.IMAGE.MESSAGE_ICON.DATA;
            this.message = new enchant.Label();
            this.message.x = Message.MESSAGE_LEFT;
            this.message.y = Message.MESSAGE_TOP;
            this.message.font = "25px cursive";
            this.message.color = "white";

            this.message.width = Message.MESSAGE_WIDTH;
            this.message.height = Message.MESSAGE_HEIGHT;

            this.addChild(this.messageArea);
            this.addChild(this.icon);
            this.addChild(this.message);
        }

        show(text: string): void {
            this.message.text = text;
        }

        set visible(flg: boolean) {
            this.messageArea.visible = flg;
            this.message.visible = flg;
            this.icon.visible = flg;
        }
    }

    class View extends enchant.Group {
        private units: Unit[] = [];

        private roomShadow: Shadow;
        private groundMap: Map;
        private floorMap: Map;
        private unitGroup: enchant.Group;

        constructor(private data: GameSceneData, fov: Common.IFOVData) {
            super();
            this.roomShadow = new Shadow(data.width, data.height);
            this.floorMap = Map.floor(data.width, data.height, data.getTable); 
            //this.groundMap = Map.ground(data.width, data.height, data.getTable);
            this.unitGroup = new enchant.Group();

            this.addChild(this.floorMap);
            //this.addChild(this.groundMap);
            this.addChild(this.unitGroup);
            this.addChild(this.roomShadow);

            this.update(fov, []);
        }

        update(fov: Common.IFOVData, results: Common.Result[]): void {
            this.updateShadow(fov);
            this.updateUnits(fov, results);
            this.moveCamera();
        }

        private updateUnits(fov: Common.IFOVData, results: Common.Result[]): void {
            // 見えているIDを取得
            var visible: { [id: number]: boolean } = {};
            var index: { [id: number]: number } = {};
            for (var i = 0; i < fov.area.length; i++) {
                var id: number = fov.getObject(fov.area[i], Common.Layer.Unit).id;
                visible[id] = true;
            }

            this.units.forEach(viewUnit => {
                var ret = this.units.filter(unit => viewUnit.id == unit.id);
                if (ret.length == 0) {
                    // Dataの情報としてないが、Viewにはある＝消えたユニット
                    this.unitGroup.removeChild(viewUnit);
                }
            });

            // ユニットが新規作成された
            var i = 0;
            this.units = this.data.units.map(unit => {
                index[unit.id] = i++;
                var ret = this.units.filter(viewUnit => viewUnit.id == unit.id);
                var u: Unit;
                if (ret.length == 0) {
                    // Viewの情報としてないが、Dataにはある＝新規ユニット
                    u = new Unit(unit);
                    this.unitGroup.addChild(u);
                } else {
                    // 元からある
                    u = ret[0];
                }
                // ついでに見えてるかどうかを入れておく
                u.visible = visible[id] == true;
                return u;
            });

            // ユニットに行動を起こさせる

            results.forEach(result => {
                var id = result.obj.id;
                var unit = this.units[index[id]];
                // FOVにあるものだけを表示
                unit.action(result);
            });
        }

        // 視点移動
        private moveCamera(): void {
            var coord = this.data.units[Common.PLAYER_ID].coord;
            var x = VIEW_WIDTH / 2 - coord.x * OBJECT_WIDTH;
            var y = VIEW_HEIGHT / 2 - coord.y * OBJECT_HEIGHT;
            Scene.addAnimating();
            this.tl.moveTo(x, y, 10).then(function () {
                Scene.decAnimating();
            });
        }

        // 部屋にいる時の影
        private updateShadow(fov: Common.IFOVData): void {
            if (fov.getObject(fov.coord.place, Common.Layer.Floor).type == Common.DungeonObjectType.Room) {
                this.roomShadow.visible = true;
                this.roomShadow.update(fov.area);
            } else {
                this.roomShadow.visible = false;
            }
        }
    }
    

    class Menu extends enchant.Group {
        private static TOP_MARGIN = 36;
        private static LEFT_MARGIN = 36;
        private static LINE_SIZE = 36;
        private menuArea: enchant.Sprite;
        private elements: enchant.Group;
        private cursor: enchant.Sprite;
        private cursorIndex = 0;

        constructor(
            data: string[],
            private selectHandler: (n: number) => void,
            private multiple: boolean,
            background: enchant.Surface,
            top: number, left: number,
            private size: number) {
            super();
            this.menuArea = new enchant.Sprite(background.width, background.height);
            this.menuArea.image = background;
            var imgCursor = Scene.IMAGE.CURSOR.DATA;
            this.cursor = new enchant.Sprite(imgCursor.width, imgCursor.height);
            this.cursor.image = imgCursor;
            this.cursor.x = Menu.LEFT_MARGIN;
            this.elements = new enchant.Group();;

            this.setMenuElement(data);
            this.show();
            this.addChild(this.menuArea);
            this.addChild(this.elements);
            this.addChild(this.cursor);
        }

        private setMenuElement(data: string[]): void {
            var count = 0;
            data.forEach(d => {
                var label: enchant.Label = new enchant.Label();
                label.text = d;
                label.height = Menu.LINE_SIZE;
                label.font = "32px cursive";
                label.color = "white";
                label.y = (count % this.size) * Menu.LINE_SIZE + Menu.TOP_MARGIN;
                label.x = Menu.LEFT_MARGIN + Scene.IMAGE.CURSOR.DATA.width;
                this.elements.addChild(label);
                count++;
            });
        }

        private show(): void {
            var page = Math.floor(this.cursorIndex / this.size);
            for (var i = 0; i < this.elements.childNodes.length; i++) {
                this.elements.childNodes[i].visible = i >= page * this.size && i < (page + 1) * this.size;
            }
            this.cursor.y = (this.cursorIndex % this.size) * Menu.LINE_SIZE + Menu.TOP_MARGIN;
        }

        public up(): void {
            if (this.cursorIndex > 0)
                this.cursorIndex--;
            this.show();
        }

        public down(): void {
            if (this.cursorIndex < this.elements.childNodes.length - 1)
                this.cursorIndex++;
            this.show();
        }

        public select(): void {
            this.selectHandler(this.cursorIndex);
        }
    }

    class MainMenu extends Menu {
        constructor(data: string[], selectHandler: (n: number) => void, multiple: boolean) {
            super(data, selectHandler, multiple, Scene.IMAGE.MEMU_MAIN.DATA, 10, 10, 3);
        }
    }

    class Shadow extends enchant.Map {
        constructor(
            private w: number,
            private h: number) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = Scene.IMAGE.SHADOW.DATA;
        }

        public update(area: number[][]) {
            var map:number[][] = [];
            for (var y = 0; y < this.h; y++) {
                map.push(new Array<number>(this.w));
                for (var x = 0; x < this.w; x++) {
                    map[y][x] = 0;
                }
            }
            area.forEach(a => { map[a[1]][a[0]] = 1; });
            this.loadData(map);
        }
    }

    class Unit extends enchant.Group {
        private data: Common.IUnit;
        private sprite: enchant.Sprite;
        constructor(unit: Common.IUnit) {
            super();
            this.data = unit;

            this.sprite = new enchant.Sprite(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.sprite.image = Scene.IMAGE.UNIT.DATA;
            this.sprite.frame = 1;
            var coord = this.data.coord;
            this.moveTo(coord.x * OBJECT_WIDTH, (coord.y - 0.5) * OBJECT_HEIGHT);
            this.addChild(this.sprite);
        }

        action(result: Common.Result): void {
            if (this.sprite.visible == false) {
                var coord = this.data.coord;
                this.moveTo(coord.x * OBJECT_WIDTH, (coord.y - 0.5) * OBJECT_HEIGHT);
                return;
            }
            if (result.type == Common.ResultType.Move) {
                var coord = this.data.coord;
                Scene.addAnimating();
                this.tl.moveTo(coord.x * OBJECT_WIDTH, (coord.y - 0.5) * OBJECT_HEIGHT, 10).then(function() {
                    Scene.decAnimating();
                });
            }
        }

        set visible(flg: boolean) {
            this.sprite.visible = flg;
        }

        get id(): number {
            return this.data.id;
        }
    }
    
    class Map extends enchant.Map {
        constructor(
            private getTable: () => number[][],
            image: enchant.Surface) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = image;
            this.update();
        }

        public static ground(width: number, height: number, getTable: (x: number, y: number, layer: Common.Layer) => Common.IObject) {
            var table = (x, y) => { return getTable(x, y, Common.Layer.Ground) };
            var getViewTable = () => { return Map.getGroundViewTable(width, height, table) };
            return new Map(getViewTable, Scene.IMAGE.WALL.DATA);
        }

        public static floor(width: number, height: number, getTable: (x: number, y: number, layer: Common.Layer) => Common.IObject) {
            var table = (x, y) => { return getTable(x, y, Common.Layer.Floor) };
            var getViewTable = () => { return Map.getFloorViewTable(width, height, table) };
            return new Map(getViewTable, Scene.IMAGE.WALL.DATA);
        }

        public update() {
            var viewTable = this.getTable();
            this.loadData(viewTable);
        }

        private static getGroundViewTable(w: number, h: number,
            floorTable: (x: number, y: number) => Common.IObject): number[][] {
            var map:number[][] = [];
            return map;
        }

        private static getFloorViewTable(w: number, h: number,
            floorTable: (x: number, y: number) => Common.IObject): number[][] {
            var blockTable = [
                0, 17, 4, 4, 16, 36, 4, 4, // 0 - 7
                7, 26, 9, 9, 7, 26, 9, 9, // 8 - 15
                18, 32, 21, 21, 39, 40, 21, 21, // 16 - 23
                7, 26, 9, 9, 7, 26, 9, 9, // 24 - 31
                5, 22, 1, 1, 23, 45, 1, 1, // 32 - 39
                11, 30, 15, 15, 11, 30, 15, 15,// 40 - 47
                5, 22, 1, 1, 23, 45, 1, 1, // 48 - 55
                11, 30, 15, 15, 11, 30, 15, 15,// 56 - 63
                19, 38, 20, 20, 33, 41, 20, 20, // 64 - 71
                24, 46, 28, 28, 24, 46, 28, 28, // 72 - 79
                37, 43, 44, 44, 42, 34, 44, 44, // 80 - 87
                24, 46, 28, 28, 24, 46, 28, 28, // 88 - 95
                5, 22, 1, 1, 23, 45, 1, 1, // 96 - 103
                11, 30, 15, 15, 11, 30, 15, 15, // 104 - 111
                5, 22, 1, 1, 23, 45, 1, 1, // 112 - 119
                11, 30, 15, 15, 11, 30, 15, 15, // 120 - 127
                6, 6, 29, 29, 27, 27, 8, 8,// 128 - 135
                2, 2, 12, 12, 2, 2, 12, 12,// 136 - 143
                25, 25, 29, 29, 47, 47, 29, 29,// 144 - 151
                2, 2, 12, 12, 2, 2, 12, 12, // 152 - 159
                10, 10, 14, 14, 31, 31, 14, 14,// 160 - 167
                13, 13, 3, 3, 13, 13, 3, 3, // 168 - 175
                10, 10, 14, 14, 31, 31, 14, 14,// 176 - 183
                25, 25, 29, 29, 47, 47, 29, 29,// 184 - 191
                6, 6, 29, 29, 27, 27, 8, 8,//192 - 199
                2, 2, 12, 12, 2, 2, 12, 12,//200 - 207
                25, 25, 29, 29, 47, 47, 29, 29,//208 - 215
                2, 2, 12, 12, 2, 2, 12, 12,// 216 - 223
                10, 10, 14, 14, 31, 31, 14, 14,// 224 - 231
                13, 13, 3, 3, 13, 13, 3, 3, // 232 - 239
                10, 10, 14, 14, 31, 31, 14, 14,// 240 - 247
                13, 13, 3, 3, 13, 13, 3, 3, // 248 - 255
            ];
            var map = [];
            var WALL = Common.DungeonObjectType.Wall;
            var ITEM = Common.DungeonObjectType.Wall;
            var flg = true;

            for (var y = 0; y < h; y++) {
                map.push(new Array(w));
                for (var x = 0; x < w; x++) {
                    flg = !flg;
                    var type = floorTable(x, y).type;
                    if (type == WALL) {
                        var blockId = 0;
                        blockId |= (x == 0 || y == 0 || floorTable(x - 1, y - 1).type == WALL) ? 0 : 1;
                        blockId |= (y == 0 || floorTable(x, y - 1).type == WALL) ? 0 : 2;
                        blockId |= (x == w - 1 || y == 0 || floorTable(x + 1, y - 1).type == WALL) ? 0 : 4;
                        blockId |= (x == w - 1 || floorTable(x + 1, y).type == WALL) ? 0 : 8;
                        blockId |= (x == w - 1 || y == h - 1 || floorTable(x + 1, y + 1).type == WALL) ? 0 : 16;
                        blockId |= (y == h - 1 || floorTable(x, y + 1).type == WALL) ? 0 : 32;
                        blockId |= (x == 0 || y == h - 1 || floorTable(x - 1, y + 1).type == WALL) ? 0 : 64;
                        blockId |= (x == 0 || floorTable(x - 1, y).type == WALL) ? 0 : 128;

                        var mapId = blockTable[blockId];
                        map[y][x] = mapId;
                    } else {
                        map[y][x] = flg ? 48 : 49;
                    }
                }
            }
            return map;
        }
    }
}
