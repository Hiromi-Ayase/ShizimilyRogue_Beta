

module ShizimilyRogue.Model {

    export interface MapController {
        getCell(x: number, y: number): Common.ICell;
        getObject(coord: Common.Coord, layer: Common.Layer): Common.IObject;
        getRandomPoint(layer: number): Common.Coord;
        deleteObject(obj: Common.IObject): boolean;
        setObject(obj: Common.IObject, coord: Common.Coord): boolean;
        dropObject(obj: Common.IObject, coord: Common.Coord): boolean;
        moveObject(obj: Common.IObject, dir: number): boolean;
        getFOV(unit: Common.IUnit): Common.IFOVData;
        currentTurn: Common.IUnit;
    }

    export interface UnitController {
        object: Common.IUnit;
        getFOV(): Common.IFOVData;
        cell: Common.ICell;
    }

    export class DungeonObject implements Common.IObject {
        private static currentId = 1;
        id: number;

        category: number = 0;
        cell: Common.ICell = null;
        type: Common.DungeonObjectType = null;
        layer: Common.Layer = null;
        dir: Common.DIR = 0;
        name: string = null;

        event(action: Common.Action): Common.Action[] {
            return [];
        }

        constructor() {
            this.id = DungeonObject.currentId;
            DungeonObject.currentId++;
        }

        isPlayer(): boolean { return this.id == Common.PLAYER_ID; }
        isUnit(): boolean { return this.type == Common.DungeonObjectType.Unit; }
        isWall(): boolean { return this.type == Common.DungeonObjectType.Wall; }
        isRoom(): boolean { return this.type == Common.DungeonObjectType.Room; }
        isPath(): boolean { return this.type == Common.DungeonObjectType.Path; }
        isItem(): boolean { return this.type == Common.DungeonObjectType.Item; }
        isNull(): boolean { return this.type == Common.DungeonObjectType.Null; }
        isStairs(): boolean { return this.type == Common.DungeonObjectType.Stairs; }
        isTrap(): boolean { return this.type == Common.DungeonObjectType.Trap; }
    }

    export class DungeonManager implements MapController {
        private _currentUnit: Unit = null;
        private _objects: Common.IObject[] = [];
        private map: Map;
        private scheduler: ROT.Scheduler.Speed = new ROT.Scheduler.Speed();
        private _endState: Common.EndState = Common.EndState.None;
        private actionQueue: Common.Action[] = [];

        constructor(w: number, h: number) {
            this.map = new Map(w, h);

        }

        public init(): Common.Action[]{
            var actions: Common.Action[] = [];
            // Player作成
            var player = new Player("しじみりちゃん");
            actions.unshift(this.addObject(player));

            // 出口作成
            var exit = new Stairs();
            actions.unshift(this.addObject(exit));
            /*for (var i = 0; i < 5; i++) {
                var ignore: Common.IObject = new Model.Data.Ignore;
                actions.unshift(this.addObject(ignore));
            }*/
            for (var i = 0; i < 2; i++) {
                var sweet: Common.IObject = new Model.Data.Sweet;
                actions.unshift(this.addObject(sweet));
            }

            for (var i = 0; i < 2; i++) {
                var pccase: Common.IObject = new Model.Data.Case;
                actions.unshift(this.addObject(pccase));
            }

            for (var i = 0; i < 2; i++) {
                var pccase: Common.IObject = new Model.Data.Pentium;
                actions.unshift(this.addObject(pccase));
            }

            for (var i = 0; i < 2; i++) {
                var pccase: Common.IObject = new Model.Data.GeForce;
                actions.unshift(this.addObject(pccase));
            }

            // 配置
            this.addInput(actions);
            while (this.hasNext()) {
                this.update();
            };
            return actions;
        }

        private addObject(data: Common.IObject, coord: Common.Coord = null): Common.Action {
            if (coord == null) {
                coord = this.map.getRandomPoint(data.layer);
            }
            return Common.Action.Drop(data, coord);
        }

