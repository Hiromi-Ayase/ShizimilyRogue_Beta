

module ShizimilyRogue.Model {

    export interface IItemData {
        name: string;
        category: number;
        num: number;
        commands: Common.ActionType[];
        use: (unit: Common.IObject, command: number, items: Common.IItem[]) => Common.Action;
    }

    export interface IUnitData {
        name: string;
        category: number;
        dir: Common.DIR;
        state: Common.DungeonUnitState;
        hp: number;
        lv: number;
        speed: Common.Speed;
        maxHp: number;
        atk: number;
        def: number;
        turn: number;
        inventory: Common.IItem[];
        phase(fov: Common.IFOVData): Common.Action;
        event(result: Common.IResult, fov: Common.IFOVData): Common.Action;
    }

    export interface IEnemyData extends IUnitData{
        exp: number;
        dropProbability: number;
        awakeProbabilityWhenAppear: number;
        awakeProbabilityWhenEnterRoom: number;
        awakeProbabilityWhenNeighbor: number;
    }

    export interface IPlayerData extends IUnitData {
        currentExp: number;
        stomach: number;
        maxStomach: number;
    }

    export class Result implements Common.IResult {
        constructor(
            public object: Common.IObject,
            public action: Common.Action,
            public targets: Common.IObject[]) {
        }
        static getInstance(
            object: Common.IObject,
            type: Common.ActionType,
            targets: Common.IObject[],
            params?: number[],
            objects?: Common.IObject[]): Result {
            var action = new Common.Action(type, params, objects);
            return new Result(object, action, targets);
        }
    }

    class DungeonObject implements Common.IObject {
        private static currentId = 1;

        category = 0;
        coord: Common.Coord = null;
        corner: boolean = false;
        type: Common.DungeonObjectType = null;
        id: number;
        layer: Common.Layer = null;

        event(result: Common.IResult, fov: Common.IFOVData): Common.Action {
            return null;
        }

        constructor() {
            this.id = DungeonObject.currentId;
            DungeonObject.currentId++;
        }
    }

    export class DungeonManager {
        private _current: Unit;
        private _objects: Common.IObject[] = [];
        private _width;
        private _height;
        private _player: Player;
        private map: Map;
        private scheduler: ROT.Scheduler.Speed = new ROT.Scheduler.Speed();
        private _endState: Common.EndState = Common.EndState.None;

        constructor(w: number, h: number) {
            this._width = w;
            this._height = h;
            this.map = new Map(w, h);

            // Playerを配置
            this._player = new Player(new Model.Data.PlayerData("しじみりちゃん"));
            this.addObject(this._player, Common.Layer.Unit);

            // 敵を配置
            this.addEnemy(new Model.Data.Ignore);
            this.addEnemy(new Model.Data.Ignore);
            this.addEnemy(new Model.Data.Ignore);
            this.addEnemy(new Model.Data.Ignore);

            // アイテムを配置
            this.addItem(new Model.Data.Sweet);
            this.addItem(new Model.Data.Sweet);
            this.addItem(new Model.Data.Sweet);
            this.addItem(new Model.Data.Sweet);
            this.addItem(new Model.Data.Sweet);

            // 一番最初のターンはプレイヤー
            this._current = this.scheduler.next();
        }

        public addEnemy(data: IEnemyData): Common.IUnit {
            var enemy = new Enemy(data);
            this.addObject(enemy, Common.Layer.Unit);
            return enemy;
        }

        public addItem(data: IItemData): Common.IItem {
            var item = new Item(data);
            var coord = this.map.getRandomPoint(Common.Layer.Ground);
            this.map.setObject(item, coord);
            this._objects.push(item);
            return item;
        }

        public addObject(obj: Common.IObject, layer: Common.Layer): void {
            var coord = this.map.getRandomPoint(layer);
            this.map.setObject(obj, coord);
            this._objects.push(obj);
            if (obj.type == Common.DungeonObjectType.Unit)
                this.scheduler.add(obj, true);
        }

        public removeObject(obj: Common.IObject) {
            this.map.deleteObject(obj);
            this._objects = this._objects.filter(v => v.id != obj.id);
            if (obj.type == Common.DungeonObjectType.Unit)
                this.scheduler.remove(obj);
        }

