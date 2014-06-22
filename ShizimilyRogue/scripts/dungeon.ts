﻿

module ShizimilyRogue.Model {

    export enum TargetType {
        Me, To, Line, Area
    }
    export enum ItemEffectType {
        StatusChange, CoordChange, 
    }

    export interface IItemData {
        itemId: number;
        name: string;
        num: number;
        targetType: TargetType;
        use: (unit: Common.IObject[]) => Common.Action[];
    }

    export interface IEnemyData {
        unitId: number;
        name: string;
        speed: Common.Speed;
        maxHp: number;
        atk: number;
        def: number;
        exp: number;
        drop: Common.IItem;
        dropProbability: number;
        awakeProbabilityWhenAppear: number;
        awakeProbabilityWhenEnterRoom: number;
        awakeProbabilityWhenNeighbor: number;
        phase(fov: Common.IFOVData): Common.Action;
        event(results: Common.Action[]): void;
    }

    class DungeonObject implements Common.IObject {
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
        private _current: Unit;
        private _units: Unit[] = [];
        private _items: Item[] = [];
        private _width;
        private _height;
        private _player: Player;
        private map: Map;
        private scheduler: ROT.Scheduler.Speed = new ROT.Scheduler.Speed();

        constructor(w: number, h: number) {
            this._width = w;
            this._height = h;
            this.map = new Map(w, h);

            // Playerを配置
            this._player = new Player("しじみりちゃん");
            this.addUnit(this._player);

            // 敵を配置
            this.addEnemy(new Model.Data.Ignore);

            // アイテムを配置
            this.addItem(new Model.Data.Sweet);

            // 一番最初のターンはプレイヤー
            this._current = this.scheduler.next();
        }

        private addEnemy(data: IEnemyData): Common.IUnit {
            var enemy = new Enemy(data);
            this.addUnit(enemy);
            return enemy;
        }

        private addUnit(unit: Unit) {
            var coord = this.map.getRandomPoint(Common.Layer.Unit);
            this.map.setObject(unit, coord);
            this._units.push(unit);
            this.scheduler.add(unit, true);
        }

        private addItem(data: IItemData) {
            var item = new Item(data);
            var coord = this.map.getRandomPoint(Common.Layer.Ground);
            this.map.setObject(item, coord);
            this._items.push(item);
        }

        private removeUnit(unit: Unit) {
            this.map.deleteObject(unit);
            this._units = this._units.filter(v => v.id != unit.id);
            this.scheduler.remove(unit);
        }

        public get width(): number {
            return this._width;
        }

        public get height(): number {
            return this._height;
        }

        public get units(): Common.IUnit[] {
            return this._units;
        }

        public get items(): Common.IItem[]{
            return this._items;
        }

        public get current(): Common.IUnit {
            return this._current;
        }

        public get player(): Common.IPlayer {
            return this._player;
        }

        public getMap(): (x: number, y: number, layer: Common.Layer) => Common.IObject {
            return this.map.getTable();
        }

        public getFOV(): Common.IFOVData {
            return this.map.getFOV(this._current);
        }

        public next(input: Common.Action): Common.Action[] {
            var allResults: Common.Action[] = [];
            var action = input;
            while (action != null) {
                var r = this.process(this._current, action);
                allResults = allResults.concat(r);

                // ユニットの行動後の視界を取得
                var afterFov = this.map.getFOV(this._current);

                // 視界範囲内のユニットに情報伝達
                afterFov.units.forEach(unit => {
                    unit.event(r);
                });

                // 次に行動するユニットのアクションを取り出す
                this._current = this.scheduler.next();
                var beforeFov = this.map.getFOV(this._current);
                action = this._current.phase(beforeFov);
            }
            return allResults;
        }

        private process(unit: Unit, action: Common.Action): Common.Action[] {
            var results: Common.Action[] = [];
            if (action.type == Common.ActionType.Move) {
                var ret = this.map.moveObject(unit, action.dir);
                if (ret) {
                    // 移動成功
                    unit.dir = action.dir;
                    results.push(action);
                }
            } else if (action.type == Common.ActionType.Attack) {
                var x = unit.coord.x + ROT.DIRS[8][action.dir][0];
                var y = unit.coord.y + ROT.DIRS[8][action.dir][1];
                var target = this.getMap()(x, y, Common.Layer.Unit);
                results.push(action);
                if (target.type == Common.DungeonObjectType.Unit) {
                    // 攻撃対象がいた
                    unit.dir = (action.dir + 4) % 8;
                    var damageAction = new Common.Action(target, Common.ActionType.HpChange, unit.dir);
                    damageAction.amount = Math.floor(ROT.RNG.getUniform() * 100);
                    results.push(damageAction);
                }
            }
            return results;
        }
    }

    class Item extends DungeonObject implements Common.IItem {
        type = Common.DungeonObjectType.Item;
        name: string;
        num: number;
        itemId: number;
        targetType: TargetType;
        use: (unit: Common.IObject[]) => Common.Action[];