        public setObject(obj: Common.IObject, coord: Common.Coord): boolean {
            if (this.map.setObject(obj, coord)) {
                this._objects.push(obj);
                if (obj.isUnit()) {
                    var unit = <Unit>obj;
                    unit.getFov = () => this.getFOV(unit);
                    this.scheduler.add(obj, true);
                }
                return true;
            } else {
                return false;
            }
        }
        public deleteObject(obj: Common.IObject): boolean {
            if (this.map.deleteObject(obj)) {
                for (var i = 0; i < this._objects.length; i++) {
                    if (this._objects[i].id == obj.id) {
                        this._objects.splice(i, 1);
                        break;
                    }
                }
                if (obj.isUnit()) {
                    var unit = <Unit>obj;
                    unit.getFov = null;
                    this.scheduler.remove(obj);
                }
                return true;
            } else {
                return false;
            }
        }

        public dropObject(obj: Common.IObject, coord: Common.Coord): boolean {
            coord = this.map.drop(obj, coord);
            if (coord != null) {
                return this.setObject(obj, coord);
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

        public get currentTurn(): Common.IUnit {
            return this.hasNext() ? null : this._currentUnit;
        }

        public get endState(): number {
            return this._endState;
        }

        public get objects(): Common.IObject[] {
            return this._objects;
        }

        public getCell(x: number, y: number): Common.ICell {
            return this.map.getCell(x, y);
        }

        public getObject(coord: Common.Coord, layer: Common.Layer): Common.IObject {
            return this.map.getObject(coord, layer);
        }

        public getFOV(unit: Common.IUnit): Common.IFOVData {
            return this.map.getFOV(unit);
        }

        addInput(actions: Common.Action[], sender: Common.IObject = this._currentUnit): void {
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                this.process(sender, action);
                if (Common.DEBUG) {
                    Common.Debug.result(action);
                }
                this.actionQueue.unshift(action);
            }
        }

        public hasNext(): boolean {
            return this.actionQueue.length > 0;
        }

        /**
         * 次の行動を行う
         * @return {Common.Action} 行動したAction
         */
        public update(): Common.Action {
            var action = this.actionQueue[0];
            try {
                if (action.end != Common.EndState.None) {
                    this._endState = action.end;
                    return action;
                }

                action.targetIndex++;
                var receiver = action.target;
                if (action.targetIndex == action.targets.length - 1) {
                    // 現在のキューのターゲットが空になったので次のキューへ
                    this.actionQueue.shift();
                }

                if (action.isSystem()) {
                    this.addInput(DungeonManager.systemAction(this, action));
                }
                this.addInput((<DungeonObject>receiver).event(action), receiver);

                // キューが0になったら
                if (this.actionQueue.length == 0) {
                    // 次に行動するユニットのアクションを取り出す
                    this._currentUnit = this.scheduler.next();
                    var fov = this.getFOV(this._currentUnit);
                    this.addInput(this._currentUnit.phase());
                }
            } catch (e) {
                if (Common.DEBUG) {
                    Common.Debug.message(e.message);
                }
            } finally {
                if (this.actionQueue.length == 0) {
                    if (Common.DEBUG) {
                        Common.Debug.message("------- Turn End --------");
                    }
                }
            }
            return action;
        }

        /**
         * Actionに必要な情報を付加して完全な形にする
         * @param {Common.IObject} sender Actionの送信元
         * @param {Common.Action} action 元となるAction
         */
        private process(sender: Common.IObject, action: Common.Action): void {
            var targets: Common.IObject[] = [];
            var obj: Common.IObject;
            switch (action.type) {
                case Common.ActionType.Attack:
                    if (sender.isUnit()) {
                        var unit = <Unit>sender;
                        action.param = unit.atk;
                        if (unit.weapon != null) {
                            unit.weapon.onAttack(action);
                        }
                    }
                    break;
            }

            switch (action.targetType) {
                case Common.Target.Me:
                    targets = [sender];
                    break;
                case Common.Target.Next:
                    var coord = DungeonManager.getDst(sender, sender.dir);
                    targets = [this.map.getObject(coord, sender.layer)];
                    break;
                case Common.Target.Line:
                    obj = DungeonManager.getLine((x, y) => this.getCell(x, y), sender, sender.dir, 10);
                    targets = [obj];
                    break;
                case Common.Target.FarLine:
                    obj = DungeonManager.getLine((x, y) => this.getCell(x, y), sender, sender.dir, 100);
                    targets = [obj];
                    break;
                case Common.Target.Target:
                    targets = action.targets;
                    break;
                case Common.Target.System:
                    targets = action.targets;
                    if (action.isMove()) {
                        targets = [sender];
                    }
                    break;
                case Common.Target.Item:
                    targets = [action.item];
                    break;
                case Common.Target.Ground:
                    targets = [this.getCell(sender.cell.coord.x, sender.cell.coord.y).ground];
                    break;
                case Common.Target.Unit:
                    targets = [this.getCell(sender.cell.coord.x, sender.cell.coord.y).unit];
                    break;
            }
            action.sender = sender;
            action.targets = targets;
        }

        /**
         * システムアクション(マップの移動など)
         * @param {MapController} map マップコントローラクラス
         * @param {Common.Action} action Action本体
         * @return {Common.Action[]} 次のアクション
         */
        private static systemAction(map: MapController, action: Common.Action): Common.Action[]{
            var actions: Common.Action[] = [];
            if (action.isMove()) {
                map.moveObject(action.sender, action.sender.dir);
            } else if (action.isDrop()) {
                var object = action.targets[0];
                map.dropObject(object, action.coord);
            } else if (action.isSet()) {
                var object = action.targets[0];
                map.setObject(object, action.coord);
            } else if (action.isDelete()) {
                var object = action.targets[0];
                map.deleteObject(object);
            } else if (action.isSwap()) {
                var coord0 = action.targets[0].cell.coord;
                var coord1 = action.targets[1].cell.coord;
                map.deleteObject(action.targets[0]);
                map.deleteObject(action.targets[1]);
                map.setObject(action.targets[0], coord1);
                map.setObject(action.targets[1], coord0);
            }
            return actions;
        }

        private static getLine(table: (x: number, y: number) => Common.ICell, obj: Common.IObject, dir: number, distance: number): Common.IObject {
            var x = obj.cell.coord.x;
            var y = obj.cell.coord.y;
            for (var i = 0; i < distance; i++) {
                x += ROT.DIRS[8][dir][0];
                y += ROT.DIRS[8][dir][1];
                if (table(x, y).isUnit()) {
                    return table(x, y).unit;
                } else if (table(x + ROT.DIRS[8][dir][0], y + ROT.DIRS[8][dir][1]).isWall()) {
                    return table(x, y).unit;
                }
            }
            return table(x, y).unit;
        }

        private static getDst(obj: Common.IObject, dir: number): Common.Coord {
            var x = obj.cell.coord.x + ROT.DIRS[8][dir][0];
            var y = obj.cell.coord.y + ROT.DIRS[8][dir][1];
            return new Common.Coord(x, y);
        }
    }

