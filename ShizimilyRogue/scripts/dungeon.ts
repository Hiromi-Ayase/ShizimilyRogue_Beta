﻿

module ShizimilyRogue.Model {
    declare var ROT;

    class DungeonObject {
        coord: Common.Coord = null;
        corner: boolean = false;
        type: Common.DungeonObjectType = null;
    }

    export class Action implements Common.Action {
        dir = 0;
        type = null;
        item1 = null;
        item2 = null;

        static Move(dir:number): Action {
            var action = new Action();
            action.dir = dir;
            action.type = Common.ActionType.Move;
            return action;
        }
    }

    export class DungeonManager {
        private _units: Unit[] = new Array<Unit>();
        private _player: Player;
        private _map: Map;

        private queue: Unit[] = new Array<Unit>();

        constructor(w: number, h: number) {
            this._map = new Map(w, h);

            // Playerを配置
            this._player = new Player();
            this.addUnit(this._player);
        }

        addEnemy(): Common.Unit {
            var enemy = new Enemy();
            this.addUnit(enemy);
            return enemy;
        }

        private addUnit(unit: Unit) {
            var coord = this._map.getRandomPoint(Common.Layer.Unit);
            this._map.getCell(coord).object = unit;
            this._units.push(unit);
        }

        private removeUnit(unit: Unit) {
            this._map.deleteObject(unit);
            for (var i = 0; i < this._units.length; i++) {
                if (this._units[i] === unit) {
                    this._units.splice(i, 1);
                }
            }
        }

        get units(): Common.Unit[]{
            return this._units;
        }

        get player(): Common.Player {
            return this._player;
        }

        getMap(layer: Common.Layer): Common.DungeonObjectType[][]{
            return this._map.getTable(layer);
        }

        next() : Common.Unit {
            // フェーズが終わった
            if (this.queue.length == 0) {
                for (var i = 0; i < this._units.length; i++) {
                    this.queue.push(this._units[i]);
                }
            }
            var unit = this.queue.shift();
            return unit;
        }

        phase(unit: Common.Unit, input: Common.Action = null): { [id: number]: Common.Action } {
            var _unit = <Unit>unit;
            var _input = <Action>input;
            var action = _unit.phase(_input);
            var result = this.process(_unit, action);

            if (result == null) {
                return null;
            } else {
                this.queue.shift();
                return result;
            }
        }

        private process(unit: Unit, action: Action): { [id: number]: Action } {
            if (action == null) {
                return null;
            }
            var result: { [id: number]: Action } = {};
            if (action.type == Common.ActionType.Move) {
                var ret = this._map.moveObject(unit, ROT.DIRS[8][action.dir]); 
                if (ret) {
                    result[unit.id] = action;
                } else {
                    return null;
                }
            }
            return result;
        }
    }

    class Item extends DungeonObject implements Common.Item {
        name = null;
        num = 1;
    }

    class Unit extends DungeonObject implements Common.Unit {
        private static currentId = 1;

        id;
        name = null;
        lv = 1;
        exp = 0;
        dir = 0;
        speed = Common.SPEED[1];
        state = Common.DungeonUnitState.Normal;

        get maxHp() {
            return this.lv * 10 + 100;
        }
        get atk() {
            return this.lv * 10;
        }
        get def() {
            return this.lv * 10;
        }

        hp = this.maxHp;

        public phase(input:Action): Action {
            // 1フェーズごとに呼ばれる
            return null;
        }

        constructor() {
            super();
            this.id = Unit.currentId;
            Unit.currentId++;
        }
    }

    class Player extends Unit implements Common.Player {
        type = Common.DungeonObjectType.Player;
        id = Common.PLAYER_ID;
        stomach = this.maxStomach;
        inventory = [];
        currentExp = 0;
        maxStomach = 100;

        public phase(input:Action): Action {
            return input;
        }
    }

    class Enemy extends Unit {
        type = Common.DungeonObjectType.Enemy;

        public phase(input: Action): Action {
            return null;
        }
    }

    class Wall extends DungeonObject {
        type = Common.DungeonObjectType.Wall;
    }

    class Room extends DungeonObject {
        type = Common.DungeonObjectType.Room;
    }

    class Path extends DungeonObject {
        type = Common.DungeonObjectType.Path;
    }


    class Cell {
        private _object: DungeonObject;
        private _coord: Common.Coord;

        constructor(coord: Common.Coord) {
            this._coord = coord;
        }

        set object(obj: DungeonObject) {
            this._object = obj;
            if (obj == null) {
                this._object = null;
            } else {
                this._object.coord = this._coord;
            }
        }

        get object() {
            return this._object;
        }

        get coord() {
            return this._coord;
        }
    }
    
    class Map {
        private static WALL_HEIGHT = 3;

        private width: number;
        private height: number;
        private map: Array<Cell>;

