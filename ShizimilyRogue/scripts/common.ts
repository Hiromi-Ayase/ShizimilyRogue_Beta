module ShizimilyRogue.Common {
    export var DEBUG = false;
    export var PLAYER_ID = 0;
    export var NULL_ID = -1;

    // 投げられる距離
    export var THROW_DISTANCE = 5;

    // ダメージ計算式
    export var Damage = (atk: number, def: number) => {
        var damage = Math.floor(1 + atk * (0.875 + ROT.RNG.getUniform() * 1.20) - def);
        return damage < 0 ? 1 : damage;
    };
    
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
        Food, CPU
    }

    export enum DungeonObjectType {
        Null, Wall, Path, Room, Unit, Item
    }

    export enum ActionType {
        Move, Attack, Use, Throw, Pick, // 能動的アクション
        Die, Damage, Heal, Swap, Blown, Fly, // 受動的アクション
        None
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

    export enum Target {
         Me, Next, Line, Item
    }

    export class Action {
        end: EndState = EndState.None;

        constructor(
            public type: Common.ActionType,
            public target: Target,
            public params: number[] = [],
            public objects: IObject[]= [],
            public coords: Common.Coord[] = []) { }

        static Move(): Common.Action {
            return new Action(ActionType.Move, Target.Me);
        }

        static Attack(atk: number): Common.Action {
            return new Action(ActionType.Attack, Target.Next, [atk]);
        }

        static Damage(amount: number): Common.Action {
            return new Action(ActionType.Damage, Target.Me, [amount]);
        }

        static Heal(amount: number): Common.Action {
            return new Action(ActionType.Heal, Target.Me, [amount]);
        }

        static Die(): Common.Action {
            return new Action(ActionType.Die, Target.Me, []);
        }

        static Use(item: IItem): Common.Action {
            return new Action(ActionType.Use, Target.Me, [], [item]);
        }

        static Throw(item: IItem): Common.Action {
            return new Action(ActionType.Throw, Target.Me, [], [item]);
        }

        static Fly(item: IItem, dir: Common.DIR, src: Common.Coord): Common.Action {
            return new Action(ActionType.Fly, Target.Line, [dir], [item], [src]);
        }

        static Pick(item: IItem): Common.Action {
            return new Action(ActionType.Pick, Target.Me, [], [item]);
        }
    }

    export interface IResult {
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
        state: DungeonUnitState;
        setDir(dir: number): void;
    }

    export interface IItem extends IObject {
        num: number;
        commands: Common.ActionType[];
        use(action: Action): Action;
    }

    export interface IFOVData {
        me: IObject;
        area: Coord[];
        movable: boolean[];
        getCell(coord: Coord): ICell;
        getCellByCoord(x: number, y: number): ICell;
        objects: IObject[];
        isVisible(object: Common.IObject): boolean;
        attackable: { [id: number]: boolean };
        width: number;
        height: number;
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