    class FOVData implements Common.IFOVData {
        visible: { [id: number]: boolean } = {};
        id2index: { [id: number]: number } = {};

        constructor(
            public me: Common.IObject,
            public width: number,
            public height: number,
            public getCell: (coord: Common.Coord) => Common.ICell,
            public getCellByCoord: (x: number, y: number) => Common.ICell,
            public area: Common.Coord[],
            public movable: boolean[],
            public objects: Common.IObject[],
            public attackable: { [id: number]: boolean }
            ) {
            var index = 0;
            objects.forEach(obj => {
                this.visible[obj.id] = true;
                this.id2index[obj.id] = index;
                index++;
            });
            this.visible[me.id] = true;
        }
        isVisible(id: number) {
            return this.visible[id] == true;
        }
        isAttackable(id: number): boolean {
            return this.attackable[id] == true;
        }
        getObjectById(id: number): Common.IObject {
            return this.objects[this.id2index[id]];
        }
    }

    class Stairs extends DungeonObject {
        category = 2;
        type = Common.DungeonObjectType.Stairs;
        layer = Common.Layer.Ground;
        name = "Stairs";
    }

    class Wall extends DungeonObject {
        type = Common.DungeonObjectType.Wall;
        layer = Common.Layer.Ground;
        name = "Wall";
    }

    class Room extends DungeonObject {
        type = Common.DungeonObjectType.Room;
        layer = Common.Layer.Floor;
        name = "Room";
    }

    class Path extends DungeonObject {
        type = Common.DungeonObjectType.Path;
        layer = Common.Layer.Floor;
        name = "Pass";
    }

    class Null extends DungeonObject {
        type = Common.DungeonObjectType.Null;
        id = -1;
        name = "Null";

        event(action: Common.Action): Common.Action[] {
            if (action.isFly()) {
                return [Common.Action.Drop(action.sender, this.cell.coord)];
            }
            return [];
        }
    }

    /**
     * アイテムデータ
     */
    export class Item extends DungeonObject implements Common.IItem {
        type: Common.DungeonObjectType = Common.DungeonObjectType.Item;
        status: Common.ItemState = Common.ItemState.Normal;
        unknownName: string = null;
        layer = Common.Layer.Ground;