        constructor(data: IItemData) {
            super();
            this.name = data.name;
            this.num = data.num;
            this.itemId = data.itemId;
            this.use = data.use;
            this.targetType = data.targetType;
        }
    }

    interface DungeonUnit extends Common.IUnit {
        hp: number;
        maxHp: number;
        atk: number;
        def: number;
    }

    class FOVData implements Common.IFOVData {
        getObjectFunction: (place: number[], layer: Common.Layer) => Common.IObject;
        area: number[][] = [];
        movable: boolean[] = [];
        getObject(place: number[], layer: Common.Layer): Common.IObject {
            return this.getObjectFunction(place, layer);
        }
        units: Unit[] = [];
        attackable: { [id: number]: boolean } = {};
        me: Unit;
    }

    class Unit extends DungeonObject implements DungeonUnit {
        type = Common.DungeonObjectType.Unit;
        hp: number;

        dir = 0;
        state = Common.DungeonUnitState.Normal;

        getSpeed() {
            return this.speed;
        }

        phase: (fov: Common.IFOVData) => Common.Action;
        event: (results: Common.Action[]) => void;

        constructor(
            public unitId: number,
            public name: string,
            public speed: Common.Speed,
            public maxHp: number,
            public atk: number,
            public def: number) {
            super();
            this.hp = maxHp;
        }
    }

    class Player extends Unit implements Common.IPlayer {
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

        phase = (fov: Common.IFOVData) => {
            return null;
        }

        event = (results: Common.Action[]) => {
        }

        constructor(name: string) {
            super(Common.PLAYER_ID, name, Common.Speed.NORMAL, null, null, null);
        }
    }

    class Enemy extends Unit {
        exp: number;
        drop: Item;
        dropProbability: number;
        awakeProbabilityWhenAppear: number;
        awakeProbabilityWhenEnterRoom: number;
        awakeProbabilityWhenNeighbor: number;

        phase: (fov: Common.IFOVData) => Common.Action;
        event: (results: Common.Action[]) => void;