        public constructor(w:number, h:number) {
            this.width = w;
            this.height = h;
            this.map = [];
            // Generate Map
            var t = this;
            var rotMap = new ROT.Map.DividedMaze(w, h);
            var mapCallback = function (x, y, value) {
                for (var layer in Common.Layer) {
                    var index = layer * w * h + y * w + x;
                    var coord = new Common.Coord(x, y, layer, index);
                    var cell = new Cell(coord);
                    t.map[index] = cell;
                    if (layer == Common.Layer.Floor) {
                        cell.object = new Path();
                    } else if (layer < Map.WALL_HEIGHT && value) {
                        cell.object = new Wall();
                    }
                }
            }
            rotMap.create(mapCallback);

            // 通路と部屋を分ける
            if (typeof rotMap.getRooms !== "undefined") {
                for (var i = this.getStartIndex(Common.Layer.Floor); i < this.getLastIndex(Common.Layer.Floor); i++) {
                    var m = this.map[i];
                    for (var j = 0; j < rotMap.getRooms().length; j++) {
                        var room = rotMap.getRooms()[j];
                        if (room.getLeft() <= m.coord.x && m.coord.x <= room.getRight() && room.getTop() <= m.coord.y && m.coord.y <= room.getBottom()) {
                            m.object = new Room();
                            break;
                        }
                    }
                }
            }
        }

        // あるレイヤのインデックスを取得
        private getIndex(x: number, y: number, layer: Common.Layer):number {
            return layer * this.width * this.height + y * this.width + x;
        }

        // あるレイヤの最初のインデックスを取得
        private getStartIndex(layer: Common.Layer):number {
            return this.getIndex(0, 0, layer);
        }


        // あるレイヤの最後のインデックスを取得
        private getLastIndex(layer: Common.Layer):number {
            return this.getIndex(this.width - 1, this.height - 1, Common.Layer.Floor)
        }

            // セルを取得
        public getCell(coord: Common.Coord):Cell {
                return this.map[this.getIndex(coord.x, coord.y, coord.layer)];
        }

        // 移動できるかどうか
        public isMovable(obj: DungeonObject, dir: number[], coord: Common.Coord = obj.coord): boolean {
            var newCell = this.map[this.getIndex(coord.x + dir[0], coord.y + dir[1], coord.layer)];

            if (dir[0] == 0 || dir[1] == 0) {
                if (newCell.object == null || newCell.object == obj)
                    return true;
            } else {
                var cornerCell1 = this.map[this.getIndex(coord.x + dir[0], coord.y, coord.layer)];
                var cornerCell2 = this.map[this.getIndex(coord.x, coord.y + dir[1], coord.layer)];
                if ((newCell.object == null || newCell.object == obj)
                    && (cornerCell1.object == null || cornerCell1.object.corner == false)
                    && (cornerCell2.object == null || cornerCell2.object.corner == false)) {
                    return true;
                }
            }
            return false;
        }

        // 移動可能な近隣の方向を取得
        public getMovableDirs(obj: DungeonObject):Array<Array<number>> {
            var result:Array<Array<number>> = [];
            for (var i = 0; i < ROT.DIRS[8].length; i++) {
                var dir: Array<number> = ROT.DIRS[8][i];
                if (this.isMovable(obj, dir))
                    result.push(dir);
            }
            return result;
        }

        // すでに存在するオブジェクトを移動する。成功したらTrue
        public moveObject(obj: DungeonObject, dir:number[]):boolean {
            var coord = obj.coord;
            var oldIndex = this.getIndex(coord.x, coord.y, coord.layer);
            var newIndex = this.getIndex(coord.x + dir[0], coord.y + dir[1], coord.layer);
            var oldCell = this.map[oldIndex];
            var newCell = this.map[newIndex];
            if (newCell.object == null) {
                oldCell.object = null;
                newCell.object = obj;
                return true;
            }
            return false;
        }

        // すでに存在するオブジェクトを削除する。成功したらTrue
        public deleteObject(obj: DungeonObject):boolean {
            var coord = obj.coord;
            if (obj.coord != null) {
                var cell = this.map[this.getIndex(coord.x, coord.y, coord.layer)];
                cell.object = null;
                return true;
            }
            return false;
        }

        // あるレイヤのランダムな場所を取得
        public getRandomPoint(layer: number): Common.Coord {
            var currentFreeCells:Array<Cell> = [];
            for (var i = 0; i < this.map.length; i++) {
                var cell:Cell = this.map[i];
                if (cell.coord.layer == layer) {
                    if (cell.object == null) {
                        currentFreeCells.push(cell);
                    }
                }
            }
            var index = Math.floor(ROT.RNG.getUniform() * currentFreeCells.length);
            return currentFreeCells[index].coord;
        }

        // あるレイヤのマップテーブルを取得
        public getTable(layer: Common.Layer): Common.DungeonObjectType[][] {
            var table: Common.DungeonObjectType[][] = new Array(this.height);
            for (var y = 0; y < this.height; y++) {
                table[y] = new Array(this.width);
                for (var x = 0; x < this.width; x++) {
                    var m = this.map[this.getIndex(x, y, layer)];
                    table[y][x] = m.object == null ? Common.DungeonObjectType.Null : m.object.type;
                }
            }
            return table;
        }
    }
}