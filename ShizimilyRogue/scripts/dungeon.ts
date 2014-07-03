

module ShizimilyRogue.Model {

    export interface MapController {
        getTable(x: number, y: number): Common.IObject[];
        getRandomPoint(layer: number): Common.Coord;
        deleteObject(obj: Common.IObject): boolean;
        setObject(obj: Common.IObject, coord: Common.Coord): boolean;
        addObject(data:IData, coord?: Common.Coord): Common.IObject;
        moveObject(obj: Common.IObject, dir: number): boolean;
        getFOV(): Common.IFOVData;
        current: Common.IObject;
    }

    export enum DataType {
        Unit, Item
    }

    export interface IData {
        name: string;
        category: number;
        type: DataType;
    }

    export interface IItemData extends IData {
        num: number;
        commands: Common.ActionType[];
        use(command: Common.Action): Common.Action;
    }

    export interface IUnitData extends IData {
        dir: Common.DIR;
        state: Common.DungeonUnitState;
        hp: number;
        lv: number;
        speed: Common.Speed;
        maxHp: number;
        atk: number;
        def: number;
        turn: number;
        currentExp: number;
        stomach: number;
        maxStomach: number;
        inventory: Common.IItem[];
        phase(fov: Common.IFOVData): Common.Action;
        event(map: MapController, result: Common.IResult): Common.Action;
    }

    export interface IEnemyData extends IUnitData{
        exp: number;
        dropProbability: number;
        awakeProbabilityWhenAppear: number;
        awakeProbabilityWhenEnterRoom: number;
        awakeProbabilityWhenNeighbor: number;
    }

    export class Result implements Common.IResult {
        constructor(
            public object: Common.IObject,
            public action: Common.Action,
            public targets: Common.IObject[]) {
        }
    }

    class DungeonObject implements Common.IObject {
        private static currentId = 1;
        id: number;

        category: number = 0;
        coord: Common.Coord = null;
        corner: boolean = false;
        type: Common.DungeonObjectType = null;
        layer: Common.Layer = null;
        dir: Common.DIR = 0;
        name: string = null;

        event(result: Common.IResult): Common.Action {
            return null;
        }

        constructor() {
            this.id = DungeonObject.currentId;
            DungeonObject.currentId++;
        }
    }

    export class DungeonManager implements MapController {
        private _currentObject: Common.IObject;
        private _currentUnit: Unit;
        private _objects: Common.IObject[] = [];
        private map: Map;
        private scheduler: ROT.Scheduler.Speed = new ROT.Scheduler.Speed();
        private _endState: Common.EndState = Common.EndState.None;

        constructor(w: number, h: number) {
            this.map = new Map(w, h);

            // Playerを配置
            var player = new Player(new Model.Data.PlayerData("しじみりちゃん"), this);
            this.setObject(player, this.getRandomPoint(player.layer));

            // 敵を配置
            this.addObject(new Model.Data.Ignore);
            this.addObject(new Model.Data.Ignore);
            this.addObject(new Model.Data.Ignore);
            this.addObject(new Model.Data.Ignore);

            // アイテムを配置
            this.addObject(new Model.Data.Sweet);
            this.addObject(new Model.Data.Sweet);
            this.addObject(new Model.Data.Sweet);
            this.addObject(new Model.Data.Sweet);
            this.addObject(new Model.Data.Sweet);

            // 一番最初のターンはプレイヤー
            this._currentUnit = this.scheduler.next();
            this._currentObject = this._currentUnit;
        }

        public addObject(data: IData, coord: Common.Coord = null): Common.IObject {

            var object: Common.IObject;
            switch (data.type) {
                case DataType.Unit:
                    object = new Unit(<IUnitData>data, this);
                    break;
                case DataType.Item:
                    object = new Item(<IItemData>data);
                    break;
            }
            if (coord == null) {
                coord = this.map.getRandomPoint(object.layer);
            }
            this.setObject(object, coord);
            return object
        }