        /**
         * @constructor
         */
        constructor(
            public category: number,
            public name: string) {
            super();
        }

        /**
         * コマンドリストの取得
         * @param {Common.IFOVData} fov 司会情報
         * @return {string[]} コマンドリスト
         */
        commands(): string[] {
            var list = ["使う", "投げる"];
            if (!this.cell.ground.isItem()) {
                list.push("置く");
            }
            return list;
        }

        /**
         * 
         * @param {number} n 選択番号
         */
        select(n: number, items: Common.IItem[]): Common.Action {
            switch (n) {
                case 0:
                    return Common.Action.Use(this);
                case 1:
                    return Common.Action.Throw(this);
                case 2:
                    return Common.Action.Place(this);
            }
        }

        event(action: Common.Action): Common.Action[] {
            var unit = <Common.IUnit>action.sender;
            if (action.isPick()) {
                unit.inventory.push(this);
                return [Common.Action.Delete(this)];
            } else if (action.isPlace()) {
                unit.takeInventory(this);
                return [Common.Action.Drop(this, unit.cell.coord)];
            } else if (action.isUse()) {
                return this.use(action, unit);
            } else if (action.isThrow()) {
                unit.takeInventory(this);
                this.dir = unit.dir;
                this.cell = unit.cell
                var action = Common.Action.Fly(unit.cell.coord);
                return [action];
            }
            return [];
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            return [];
        }
    }

    /**
     * 装備品
     */
    export class Equip extends Item {
        baseName: string;
        plus: number = 0;
        baseParam: number = 100;
        //mark: Common.Mark[] = [];

        get name(): string {
            return this.baseName + (this.plus > 0 ? (" +") : " ") + this.plus;
        }
        
        /**
         * コマンドリストの取得
         * @param {Common.IFOVData} fov 司会情報
         * @return {string[]} コマンドリスト
         */
        commands(): string[] {
            var list = ["装備", "投げる"];
            if (!this.cell.ground.isItem()) {
                list.push("置く");
            }
            return list;
        }

        /**
         * 
         * @param {number} n 選択番号
         */
        select(n: number, items: Common.IItem[]): Common.Action {
            switch (n) {
                case 0:
                    return Common.Action.Use(this);
                case 1:
                    return Common.Action.Throw(this);
                case 2:
                    return Common.Action.Place(this);
            }
        }
    }

    /**
     * Weapon
     */
    export class Weapon extends Equip {
        get atk(): number { return Common.GuardDef(this.baseParam, this.plus); }

        constructor() {
            super(Common.ItemType.CPU, "Weapon");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            var player = <Common.IUnit>action.sender;
            if (player.weapon == this) {
                player.weapon = null;
            } else {
                player.weapon = this;
            }
            return [];
        }

        /**
         * 攻撃時processで呼ばれる
         */
        onAttack(action: Common.Action): void {
        }
    }

    /**
     * Guard
     */
    export class Guard extends Equip {
        plus: number = 0;
        baseParam: number = 100;
        get def(): number { return Common.GuardDef(this.baseParam, this.plus); }

        constructor() {
            super(Common.ItemType.GraphicBoard, "Guard");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            var player = <Common.IUnit>action.sender;
            if (player.guard == this) {
                player.guard = null;
            } else {
                player.guard = this;
            }
            return [];
        }
        /**
         * ステータス変更時eventで呼ばれる
         */
        onStatus(action: Common.Action): Common.Action[]{
            return [];
        }
    }

    /**
     * Accessory
     */
    export class Accessory extends Equip {
        constructor() {
            super(Common.ItemType.Case, "Accessory");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            var player = <Common.IUnit>action.sender;
            player.accessory = this;
            return [];
        }

        /**
         * ステータス変更時eventで呼ばれる
         */
        onEvent(action: Common.Action): Common.Action[] {
            return [];
        }
    }

    /**
     * ユニット
     */
    export class Unit extends DungeonObject implements Common.IUnit {
        lv: number = 1;
        weapon: Weapon = null;
        guard: Guard = null;
        accessory: Accessory = null;
        layer = Common.Layer.Unit;

        get atk(): number {
            return this.weapon == null ? Common.Parameter.Atk : this.weapon.atk;
        }
        get def(): number {
            return this.guard == null ? Common.Parameter.Atk : this.guard.def;
        }

