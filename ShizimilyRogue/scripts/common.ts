module ShizimilyRogue.Common {
    export var DEBUG = true;


    export var PLAYER_ID = 0;
    export var NULL_ID = -1;

    // 投げられる距離
    export var THROW_DISTANCE = 5;

    // ドロップ位置の優先順位
    export var Drop: number[][] = [
        [0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1],
        [2, 0], [0, 2], [-2, 0], [0, -2], [2, 1], [1, 2], [-2, 1], [1, -2], [-1, 2], [2, -1], [-1, -2], [-2, -1],
        [2, 2], [2, -2], [-2, 2], [-2, -2]
    ];

    // ダメージ計算式
    export var Damage = (atk: number, def: number) => {
        var damage = Math.floor(1 + atk * (0.875 + ROT.RNG.getUniform() * 1.20) - def);
        return damage < 0 ? 1 : damage;
    };

    // お腹すいた時のダメージ量
    export var HungerDamage = (maxHp: number) => Math.floor(maxHp * 0.1);
    
    // 4:Effect レイヤ  
    // 3:Flying レイヤ Flying Player
    // 2:Unit レイヤ  Player Mob
    // 1:Ground レイヤ  ITEM ENTRANCE
    // 0:Floor レイヤ   PATH ROOM WALL
    export enum Layer {
        Floor, Ground, Unit, Flying, Effect, MAX
    }

    export enum DIR {
        UP, UP_RIGHT, RIGHT, DOWN_RIGHT, DOWN, DOWN_LEFT, LEFT, UP_LEFT
    }

    export enum ItemType {
        CPU, GraphicBoard, HDD, Memory, Sweet, DVD, Case, Application
    }

    export enum FailType {
        CaseOver
    }

    export enum DungeonObjectType {
        Null, Wall, Path, Room, Unit, Item
    }


    export enum Target {
        Me, Next, Line, FarLine, Target, Item, Map, Ground, Unit, None
    }

    export enum ActionType {
        Attack, // 攻撃
        Use, Throw, Pick, Place, // アイテムアクション
        Die, Status, // 受動的アクション
        Fly, Move, Delete, Swap, Appear, Set, // マップアクション
        Fail, None
    }

    export enum StatusActionType {
        Damage, Heal, Hunger, Full
    }

    export enum DungeonUnitState {
        Normal
    }

    export enum EndState {
        None, Clear, Up, GameOver
    }

    export enum Speed {
        HALF = 50,
        NORMAL = 100,
        DOUBLE = 200,
        TRIPLE = 300,
    }

    //export enum ObjectType
    export class Coord {
        private _x: number;
        private _y: number;

        get x(): number { return this._x; }
        get y(): number { return this._y; }

        constructor(x: number, y: number) {
            this._x = x;
            this._y = y;
        }
    }

    export class Action {
        end: EndState = EndState.None;
        next: boolean = true;
        param: number = 0;
        subType: number = 0;
        item: IItem = null;
        targetItems: IItem[] = null;
        coord: Common.Coord = null;
        targetObject: IObject = null;
        resultId = -1;

        isAttack(): boolean { return this.type == ActionType.Attack; }
        isUse(): boolean { return this.type == ActionType.Use; }
        isThrow(): boolean { return this.type == ActionType.Throw; }
        isPick(): boolean { return this.type == ActionType.Pick; }
        isPlace(): boolean { return this.type == ActionType.Place; }
        isDie(): boolean { return this.type == ActionType.Die; }
        isStatus(): boolean { return this.type == ActionType.Status; }
        isFly(): boolean { return this.type == ActionType.Fly; }
        isMove(): boolean { return this.type == ActionType.Move; }
        isDelete(): boolean { return this.type == ActionType.Delete; }
        isSwap(): boolean { return this.type == ActionType.Swap; }
        isAppear(): boolean { return this.type == ActionType.Appear; }
        isNone(): boolean { return this.type == ActionType.None; }
        isSet(): boolean { return this.type == ActionType.Set; }

        constructor(
            public type: ActionType,
            public target: Target) { }

        static Move(): Common.Action {
            return new Action(ActionType.Move, Target.Map);
        }

        static Attack(atk: number): Common.Action {
            var action = new Action(ActionType.Attack, Target.Next);
            action.param = atk;
            return action;
        }

        static Status(target: Common.IObject, type: StatusActionType, amount: number): Action {
            var action = new Action(ActionType.Status, Target.Target);
            action.targetObject = target;
            action.subType = type;
            action.param = amount;
            return action;
        }

        static Die(): Action {
            var action = new Action(ActionType.Die, Target.Me);
            return action;
        }

        static Use(item: IItem, targetItems: IItem[] = []): Action {
            var action = new Action(ActionType.Use, Target.Item);
            action.item = item;
            action.targetItems = targetItems;
            return action;
        }

        static Throw(item: IItem): Action {
            var action = new Action(ActionType.Throw, Target.Item);
            action.item = item;
            return action;
        }

        static Fly(src: Common.Coord): Action {
            var action = new Action(ActionType.Fly, Target.Line);
            action.coord = src;
            return action;
        }

        static Pick(): Action {
            var action = new Action(ActionType.Pick, Target.Ground);
            return action;
        }

        static Delete(target: IObject): Common.Action {
            var action = new Action(ActionType.Delete, Target.Map);
            action.targetObject = target;
            return action;
        }

        static Appear(target: IObject, coord: Coord): Common.Action {
            var action = new Action(ActionType.Appear, Target.Map);
            action.targetObject = target;
            action.coord = coord;
            return action;
        }

        static Set(target: IObject, coord: Coord): Common.Action {
            var action = new Action(ActionType.Set, Target.Map);
            action.targetObject = target;
            action.coord = coord;
            return action;
        }

        static Place(item: IItem): Action {
            var action = new Action(ActionType.Place, Target.Item);
            action.item = item;
            return action;
        }

        static Swap(target: IObject, coord: Coord): Action {
            var action = new Action(ActionType.Swap, Target.Map);
            action.targetObject = target;
            action.coord = coord;
            return action;
        }

        static None(): Action {
            return new Action(ActionType.None, Target.None);
        }

        static Fail(type: number): Action {
            var action = new Action(ActionType.Fail, Target.Map);
            action.subType = type;
            return action;
        }
    }

    export interface IResult {
        id: number;
        object: IObject;
        action: Action;
        targets: IObject[];
    }

    export interface ICell {
        objects: IObject[];
        coord: Coord;

        isPlayer(): boolean;
        isItem(): boolean;
        isWall(): boolean;
        isRoom(): boolean;
        isPath(): boolean;
        isUnit(): boolean;
        isNull(layer: Common.Layer): boolean;

        unit: IUnit;
        item: IItem;

        floor: IObject;
        ground: IObject;
    }

    export interface IObject {
        id: number;
        //type: DungeonObjectType;
        category: number;
        coord: Coord;
        layer: Layer;
        dir: DIR;
        name: string;

        isPlayer(): boolean;
        isUnit(): boolean;
        isWall(): boolean;
        isRoom(): boolean;
        isPath(): boolean;
        isItem(): boolean;
        isNull(): boolean;
    }

    export interface IUnit extends IObject {
        hp: number;
        maxHp: number;
        atk: number;
        def: number;
        lv: number;
        turn: number;
        currentExp: number;
        stomach: number;
        maxStomach: number;

        inventory: IItem[];
        maxInventory: number;

        addInventory(item: Common.IItem): boolean;
        takeInventory(item: Common.IItem): boolean;

        state: DungeonUnitState;
        setDir(dir: number): void;
    }

    export interface IItem extends IObject {
        num: number;
        commands: ActionType[];
        event(result: IResult): Action;
    }

    export interface IFOVData {
        me: IObject;
        area: Coord[];
        movable: boolean[];
        getCell(coord: Coord): ICell;
        getCellByCoord(x: number, y: number): ICell;
        objects: IObject[];
        isVisible(id: number): boolean;
        isAttackable(id: number): boolean;
        width: number;
        height: number;
        getObjectById(id: number): Common.IObject;
    }

    export interface IEffect {
    }
}

module ShizimilyRogue {
    export function start() {
        window.onload = function (e) {
            window.focus();
            var game = new ShizimilyRogue.Controller.Game();
            game.start();
        };
    }
}