        public setObject(obj: Common.IObject, coord: Common.Coord): boolean {
            if (this.map.setObject(obj, coord)) {
                this._objects.push(obj);
                if (obj.type == Common.DungeonObjectType.Unit)
                    this.scheduler.add(obj, true);
                return true;
            } else {
                return false;
            }
        }

        public deleteObject(obj: Common.IObject): boolean {
            if (this.map.deleteObject(obj)) {
                this._objects = this._objects.filter(v => v.id != obj.id);
                if (obj.type == Common.DungeonObjectType.Unit)
                    this.scheduler.remove(obj);
                return true;
            } else {
                return false;
            }
        }

        public getRandomPoint(layer: number): Common.Coord {
            return this.map.getRandomPoint(layer);
        }

        public moveObject(obj: Common.IObject, dir: number): boolean {
            return this.map.moveObject(obj, dir);
        }

        public get current(): Common.IUnit {
            return this._currentUnit;
        }

        public get endState(): number {
            return this._endState;
        }

        public get objects(): Common.IObject[] {
            return this._objects;
        }

        public getTable(x: number, y: number): Common.IObject[] {
            return this.map.getTable(x, y);
        }

        public getFOV(): Common.IFOVData {
            return this.map.getFOV(this._currentObject);
        }

        public next(input: Common.Action): Common.IResult[] {
            var allResults: Common.IResult[] = [];
            var action = input;
            while (action != null) {
                // 行動
                this._endState = this.update(this._currentObject, action, allResults);
                if (this._endState != Common.EndState.None) {
                    // ゲームが終わった
                    return allResults;
                }

                // 次に行動するユニットのアクションを取り出す
                this._currentUnit = this.scheduler.next();
                this._currentObject = this._currentUnit;
                action = this._currentUnit.phase();
            }
            return allResults;
        }

        private update(object: Common.IObject, action: Common.Action, results: Common.IResult[]): Common.EndState {
            var result = this.process(object, action);
            if (action.end != Common.EndState.None)
                return action.end;
            if (result != null) {
                results.push(result);
                for (var i = 0; i < result.targets.length; i++) {
                    this._currentObject = result.targets[i];
                    var newAction = (<DungeonObject>this._currentObject).event(result);
                    if (newAction != null) {
                        var endState = this.update(this._currentObject, newAction, results)
                        if (endState != Common.EndState.None)
                            return endState;
                    }
                }
            }
            return Common.EndState.None;
        }

        private process(object: Common.IObject, action: Common.Action): Common.IResult {
            var targets: Common.IObject[] = [];
            switch (action.target) {
                case Common.Target.Me:
                    targets = [object];
                    break;
                case Common.Target.Next:
                    targets;
                    var coord = DungeonManager.getDst(object, object.dir);
                    targets = [this.map.getTable(coord.x, coord.y)[object.layer]];
                    break;
            }
            var result = new Result(object, action, targets);
            return result;
        }

        private static getDst(obj: Common.IObject, dir: number): Common.Coord {
            var x = obj.coord.x + ROT.DIRS[8][dir][0];
            var y = obj.coord.y + ROT.DIRS[8][dir][1];
            return new Common.Coord(x, y);
        }
    }

    class Item extends DungeonObject implements Common.IItem {
        layer = Common.Layer.Ground;
        type = Common.DungeonObjectType.Item;

        public get name(): string { return this.data.name; }
        public get num(): number { return this.data.num; }
        public get category(): number { return this.data.category; }
        public get commands(): Common.ActionType[] { return this.data.commands; }
        use(action: Common.Action): Common.Action {
            return this.data.use(action);
        }

        constructor(private data: IItemData) {
            super();
        }
    }

    class FOVData implements Common.IFOVData {
        constructor(
            public me: Common.IObject,
            public width: number,
            public height: number,
            public getObject: (coord: Common.Coord) => Common.IObject[],
            public area: Common.Coord[],
            public movable: boolean[],
            public objects: Common.IObject[],
            public attackable: { [id: number]: boolean }
            ) { }
    }

