

module ShizimilyRogue.Model {

    class DungeonObject {
        private static currentId = 1;

        coord: Common.Coord = null;
        corner: boolean = false;
        type: Common.DungeonObjectType = null;
        id;

        constructor() {
            this.id = DungeonObject.currentId;
            DungeonObject.currentId++;
        }
    }


    export class DungeonManager {
        private _units: { [id: number]: Unit; } = {};
        private _player: Player;
        private _map: Map;
        private _current: Unit;
        private scheduler: ROT.Scheduler.Speed = new ROT.Scheduler.Speed();
        private inputRequired: boolean = false;

        constructor(w: number, h: number) {
            this._map = new Map(w, h);

            // Playerを配置
            this._player = new Player("しじみりちゃん");
            this.addUnit(this._player);

            // 一番最初のターンはプレイヤー
            this._current = this.scheduler.next();
        }

        addEnemy(data: Common.IEnemyData): Common.IUnit {
            var enemy = new Enemy(data);
            this.addUnit(enemy);
            return enemy;
        }

        private addUnit(unit: Unit) {
            var coord = this._map.getRandomPoint(Common.Layer.Unit);
            this._map.setObject(unit, coord);
            this._units[unit.id] = unit;
            this.scheduler.add(unit, true);
        }

        private removeUnit(unit: Unit) {
            this._map.deleteObject(unit);
            delete this._units[unit.id];
            this.scheduler.remove(unit);
        }

        get units(): { [id: number]: Common.IUnit; } {
            return this._units;
        }

        get player(): Common.IPlayer {
            return this._player;
        }

        get current(): Common.IUnit {
            return this._current;
        }

        getMap(layer: Common.Layer): Common.DungeonObjectType[][]{
            return this._map.getTable(layer);
        }

        next(input: Common.Action): Common.Result[]{
            var results: Common.Result[] = [];
            var action = input;
            while (action != null) {
                this.process(this._current, action, results);
                this._current = this.scheduler.next();
                action = this._current.phase();
            }
            return results;
        }

        private process(unit: Unit, action: Common.Action, results: Common.Result[]) {
            if (action.type == Common.ActionType.Move) {
                var ret = this._map.moveObject(unit, ROT.DIRS[8][action.dir]); 
                if (ret) {
                    var result = Common.Result.fromAction(unit.id, action);
                    results.push(result);
                }
            }
        }
    }

    class Item extends DungeonObject implements Common.IItem {
        name;
        num;
    }

    interface DungeonUnit extends Common.IUnit {
        hp: number;
        maxHp: number;
        atk: number;
        def: number;
    }

    class Unit extends DungeonObject implements DungeonUnit {
        name: string;

        hp: number;
        maxHp: number;
        atk: number;
        def: number;
        speed: Common.Speed;

        dir = 0;
        state = Common.DungeonUnitState.Normal;

        getSpeed() {
            return this.speed;
        }

        phase(): Common.Action {
            throw new Error("Action not implemented");
        }

        constructor(name: string, speed: Common.Speed, maxHp: number, atk: number, def: number) {
            super();
            this.name = name;
            this.speed = speed;
            this.hp = maxHp;
            this.maxHp = maxHp;
            this.atk = atk;
            this.def = def;
        }
    }

    class Player extends Unit implements Common.IPlayer {
        type = Common.DungeonObjectType.Player;
        lv = 1;
        id = Common.PLAYER_ID;
        inventory = [];
        currentExp = 0;
        maxStomach = 100;
        stomach = this.maxStomach;

        get maxHp(): number {
            return this.lv * 10 + 100;
        }
        get atk(): number {
            return this.lv * 10 + 100;
        }
        get def(): number {
            return this.lv * 10 + 100;
        }

        public phase(): Common.Action {
            return null;
        }

        constructor(name: string) {
            super(name, Common.Speed.NORMAL, null, null, null);
        }
    }

    class Enemy extends Unit implements Common.IEnemyData {
        type = Common.DungeonObjectType.Enemy;
        exp: number;
        drop: Item;
        dropProbability: number;
        awakeProbabilityWhenAppear: number;
        awakeProbabilityWhenEnterRoom: number;
        awakeProbabilityWhenNeighbor: number;

        public phase(): Common.Action {
            var dir = Math.floor(ROT.RNG.getUniform() * 8);
            return new Common.MoveAction(dir);
        }

        constructor(data: Common.IEnemyData) {
            super(data.name, data.speed, data.maxHp, data.atk, data.def);
            this.exp = data.exp;
            this.drop = <Item>data.drop;
            this.dropProbability = data.dropProbability;
            this.awakeProbabilityWhenAppear = data.awakeProbabilityWhenAppear;
            this.awakeProbabilityWhenEnterRoom = data.awakeProbabilityWhenEnterRoom;
            this.awakeProbabilityWhenNeighbor = data.awakeProbabilityWhenNeighbor;
        }
    }

    class Wall extends DungeonObject {
        type = Common.DungeonObjectType.Wall;
        corner = true;
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
            var rotMap = new ROT.Map.DividedMaze(w, h);
            var mapCallback = (x, y, value) => {
                for (var layer in Common.Layer) {
                    var index = layer * w * h + y * w + x;
                    var coord = new Common.Coord(x, y, layer, index);
                    var cell = new Cell(coord);
                    this.map[index] = cell;
                    if (layer < Map.WALL_HEIGHT && value) {
                        cell.object = new Wall();
                    } else if (layer == Common.Layer.Floor) {
                        cell.object = new Path();
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

        private getView(unit: Unit): Array<Cell> {
            /* input callback */
            var lightPasses = (x, y) => {
                var cell = this.map[this.getIndex(x, y, Common.Layer.Floor)];
                if (cell.object.type == Common.DungeonObjectType.Room) {
                    return true;
                }
                return false;
            }

            var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
            var coord = unit.coord;
            var units: Unit[] = [];
            fov.compute(coord.x, coord.y, 10, (x, y, r, visibility) => {
//                this.map
//                var color = (data[x + "," + y] ? "#aa0" : "#660");
            });
            return null;
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
        private getCell(x, y, layer):Cell {
                return this.map[this.getIndex(x, y, layer)];
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
        public moveObject(obj: DungeonObject, dir: number[]): boolean {
            if (this.isMovable(obj, dir)) {
                var coord = obj.coord;
                var oldIndex = this.getIndex(coord.x, coord.y, coord.layer);
                var newIndex = this.getIndex(coord.x + dir[0], coord.y + dir[1], coord.layer);
                var oldCell = this.map[oldIndex];
                var newCell = this.map[newIndex];
                oldCell.object = null;
                newCell.object = obj;
                return true;
            } else {
                return false;
            }
        }

        // すでに存在するオブジェクトを削除する。成功したらTrue
        public deleteObject(obj: DungeonObject): boolean {
            var coord = obj.coord;
            if (obj.coord != null) {
                var cell = this.map[this.getIndex(coord.x, coord.y, coord.layer)];
                cell.object = null;
                return true;
            }
            return false;
        }

        // オブジェクトの追加
        public setObject(obj: DungeonObject, coord: Common.Coord, force: boolean = true): boolean {
            var cell = this.map[this.getIndex(coord.x, coord.y, coord.layer)];
            if (cell.object != null) {
                if (force) {
                    this.deleteObject(cell.object);
                } else {
                    return false;
                }
            }
            cell.object = obj;
            return true;
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