        public moveObject(obj: Common.IObject, dir: number): boolean {
            return this.map.moveObject(obj, dir);
        }

        public get endState(): number {
            return this._endState;
        }

        public get width(): number {
            return this._width;
        }

        public get height(): number {
            return this._height;
        }

        public get objects(): Common.IObject[] {
            return this._objects;
        }

        public get current(): Common.IUnit {
            return this._current;
        }

        public get player(): Common.IPlayer {
            return this._player;
        }

        public getMap(): (x: number, y: number) => Common.IObject[] {
            return (x: number, y: number) => this.map.getTable(x, y);
        }

        public getFOV(): Common.IFOVData {
            return this.map.getFOV(this._current);
        }

        public next(input: Common.Action): Common.IResult[] {
            var allResults: Common.IResult[] = [];
            var action = input;
            while (action != null) {
                // 行動
                this._endState = this.update(this._current, action, allResults);
                if (this._endState != Common.EndState.None) {
                    // ゲームが終わった
                    return allResults;
                }

                // 次に行動するユニットのアクションを取り出す
                this._current = this.scheduler.next();
                var fov = this.map.getFOV(this._current);
                action = this._current.phase(fov);
            }
            return allResults;
        }

        private update(object: Common.IObject, action: Common.Action, results: Common.IResult[]): Common.EndState {
            var result = Process.process(this, object, action);
            if (action.end != Common.EndState.None)
                return action.end;
            if (result != null) {
                results.push(result);
                for (var i = 0; i < result.targets.length; i++) {
                    var target = result.targets[i];
                    var fov = this.map.getFOV(target);
                    var newAction = (<DungeonObject>target).event(result, fov);
                    if (newAction != null) {
                        var endState = this.update(target, newAction, results)
                        if (endState != Common.EndState.None)
                            return endState;
                    }
                }
            }
            return Common.EndState.None;
        }
    }

    class Item extends DungeonObject implements Common.IItem {
        layer = Common.Layer.Ground;
        type = Common.DungeonObjectType.Item;
        name: string;
        num: number;
        commands: Common.ActionType[];
        use: (unit: Common.IObject, command: number, items: Common.IItem[]) => Common.Action;

        constructor(data: IItemData) {
            super();
            this.name = data.name;
            this.num = data.num;
            this.use = data.use;
            this.category = data.category;
            this.commands = data.commands;
        }
    }

    class FOVData implements Common.IFOVData {
        getObjectFunction: (coord: Common.Coord) => Common.IObject[];
        area: Common.Coord[] = [];
        movable: boolean[] = [];
        getObject(coord: Common.Coord): Common.IObject[] {
            return this.getObjectFunction(coord);
        }
        objects: Common.IObject[] = [];
        attackable: { [id: number]: boolean } = {};
        me: Common.IObject;
    }

    class Unit extends DungeonObject implements Common.IUnit {
        layer = Common.Layer.Unit;
        type = Common.DungeonObjectType.Unit;

        getSpeed() {
            return this.data.speed;
        }

        public get atk() { return this.data.atk; }
        public get def() { return this.data.def; }
        public get lv() { return this.data.lv; }
        public get hp() { return this.data.hp; }
        public get maxHp() { return this.data.maxHp; }
        public get turn() { return this.data.turn; }
        public get dir() { return this.data.dir; }
        public get inventory() { return this.data.inventory; }
        public get state() { return this.data.state; }
        public get name() { return this.data.name; }

        phase(fov: Common.IFOVData): Common.Action { return this.data.phase(fov); }
        event(result: Common.IResult, fov: Common.IFOVData): Common.Action { return this.data.event(result, fov); }

        constructor(private data: IUnitData) {
            super();
        }
    }

    class Player extends Unit implements Common.IPlayer {
        id = Common.PLAYER_ID;

        public get currentExp() { return this.playerData.currentExp; }
        public get maxStomach() { return this.playerData.maxStomach; }
        public get stomach() { return this.playerData.stomach; }
        public setDir(dir: number) { this.playerData.dir = dir; }
        constructor(private playerData: IPlayerData) {
            super(playerData);
        }
    }