    class Unit extends DungeonObject implements Common.IUnit {
        layer = Common.Layer.Unit;
        type = Common.DungeonObjectType.Unit;

        getSpeed() {
            return this.data.speed;
        }

        get atk(): number { return this.data.atk; }
        get def(): number { return this.data.def; }
        get lv(): number { return this.data.lv; }
        get hp(): number { return this.data.hp; }
        get maxHp(): number { return this.data.maxHp; }
        get turn(): number { return this.data.turn; }
        get dir(): Common.DIR { return this.data.dir; }
        get inventory(): Common.IItem[] { return this.data.inventory; }
        get state(): Common.DungeonUnitState { return this.data.state; }
        get name(): string { return this.data.name; }
        get currentExp(): number { return this.data.currentExp; }
        get maxStomach(): number { return this.data.maxStomach; }
        get stomach(): number { return this.data.stomach; }

        setDir(dir: number) { this.data.dir = dir; }

        phase(): Common.Action {
            this.data.turn++;
            return this.data.phase(this.map.getFOV());
        }
        event(result: Common.IResult): Common.Action {
            return this.data.event(this.map, result);
        }

        constructor(private data: IUnitData, private map: MapController) {
            super();
        }
    }

    class Player extends Unit {
        id = Common.PLAYER_ID;

        constructor(private playerData: IUnitData, map: MapController) {
            super(playerData, map);
        }
    }

    class Enemy extends Unit {
        get exp(): number { return this.enemyData.exp; }
        get dropProbability(): number { return this.enemyData.dropProbability; }
        get awakeProbabilityWhenAppear(): number { return this.enemyData.awakeProbabilityWhenAppear; }
        get awakeProbabilityWhenEnterRoom(): number { return this.enemyData.awakeProbabilityWhenEnterRoom; }
        get awakeProbabilityWhenNeighbor(): number { return this.enemyData.awakeProbabilityWhenNeighbor; }

        constructor(private enemyData: IEnemyData, map: MapController) {
            super(enemyData, map);
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
            var area: Common.Coord[] = [];
            fov.compute(coord.x, coord.y, 10, (x, y, r, visibility) => {
                area.push(this.map[y][x].coord);
            });
            var getObject = (place) => {
                return this.map[place.y][place.x].objects;
            };
            if (area.length == 1) {
                area.push(this.map[coord.y + 1][coord.x - 1].coord);
                area.push(this.map[coord.y + 1][coord.x].coord);
                area.push(this.map[coord.y + 1][coord.x + 1].coord);
                area.push(this.map[coord.y][coord.x - 1].coord);
                area.push(this.map[coord.y][coord.x + 1].coord);
                area.push(this.map[coord.y - 1][coord.x - 1].coord);
                area.push(this.map[coord.y - 1][coord.x].coord);
                area.push(this.map[coord.y - 1][coord.x + 1].coord);
            }
            var objects: Common.IObject[] = [];
            var attackable: { [id: number]: boolean } = {};
            area.forEach(coord => {
                for (var layer = Common.Layer.Ground; layer < Common.Layer.MAX; layer++) {
                    var obj = this.map[coord.y][coord.x].objects[layer];
                    if (obj.type != Common.DungeonObjectType.Null && obj.id != unit.id) {
                        objects.push(obj);
                        attackable[obj.id] = this.isAttackable(unit, obj);
                    }
                }
            });

            var movable: boolean[] = [];
            for (var dir = 0; dir < ROT.DIRS[8].length; dir++) {
                movable.push(this.isMovable(unit, dir));
            }

            var result: FOVData = new FOVData(unit, this.width, this.height, getObject, area, movable, objects, attackable);
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
        private isMovable(obj: Common.IObject, dir: number): boolean {
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