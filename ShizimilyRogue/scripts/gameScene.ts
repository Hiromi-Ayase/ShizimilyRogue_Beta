
module ShizimilyRogue.View {
    // セルのサイズ
    var OBJECT_WIDTH = 64;
    var OBJECT_HEIGHT = 64;

    enum Node { ROOT, VIEW }

    export class GameSceneData {
        constructor(
            public width: number,
            public height: number,
            public units: { [id: number]: Common.IUnit; },
            public items: { [id: number]: Common.IItem; },
            public effects: { [id: number]: Common.IEffect; },
            public getTable: (x: number, y: number, layer: Common.Layer) => Common.IObject) { }
    }

    export class GameScene extends Scene {
//        private menu: Menu;
        private message: Message;
        private pathShadow: Shadow;
        private view: View;

        constructor(private data: GameSceneData, fov: Common.IFOVData) {
            super();

            this.message = new Message();
            this.pathShadow = GameScene.getPathShadow();
            this.view = new View(data, fov);

            this.addChild(this.view);
            this.addChild(this.pathShadow);
            //this.addChild(this.message);

            this.update(fov, []);
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

        update(fov: Common.IFOVData, results: Common.Result[]): void {
            var player = this.data.units[Common.PLAYER_ID];
            if (fov.getObject(player.coord.place, Common.Layer.Floor).type == Common.DungeonObjectType.Room) {
                this.pathShadow.visible = false;
            } else {
                this.pathShadow.visible = true;
            }
            this.view.update(fov, results);
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
            this.messageArea.image = Scene.IMAGE_MESSAGE;
            this.messageArea.opacity = Message.MESSAGE_AREA_OPACITY;
            this.icon = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.icon.image = Scene.IMAGE_MESSAGE_ICON;
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

        setText(text: string): void {
            this.message.text = text;
        }

        set visible(flg: boolean) {
            this.messageArea.visible = flg;
            this.message.visible = flg;
            this.icon.visible = flg;
        }
    }

    class View extends enchant.Group {
        private units: { [id: number]: Unit } = {};

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
            for (var i = 0; i < fov.area.length; i++) {
                var id: number = fov.getObject(fov.area[i], Common.Layer.Unit).id;
                visible[id] = true;
            }
            for (var i = 0; i < fov.neighbor.length; i++) {
                var id: number = fov.getObject(fov.neighbor[i], Common.Layer.Unit).id;
                visible[id] = true;
            }

            // ユニットが新規作成された
            for (var id in this.data.units) {
                if (!(id in this.units)) {
                    this.units[id] = new Unit(this.data.units[id]);
                    this.unitGroup.addChild(this.units[id]);
                }
            }

            // ユニットが削除された
            for (var id in this.units) {
                if (!(id in this.data.units)) {
                    this.unitGroup.removeChild(this.units[id]);
                    delete this.units[id];
                } else {
                    // ついでに見えてるかどうかを入れておく
                    this.units[id].visible = visible[id] == true;
                }
            }

            // ユニットに行動を起こさせる
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var id = result.id;
                var unit = this.units[id];
                // FOVにあるものだけを表示
                unit.action(result);
            }
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
    
    class Shadow extends enchant.Map {
        constructor(
            private w: number,
            private h: number) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = Scene.IMAGE_SHADOW;
        }

        public update(area: number[][]) {
            var map:number[][] = [];
            for (var y = 0; y < this.h; y++) {
                map.push(new Array<number>(this.w));
                for (var x = 0; x < this.w; x++) {
                    map[y][x] = 0;
                }
            }
            for (var i = 0; i < area.length; i++) {
                map[area[i][1]][area[i][0]] = 1;
            }
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
            this.sprite.image = Scene.IMAGE_UNIT;
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
            return new Map(getViewTable, Scene.IMAGE_WALL);
        }

        public static floor(width: number, height: number, getTable: (x: number, y: number, layer: Common.Layer) => Common.IObject) {
            var table = (x, y) => { return getTable(x, y, Common.Layer.Floor) };
            var getViewTable = () => { return Map.getFloorViewTable(width, height, table) };
            return new Map(getViewTable, Scene.IMAGE_WALL);
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