        constructor(data: IEnemyData) {
            super(data.unitId, data.name, data.speed, data.maxHp, data.atk, data.def);
            this.exp = data.exp;
            this.drop = <Item>data.drop;
            this.dropProbability = data.dropProbability;
            this.awakeProbabilityWhenAppear = data.awakeProbabilityWhenAppear;
            this.awakeProbabilityWhenEnterRoom = data.awakeProbabilityWhenEnterRoom;
            this.awakeProbabilityWhenNeighbor = data.awakeProbabilityWhenNeighbor;
            this.phase = data.phase;
            this.event = data.event;
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

    class Null extends DungeonObject {
        type = Common.DungeonObjectType.Null;
        id = -1;
    }

    class Cell {
        private _object: DungeonObject;
        private _coord: Common.Coord;

        constructor(coord: Common.Coord) {
            this._coord = coord;
        }

        set object(obj: DungeonObject) {
            this._object = obj;
            this._object.coord = this._coord;
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
        private map: Cell[][][];

        public constructor(w: number, h: number) {
            this.width = w;
            this.height = h;
            this.map = new Array<Cell[][]>(h);
            for (var y = 0; y < h; y++) {
                this.map[y] = new Array<Cell[]>(w);
                for (var x = 0; x < w; x++) {
                    this.map[y][x] = new Array<Cell>(Common.Layer.MAX);
                }
            }

            // Generate Map
            var rotMap = new ROT.Map.Digger(w, h);
            rotMap.create((x, y, value) => {
                for (var layer = 0; layer < Common.Layer.MAX; layer++) {
                    var coord = new Common.Coord(x, y, layer);
                    var cell = new Cell(coord);
                    this.map[y][x][layer] = cell;
                    if (layer == Common.Layer.Floor) {
                        if (value) {
                            cell.object = new Wall();
                        } else {
                            cell.object = new Path();
                        }
                    } else {
                        cell.object = new Null();
                    }
                }
            });

            // 通路と部屋を分ける
            if (typeof rotMap.getRooms !== "undefined") {
                rotMap.getRooms().forEach(room => {
                    for (var x = room.getLeft(); x <= room.getRight(); x++) {
                        for (var y = room.getTop(); y <= room.getBottom(); y++) {
                            this.map[y][x][Common.Layer.Floor].object = new Room();
                        }
                    }
                });
            }
        }

        // Field of viewを取得
        public getFOV(unit: Unit): FOVData {
            var lightPasses = (x, y) => {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    return false;
                }
                var cell = this.map[y][x][Common.Layer.Floor];
                if (cell.object.type == Common.DungeonObjectType.Room) {
                    return true;
                }
                return false;
            }

            var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
            var coord = unit.coord;
            var coords: Common.Coord[] = [];
            var result: FOVData = new FOVData();
            fov.compute(coord.x, coord.y, 10, (x, y, r, visibility) => {
                result.area.push([x, y]);
            });
            result.getObjectFunction = (place, layer) => {
                return this.map[place[1]][place[0]][layer].object;
            };
            if (result.area.length == 1) {
                result.area.push([coord.x + 1, coord.y - 1]);
                result.area.push([coord.x + 1, coord.y]);
                result.area.push([coord.x + 1, coord.y + 1]);
                result.area.push([coord.x, coord.y - 1]);
                result.area.push([coord.x, coord.y + 1]);
                result.area.push([coord.x - 1, coord.y - 1]);
                result.area.push([coord.x - 1, coord.y]);
                result.area.push([coord.x - 1, coord.y + 1]);
            }

            result.area.forEach(area => {
                var x = area[0];
                var y = area[1];
                for (var layer = 0; layer < Common.Layer.MAX; layer++) {
                    var obj = this.map[y][x][layer].object;
                    if (obj instanceof Unit && obj.id != unit.id) {
                        result.units.push(<Unit>obj);
                        result.attackable[obj.id] = this.isAttackable(unit, obj);
                    }
                }
            });

            result.movable = [];
            for (var dir = 0; dir < ROT.DIRS[8].length; dir++) {
                var movable = this.isMovable(unit, dir);
                result.movable.push(movable);
            }

            result.me = unit;
            return result;
        }

        // 攻撃できるかどうか
        private isAttackable(obj: DungeonObject, target: DungeonObject): boolean {
            var dirX: number = target.coord.x - obj.coord.x;
            var dirY: number = target.coord.y - obj.coord.y;

            if (Math.abs(dirX) > 1 || Math.abs(dirY) > 1) {
                return false;
            }

            var coord = obj.coord;
            var newCell = this.map[coord.y + dirY][coord.x + dirX][coord.layer];
            var floorCell = this.map[coord.y + dirY][coord.x + dirX][Common.Layer.Floor];

            if (floorCell.object.type != Common.DungeonObjectType.Wall) {
                if (dirX == 0 || dirY == 0) {
                    return true;
                } else {
                    var cornerCell1 = this.map[coord.y][coord.x + dirX][Common.Layer.Floor];
                    var cornerCell2 = this.map[coord.y + dirY][coord.x][Common.Layer.Floor];
                    if (cornerCell1.object.corner == false && cornerCell2.object.corner == false) {
                        return true;
                    }
                }
            }
            return false;
        }

        // 移動できるかどうか
        private isMovable(obj: DungeonObject, dir: number): boolean {
            var dirX = ROT.DIRS[8][dir][0];
            var dirY = ROT.DIRS[8][dir][1];
            var coord = obj.coord;
            var newCell = this.map[coord.y + dirY][coord.x + dirX][coord.layer];
            var floorCell = this.map[coord.y + dirY][coord.x + dirX][Common.Layer.Floor];

            if (newCell.object.type == Common.DungeonObjectType.Null && floorCell.object.type != Common.DungeonObjectType.Wall) {
                if (dirX == 0 || dirY == 0) {
                    return true;
                } else {
                    var cornerCell1 = this.map[coord.y][coord.x + dirX][Common.Layer.Floor];
                    var cornerCell2 = this.map[coord.y + dirY][coord.x][Common.Layer.Floor];
                    if (cornerCell1.object.corner == false && cornerCell2.object.corner == false) {
                        return true;
                    }
                }
            }
            return false;
        }

        // すでに存在するオブジェクトを移動する。成功したらTrue
        public moveObject(obj: DungeonObject, dir: number): boolean {
            if (this.isMovable(obj, dir)) {
                var coord = obj.coord;
                var oldCell = this.map[coord.y][coord.x][coord.layer];
                var newCell = this.map[coord.y + ROT.DIRS[8][dir][1]][coord.x + ROT.DIRS[8][dir][0]][coord.layer];
                oldCell.object = new Null();
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
                var cell = this.map[coord.y][coord.x][coord.layer];
                cell.object = new Null();
                return true;
            }
            return false;
        }

        // オブジェクトの追加
        public setObject(obj: DungeonObject, coord: Common.Coord, force: boolean = true): boolean {
            var cell = this.map[coord.y][coord.x][coord.layer];
            if (cell.object.type == Common.DungeonObjectType.Null) {
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
            var currentFreeCells: Array<Cell> = [];
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var cell: Cell = this.map[y][x][layer];
                    var floorCell: Cell = this.map[y][x][Common.Layer.Floor];
                    if (cell.object.type == Common.DungeonObjectType.Null && floorCell.object.type == Common.DungeonObjectType.Room) {
                        currentFreeCells.push(cell);
                    }
                }
            }
            var index = Math.floor(ROT.RNG.getUniform() * currentFreeCells.length);
            return currentFreeCells[index].coord;
        }

        // あるレイヤの[オブジェクトタイプ,オブジェクトID]を取得
        public getTable(): (x: number, y: number, layer: Common.Layer) => Common.IObject {
            return (x: number, y: number, layer: Common.Layer) => {
                return this.map[y][x][layer].object;
            };
        }
    }
}