        type: Common.DungeonObjectType = Common.DungeonObjectType.Unit;
        category: number = 0;
        dir: Common.DIR = 0;
        state: Common.DungeonUnitState = Common.DungeonUnitState.Normal;
        maxHp: number = 100;
        hp: number = this.maxHp;
        speed: Common.Speed = Common.Speed.NORMAL;
        turn: number = 0;
        inventory: Common.IItem[] = [];
        maxInventory = 10;
        currentExp: number = 0;
        stomach: number = 100;
        maxStomach: number = 100;

        getFov: () => Common.IFOVData;

        getSpeed(): number {
            return this.speed;
        }

        setDir(dir: Common.DIR): void {
            this.dir = dir;
        }

        phase(): Common.Action[] {
            return [];
        }

        event(action: Common.Action): Common.Action[]{
            var ret: Common.Action[] = [];
            if (this.accessory != null) {
                ret = ret.concat(this.accessory.onEvent(action));
            }

            if (action.isAttack()) {
                if (action.sender.isUnit()) {
                    var damage = Common.Damage(action.param, this.def);
                    ret.push(Common.Action.Status(this, Common.StatusActionType.Damage, damage));
                }
            } else if (action.isFly()) {
                if (action.sender.isItem()) {
                    ret.push(Common.Action.Use(<Common.IItem>action.sender));
                }
            } else if (action.isStatus()) {
                if (this.guard != null) {
                    ret = ret.concat(this.guard.onStatus(action));
                }
                ret = ret.concat(this.statusChange(action));
            } else if (action.isDie()) {
                var nextAction = Common.Action.Delete(this);
                if (action.sender.isPlayer()) {
                    nextAction.end = Common.EndState.GameOver;
                }
                ret.push(nextAction);
            }
            return ret;
        }

        statusChange(action: Common.Action): Common.Action[] {
            var amount = action.param;
            if (action.subType == Common.StatusActionType.Damage) {
                return this.damage(amount);
            } else if (action.subType == Common.StatusActionType.Heal) {
                this.hp += (this.hp + amount) > this.maxHp ? (this.maxHp - this.hp) : amount;
            } else if (action.subType == Common.StatusActionType.Hunger) {
                if (amount > this.stomach) {
                    this.stomach = 0;
                    var damage = Common.HungerDamage(this.maxHp);
                    return this.damage(damage);
                } else {
                    this.stomach -= amount;
                }
            } else if (action.subType == Common.StatusActionType.Full) {
                var full = action.param;
                this.stomach += (this.stomach + full) > this.maxStomach ? (this.maxStomach - this.stomach) : full;
            }
            return [];
        }

        addInventory(item: Common.IItem): boolean {
            if (this.inventory.length < this.maxInventory) {
                this.inventory.push(item);
                return true;
            } else {
                return false;
            }
        }

        takeInventory(item: Common.IItem): boolean {
            for (var i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].id == item.id) {
                    this.inventory.splice(i, 1);
                    return true;
                }
            }
            return false;
        }

        damage(amount: number): Common.Action[] {
            this.hp -= amount > this.hp ? this.hp : amount;
            if (this.hp <= 0) {
                var action = Common.Action.Die();
                return [action];
            }
            return [];
        }
        private heal(amount: number): void {
        }