    class Enemy extends Unit {
        public get exp() { return this.enemyData.exp; }
        public get dropProbability() { return this.enemyData.dropProbability; }
        public get awakeProbabilityWhenAppear() { return this.enemyData.awakeProbabilityWhenAppear; }
        public get awakeProbabilityWhenEnterRoom() { return this.enemyData.awakeProbabilityWhenEnterRoom; }
        public get awakeProbabilityWhenNeighbor() { return this.enemyData.awakeProbabilityWhenNeighbor; }


        constructor(private enemyData: IEnemyData) {
            super(enemyData);
        }
    }

    class Wall extends DungeonObject {
        type = Common.DungeonObjectType.Wall;
        layer = Common.Layer.Ground;
        corner = true;
    }

    class Room extends DungeonObject {
        type = Common.DungeonObjectType.Room;
        layer = Common.Layer.Floor;
    }

    class Path extends DungeonObject {
        type = Common.DungeonObjectType.Path;
        layer = Common.Layer.Floor;
    }

    class Null extends DungeonObject {
        type = Common.DungeonObjectType.Null;
        id = -1;
    }

    class Cell {
        private _objects: Common.IObject[] = new Array<Common.IObject>(Common.Layer.MAX);
        private _coord: Common.Coord;

        constructor(coord: Common.Coord) {
            this._coord = coord;
            for (var layer = 0; layer < Common.Layer.MAX; layer++)
                this.del(layer);
        }

        del(layer: Common.Layer): void {
            this._objects[layer] = new Null();
            this._objects[layer].coord = this._coord;
        }

        set object(obj: Common.IObject) {
            this._objects[obj.layer] = obj;
            obj.coord = this._coord;
        }

        get objects() {
            return this._objects;
        }

        get coord() {
            return this._coord;
        }
    }

    class Map {
        private static WALL_HEIGHT = 3;

        private width: number;
        private height: number;
        private map: Cell[][];

        public constructor(w: number, h: number) {
            this.width = w;
            this.height = h;
            this.map = new Array<Cell[]>(h);
            for (var y = 0; y < h; y++) {
                this.map[y] = new Array<Cell>(w);
                for (var x = 0; x < w; x++) {
                    var coord = new Common.Coord(x, y);
                    this.map[y][x] = new Cell(coord);
                }
            }

            // Generate Map
            var rotMap = new ROT.Map.Digger(w, h);
            rotMap.create((x, y, value) => {
                this.map[y][x].object = value ? new Wall() : new Path();
            });

            // 通路と部屋を分ける
            if (typeof rotMap.getRooms !== "undefined") {
                rotMap.getRooms().forEach(room => {
                    for (var x = room.getLeft(); x <= room.getRight(); x++) {
                        for (var y = room.getTop(); y <= room.getBottom(); y++) {
                            this.map[y][x].object = new Room();
                        }
                    }
                });
            }
        }

        // Field of viewを取得
        public getFOV(unit: Common.IObject): FOVData {
            var lightPasses = (x, y) => {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    return false;
                }
                var cell = this.map[y][x];
                if (cell.objects[Common.Layer.Floor].type == Common.DungeonObjectType.Room) {
                    return true;
                }
                return false;
            }

            var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
            var coord = unit.coord;
            var coords: Common.Coord[] = [];
            var result: FOVData = new FOVData();
            fov.compute(coord.x, coord.y, 10, (x, y, r, visibility) => {
                result.area.push(this.map[y][x].coord);
            });
            result.getObjectFunction = (place) => {
                return this.map[place.y][place.x].objects;
            };
            if (result.area.length == 1) {
                result.area.push(this.map[coord.y + 1][coord.x - 1].coord);
                result.area.push(this.map[coord.y + 1][coord.x].coord);
                result.area.push(this.map[coord.y + 1][coord.x + 1].coord);
                result.area.push(this.map[coord.y][coord.x - 1].coord);
                result.area.push(this.map[coord.y][coord.x + 1].coord);
                result.area.push(this.map[coord.y - 1][coord.x - 1].coord);
                result.area.push(this.map[coord.y - 1][coord.x].coord);
                result.area.push(this.map[coord.y - 1][coord.x + 1].coord);
            }

