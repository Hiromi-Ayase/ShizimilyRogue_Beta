
module ShizimilyRogue.View {
    // セルのサイズ
    var OBJECT_WIDTH = 64;
    var OBJECT_HEIGHT = 64;

    export class GameScene extends Scene {
        private map: Map;
        private player: Common.IPlayer;
        private units: { [id: number]: Unit; } = {};
        private view: enchant.Group = new enchant.Group();
        private message: Message;

        constructor(floorTable: Common.DungeonObjectType[][], groundTable: Common.DungeonObjectType[][], units: { [id: number]: Common.IUnit; }) {
            super();

            // mapの追加
            this.map = new Map(floorTable, groundTable);
            this.view.addChild(this.map);

            // unitの追加
            for (var id in units) {
                this.addUnit(units[id]);
            }
            this.player = <Common.IPlayer>units[Common.PLAYER_ID];
            this.addChild(this.view);

            // メッセージエリアの追加
            this.message = new Message();
            this.addChild(this.message);

            this.moveCamera();
        }

        private moveCamera(): void {
            // 視点移動
            var x = VIEW_WIDTH / 2 - this.player.coord.x * OBJECT_WIDTH;
            var y = VIEW_HEIGHT / 2 - this.player.coord.y * OBJECT_HEIGHT;
            Scene.addAnimating();
            this.view.tl.moveTo(x, y, 10).then(function () {
                Scene.decAnimating();
            });
        }

        updateUnit(results: Common.Result[]): void {
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                this.units[result.id].action(result);
            }
            this.moveCamera();
        }

        removeUnit(unit: Common.IUnit): void {
            this.view.removeChild(this.units[unit.id]);
            delete this.units[unit.id];
        }

        addUnit(unit: Common.IUnit): void {
            var _unit = new Unit(unit);
            this.units[unit.id] = _unit;
            this.view.addChild(_unit);
        }
    }


    class Element extends enchant.Group {
    }

    class Message extends Element {
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
    }

    class Unit extends Element {
        private _data: Common.IUnit;
        constructor(unit: Common.IUnit) {
            super();
            this._data = unit;

            var sprite = new enchant.Sprite(OBJECT_WIDTH, OBJECT_HEIGHT);
            sprite.image = Scene.IMAGE_UNIT;
            sprite.frame = 1;
            var coord = this._data.coord;
            this.moveTo(coord.x * OBJECT_WIDTH, (coord.y - 0.5) * OBJECT_HEIGHT);
            this.addChild(sprite);
        }

        action(result: Common.Result): void {
            if (result.type == Common.ResultType.Move) {
                var coord = this._data.coord;
                Scene.addAnimating();
                this.tl.moveTo(coord.x * OBJECT_WIDTH, (coord.y - 0.5) * OBJECT_HEIGHT, 10).then(function() {
                    Scene.decAnimating();
                });
            }
        }
    }
    
    class Map extends Element {
        constructor(floorTable: Common.DungeonObjectType[][], groundTable: Common.DungeonObjectType[][]) {
            super();
            var groundViewTable = Map.getGroundViewTable(groundTable);
            var floorViewTable = Map.getFloorViewTable(groundTable);
            this.addMap(floorViewTable, Scene.IMAGE_FLOOR);
            this.addMap(groundViewTable, Scene.IMAGE_WALL);
        }

        private addMap(table: number[][], image:enchant.Surface): void {
            var map = new enchant.Map(OBJECT_WIDTH, OBJECT_HEIGHT);
            map.image = image;
            map.loadData(table);
            this.addChild(map)
        }

        private static getFloorViewTable(table: Common.DungeonObjectType[][]): Array<Array<number>> {
            var map = [];

            var w = table[0].length;
            var h = table.length;

            var flg = 0;
            for (var y = 0; y < h; y++) {
                var line = table[y];
                map.push(new Array(w));
                for (var x = 0; x < w; x++) {
                    map[y][x] = flg;
                    flg = (flg + 1) % 2;
                }
            }
            return map;
        }

        private static getGroundViewTable(table: Common.DungeonObjectType[][]): Array<Array<number>> {
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

            var w = table[0].length;
            var h = table.length;
            var wall = Common.DungeonObjectType.Wall;

            for (var y = 0; y < h; y++) {
                var line = table[y];
                map.push(new Array(w));
                for (var x = 0; x < w; x++) {
                    var type = line[x];
                    if (type == wall) {
                        var blockId = 0;
                        blockId |= (x == 0 || y == 0 || table[y - 1][x - 1] == wall) ? 0 : 1;
                        blockId |= (y == 0 || table[y - 1][x] == wall) ? 0 : 2;
                        blockId |= (x == w - 1 || y == 0 || table[y - 1][x + 1] == wall) ? 0 : 4;
                        blockId |= (x == w - 1 || table[y][x + 1] == wall) ? 0 : 8;
                        blockId |= (x == w - 1 || y == h - 1 || table[y + 1][x + 1] == wall) ? 0 : 16;
                        blockId |= (y == h - 1 || table[y + 1][x] == wall) ? 0 : 32;
                        blockId |= (x == 0 || y == h - 1 || table[y + 1][x - 1] == wall) ? 0 : 64;
                        blockId |= (x == 0 || table[y][x - 1] == wall) ? 0 : 128;

                        var mapId = blockTable[blockId];
                        map[y][x] = mapId;
                    } else {
                        map[y][x] = 35;
                    }
                }
            }
            return map;
        }
    }
}