        constructor(public name: string) {
            super();
        }
    }

    class Player extends Unit {
        id = Common.PLAYER_ID;

        event(action: Common.Action): Common.Action[] {
            var ret = super.event(action);
            if (action.isMove()) {
                if (this.cell.isItem()) {
                    return [Common.Action.Pick()];
                }
            }
            return ret;
        }

        phase(): Common.Action[] {
            if (this.turn % Common.Parameter.StomachDecrease == 0) {

            }
            return [];
        }

        constructor(name: string) {
            super(name);
            this.maxHp = 1000;
            this.hp = 1000;
        }
    }


    export class Enemy extends Unit {
        category = 0;
        exp = 100;
        dropProbability = 10;
        awakeProbabilityWhenAppear = 100;
        awakeProbabilityWhenEnterRoom = 100;
        awakeProbabilityWhenNeighbor = 100;
        hp = this.maxHp;

        private static CANDIDATE = [
            [Common.DIR.UP, Common.DIR.UP_RIGHT, Common.DIR.UP_LEFT, Common.DIR.RIGHT, Common.DIR.LEFT],
            [Common.DIR.UP_RIGHT, Common.DIR.RIGHT, Common.DIR.UP, Common.DIR.DOWN_RIGHT, Common.DIR.UP_LEFT],
            [Common.DIR.RIGHT, Common.DIR.DOWN_RIGHT, Common.DIR.UP_RIGHT, Common.DIR.DOWN, Common.DIR.UP],
            [Common.DIR.DOWN_RIGHT, Common.DIR.DOWN, Common.DIR.RIGHT, Common.DIR.DOWN_LEFT, Common.DIR.UP_RIGHT],
            [Common.DIR.DOWN, Common.DIR.DOWN_LEFT, Common.DIR.DOWN_RIGHT, Common.DIR.LEFT, Common.DIR.RIGHT],
            [Common.DIR.DOWN_LEFT, Common.DIR.LEFT, Common.DIR.DOWN, Common.DIR.UP_LEFT, Common.DIR.DOWN_RIGHT],
            [Common.DIR.LEFT, Common.DIR.UP_LEFT, Common.DIR.DOWN_LEFT, Common.DIR.UP, Common.DIR.DOWN],
            [Common.DIR.UP_LEFT, Common.DIR.UP, Common.DIR.LEFT, Common.DIR.UP_RIGHT, Common.DIR.DOWN_LEFT],
        ];

        private lastMe: Common.Coord = null;
        private lastPlayer: Common.Coord = null;
        public phase(): Common.Action[] {
            var fov = this.getFov();
            var me = fov.me.cell.coord;
            var player: Common.Coord = null;
            var action: Common.Action = null;
            for (var i = 0; i < fov.objects.length; i++) {
                if (fov.objects[i].isPlayer()) {
                    player = fov.objects[i].cell.coord;
                    break;
                }
            }

            if (player != null) {
                // 視界内にプレイヤーがいた
                if (fov.isAttackable(Common.PLAYER_ID)) {
                    this.dir = Enemy.getAttackDir(this.cell.coord, player);
                    action = Common.Action.Attack();
                } else {
                    var dir = Enemy.move(me, player, this.lastMe, fov);
                    if (dir != null) {
                        this.dir = dir;
                        action = Common.Action.Move();
                    }
                }
            } else {
                var dir = Enemy.move(me, this.lastPlayer, this.lastMe, fov);
                if (dir != null) {
                    this.dir = dir;
                    action = Common.Action.Move();
                }
            }

            if (action == null) {
                // 何もできない場合はランダムに移動
                var dirs: number[] = [];
                fov.movable.map((value, index, array) => {
                    if (value) dirs.push(index);
                });
                this.dir = Math.floor(dirs.length * ROT.RNG.getUniform());
                action = Common.Action.Move();
            }
            this.lastPlayer = player;
            this.lastMe = me;
            return [action];
        }

        public event(action: Common.Action): Common.Action[] {
            var ret = super.event(action);
            var fov = this.getFov();
            fov.objects.forEach(obj => {
                if (obj.isPlayer()) {
                    this.lastPlayer = obj.cell.coord;
                }
            });
            return ret;
        }

        private static getAttackDir(src: Common.Coord, dst: Common.Coord, neighbor: boolean = true): number {
            var diffX = dst.x - src.x;
            var diffY = dst.y - src.y;

            if (diffX == 0 && diffY > 0) {
                return Common.DIR.DOWN;
            } else if (diffX == 0 && diffY < 0) {
                return Common.DIR.UP;
            } else if (diffX > 0 && diffY == 0) {
                return Common.DIR.RIGHT;
            } else if (diffX < 0 && diffY == 0) {
                return Common.DIR.LEFT;
            } else if (diffX > 0 && diffY > 0) {
                return Common.DIR.DOWN_RIGHT;
            } else if (diffX > 0 && diffY < 0) {
                return Common.DIR.UP_RIGHT;
            } else if (diffX < 0 && diffY > 0) {
                return Common.DIR.DOWN_LEFT;
            } else if (diffX < 0 && diffY < 0) {
                return Common.DIR.UP_LEFT;
            }
            return null;
        }

        private static move(me: Common.Coord, player: Common.Coord, lastMe: Common.Coord, fov: Common.IFOVData): number {
            // 移動AI
            var dir: number = null;
            var inRoom = fov.getCell(me).isRoom();

            if (!inRoom) {
                // 通路の時
                if (player != null) {
                    //プレイヤーを探す
                    dir = Enemy.getDir(me, player, fov.movable);
                } else if (lastMe != null) {
                    // そのまま進む
                    dir = Enemy.getDir(lastMe, me, fov.movable);
                }
            } else {
                // 部屋の時
                if (player != null) {
                    // プレイヤーを探す
                    dir = Enemy.getDir(me, player, fov.movable);
                } else {
                    var enter: Common.Coord[] = [];
                    // 出入口を探す
                    for (var i = 0; i < fov.area.length; i++) {
                        var place = fov.area[i];
                        if (fov.getCell(place).isPath()) {
                            enter.push(place);
                        }
                    }
                    if (enter.length > 0) {
                        var id = Math.floor(enter.length * ROT.RNG.getUniform());
                        dir = Enemy.getDir(me, enter[id], fov.movable);
                    }
                }
            }
            return dir;
        }

        private static getDir(me: Common.Coord, target: Common.Coord, movable: boolean[]): number {
            var vecX = target.x - me.x;
            var vecY = target.y - me.y;

            var cand: number[];
            if (vecX == 0 && vecY > 0) {
                cand = Enemy.CANDIDATE[Common.DIR.DOWN];
            } else if (vecX > 0 && vecY > 0) {
                cand = Enemy.CANDIDATE[Common.DIR.DOWN_RIGHT];
            } else if (vecX > 0 && vecY == 0) {
                cand = Enemy.CANDIDATE[Common.DIR.RIGHT];
            } else if (vecX > 0 && vecY < 0) {
                cand = Enemy.CANDIDATE[Common.DIR.UP_RIGHT];
            } else if (vecX == 0 && vecY < 0) {
                cand = Enemy.CANDIDATE[Common.DIR.UP];
            } else if (vecX < 0 && vecY < 0) {
                cand = Enemy.CANDIDATE[Common.DIR.UP_LEFT];
            } else if (vecX < 0 && vecY == 0) {
                cand = Enemy.CANDIDATE[Common.DIR.LEFT];
            } else if (vecX < 0 && vecY > 0) {
                cand = Enemy.CANDIDATE[Common.DIR.DOWN_LEFT];
            } else if (vecX == 0 && vecY == 0) {
                return null;
            }

            for (var i = 0; i < cand.length; i++) {
                if (movable[cand[i]]) {
                    return cand[i];
                }
            }
        }
    }

    class Cell implements Common.ICell {

        private _objects: Common.IObject[] = new Array<Common.IObject>(Common.Layer.MAX);
        private _coord: Common.Coord;

        constructor(coord: Common.Coord) {
            this._coord = coord;
            for (var layer = 0; layer < Common.Layer.MAX; layer++)
                this.del(layer);
        }

        del(layer: Common.Layer): void {
            this._objects[layer] = new Null();
            this._objects[layer].cell = this;
        }

        set object(obj: Common.IObject) {
            this._objects[obj.layer] = obj;
            obj.cell = this;
        }

        get objects(): Common.IObject[] { return this._objects; }
        get coord(): Common.Coord { return this._coord; }

        isPlayer(): boolean { return this._objects[Common.Layer.Unit].isPlayer(); }
        isUnit(): boolean { return this._objects[Common.Layer.Unit].isUnit(); }
        isItem(): boolean { return this._objects[Common.Layer.Ground].isItem(); }
        isTrap(): boolean { return this._objects[Common.Layer.Ground].isTrap(); }
        isExit(): boolean { return this._objects[Common.Layer.Ground].isStairs(); }
        isWall(): boolean { return this._objects[Common.Layer.Ground].isWall(); }
        isRoom(): boolean { return this._objects[Common.Layer.Floor].isRoom(); }
        isPath(): boolean { return this._objects[Common.Layer.Floor].isPath(); }
        isNull(layer: Common.Layer): boolean { return this._objects[layer].isNull(); }

        get unit(): Common.IUnit { return <Common.IUnit>this._objects[Common.Layer.Unit]; }
        get item(): Common.IItem { return <Common.IItem>this._objects[Common.Layer.Ground]; }

        get floor(): Common.IObject { return this._objects[Common.Layer.Floor]; }
        get ground(): Common.IObject { return this._objects[Common.Layer.Ground]; }
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
                if (cell.isRoom()) {
                    return true;
                }
                return false;
            }

            var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
            var coord = unit.cell.coord;
            var area: Common.Coord[] = [];
            fov.compute(coord.x, coord.y, 10, (x, y, r, visibility) => {
                area.push(this.map[y][x].coord);
            });
            var getCell = (coord: Common.Coord) => {
                return this.map[coord.y][coord.x];
            };
            var getCellByCoord = (x, y) => {
                return this.map[y][x];
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
                    if (!obj.isNull() && obj.id != unit.id) {
                        objects.push(obj);
                        attackable[obj.id] = this.isAttackable(unit, obj);
                    }
                }
            });

            var movable: boolean[] = [];
            for (var dir = 0; dir < ROT.DIRS[8].length; dir++) {
                movable.push(this.isMovable(unit, dir));
            }

            var result: FOVData = new FOVData(unit, this.width, this.height, getCell, getCellByCoord, area, movable, objects, attackable);
            return result;
        }

        // 攻撃できるかどうか
        private isAttackable(obj: Common.IObject, target: Common.IObject): boolean {
            var dirX: number = target.cell.coord.x - obj.cell.coord.x;
            var dirY: number = target.cell.coord.y - obj.cell.coord.y;

            if (Math.abs(dirX) > 1 || Math.abs(dirY) > 1) {
                return false;
            }

            var coord = obj.cell.coord;
            var newCell = this.map[coord.y + dirY][coord.x + dirX];

            if (!newCell.isWall()) {
                if (dirX == 0 || dirY == 0) {
                    return true;
                } else {
                    var cornerCell1 = this.map[coord.y][coord.x + dirX];
                    var cornerCell2 = this.map[coord.y + dirY][coord.x];
                    if (!cornerCell1.isWall() && !cornerCell2.isWall()) {
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
            var coord = obj.cell.coord;
            var newCell = this.map[coord.y + dirY][coord.x + dirX];

            if (newCell.isNull(obj.layer) && !newCell.isWall()) {
                if (dirX == 0 || dirY == 0) {
                    return true;
                } else {
                    var cornerCell1 = this.map[coord.y][coord.x + dirX];
                    var cornerCell2 = this.map[coord.y + dirY][coord.x];
                    if (!cornerCell1.isWall() && !cornerCell2.isWall()) {
                        return true;
                    }
                }
            }
            return false;
        }

        // すでに存在するオブジェクトを移動する。成功したらTrue
        public moveObject(obj: Common.IObject, dir: number): boolean {
            if (this.isMovable(obj, dir)) {
                var coord = obj.cell.coord;
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
            var coord = obj.cell.coord;
            if (obj.cell.coord != null) {
                var cell = this.map[coord.y][coord.x];
                cell.del(obj.layer);
                return true;
            }
            return false;
        }

        // オブジェクトの追加
        public setObject(obj: Common.IObject, coord: Common.Coord, force: boolean = true): boolean {
            var cell = this.map[coord.y][coord.x];
            if (cell.isNull(obj.layer)) {
                if (force) {
                    this.deleteObject(cell.objects[obj.layer]);
                } else {
                    return false;
                }
            }
            cell.object = obj;
            return true;
        }

        public drop(obj: Common.IObject, coord: Common.Coord): Common.Coord {
            for (var i = 0; i < Common.Drop.length; i++) {
                var cell = this.map[coord.y + Common.Drop[i][0]][coord.x + Common.Drop[i][1]];
                if (cell.isNull(obj.layer) && !cell.isWall()) {
                    return cell.coord;
                }
            }
            return null;
        }

        // あるレイヤのランダムな場所を取得
        public getRandomPoint(layer: Common.Layer): Common.Coord {
            var currentFreeCells: Array<Cell> = [];
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var cell: Cell = this.map[y][x];
                    if (cell.isNull(layer) && cell.isRoom()) {
                        currentFreeCells.push(cell);
                    }
                }
            }
            var index = Math.floor(ROT.RNG.getUniform() * currentFreeCells.length);
            return currentFreeCells[index].coord;
        }

        // あるレイヤの[オブジェクトタイプ,オブジェクトID]を取得
        public getCell(x: number, y: number): Cell {
            return this.map[y][x];
        }

        // あるレイヤの[オブジェクトタイプ,オブジェクトID]を取得
        public getObject(coord: Common.Coord, layer: Common.Layer): Common.IObject {
            return this.map[coord.y][coord.x].objects[layer];
        }
    }
}