            result.area.forEach(area => {
                for (var layer = Common.Layer.Ground; layer < Common.Layer.MAX; layer++) {
                    var obj = this.map[area.y][area.x].objects[layer];
                    if (obj.type != Common.DungeonObjectType.Null && obj.id != unit.id) {
                        result.objects.push(obj);
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
        private isAttackable(obj: Common.IObject, target: Common.IObject): boolean {
            var dirX: number = target.coord.x - obj.coord.x;
            var dirY: number = target.coord.y - obj.coord.y;

            if (Math.abs(dirX) > 1 || Math.abs(dirY) > 1) {
                return false;
            }

            var coord = obj.coord;
            var newCell = this.map[coord.y + dirY][coord.x + dirX];

            if (newCell.objects[Common.Layer.Ground].type != Common.DungeonObjectType.Wall) {
                if (dirX == 0 || dirY == 0) {
                    return true;
                } else {
                    var cornerCell1 = this.map[coord.y][coord.x + dirX];
                    var cornerCell2 = this.map[coord.y + dirY][coord.x];
                    if (cornerCell1.objects[Common.Layer.Ground].corner == false
                        && cornerCell2.objects[Common.Layer.Ground].corner == false) {
                            return true;
                    }
                }
            }
            return false;
        }

        // 移動できるかどうか
        public isMovable(obj: Common.IObject, dir: number): boolean {
            var dirX = ROT.DIRS[8][dir][0];
            var dirY = ROT.DIRS[8][dir][1];
            var coord = obj.coord;
            var newCell = this.map[coord.y + dirY][coord.x + dirX];

            if (newCell.objects[obj.layer].type == Common.DungeonObjectType.Null
                && newCell.objects[Common.Layer.Ground].type != Common.DungeonObjectType.Wall) {
                if (dirX == 0 || dirY == 0) {
                    return true;
                } else {
                    var cornerCell1 = this.map[coord.y][coord.x + dirX];
                    var cornerCell2 = this.map[coord.y + dirY][coord.x];
                if (cornerCell1.objects[Common.Layer.Ground].corner == false
                    && cornerCell2.objects[Common.Layer.Ground].corner == false) {
                        return true;
                    }
                }
            }
            return false;
        }

        // すでに存在するオブジェクトを移動する。成功したらTrue
        public moveObject(obj: Common.IObject, dir: number): boolean {
            if (this.isMovable(obj, dir)) {
                var coord = obj.coord;
                var oldCell = this.map[coord.y][coord.x];
                var newCell = this.map[coord.y + ROT.DIRS[8][dir][1]][coord.x + ROT.DIRS[8][dir][0]];
                this.deleteObject(obj);
                newCell.object = obj;
                return true;
            } else {
                return false;
            }
        }

        // すでに存在するオブジェクトを削除する。成功したらTrue
        public deleteObject(obj: Common.IObject): boolean {
            var coord = obj.coord;
            if (obj.coord != null) {
                var cell = this.map[coord.y][coord.x];
                cell.del(obj.layer);
                return true;
            }
            return false;
        }

        // オブジェクトの追加
        public setObject(obj: Common.IObject, coord: Common.Coord, force: boolean = true): boolean {
            var cell = this.map[coord.y][coord.x];
            if (cell.objects[obj.layer].type == Common.DungeonObjectType.Null) {
                if (force) {
                    this.deleteObject(cell.objects[obj.layer]);
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
                    var cell: Cell = this.map[y][x];
                    if (cell.objects[layer].type == Common.DungeonObjectType.Null
                        && cell.objects[Common.Layer.Floor].type == Common.DungeonObjectType.Room) {
                        currentFreeCells.push(cell);
                    }
                }
            }
            var index = Math.floor(ROT.RNG.getUniform() * currentFreeCells.length);
            return currentFreeCells[index].coord;
        }

        // あるレイヤの[オブジェクトタイプ,オブジェクトID]を取得
        public getTable(x: number, y: number): Common.IObject[] {
            return this.map[y][x].objects;
        }
    }
}