module ShizimilyRogue.Common {
    export var DEBUG = true;
    export var PLAYER_ID = 0;
    export var NULL_ID = -1;

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
        Move, Attack, Use, Input, Throw, Pick, // 能動的アクション
        Die, Recieve, Damage, Heal, Swap, Blown,// 受動的アクション
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
         Me, Next, Line
    }

    export class Action {
        end: EndState = EndState.None;

        constructor(
            public type: Common.ActionType,
            public target: Target,
            public params: number[]= [],
            public objects: IObject[]= []) { }

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

        static Pick(item: IItem): Common.Action {
            return new Action(ActionType.Pick, Target.Me, [], [item]);
        }
    }

    export interface IResult {
        object: IObject;
        action: Action;
        targets: IObject[];
    }

    export interface IObject {
        id: number;
        type: DungeonObjectType;
        category: number;
        coord: Coord;
        layer: Layer;
        corner: boolean;
        dir: DIR;
    }

    export interface IUnit extends IObject {
        inventory: IItem[];

        state: DungeonUnitState;
        name: string;
    }

    export interface IPlayer extends IUnit {
        hp: number;
        maxHp: number;
        atk: number;
        def: number;
        lv: number;
        turn: number;

        currentExp: number;
        stomach: number;
        maxStomach: number;
        setDir(dir: number);
    }

    export interface IItem extends IObject {
        name: string;
        num: number;
        commands: Common.ActionType[];
        use(action: Action): Action;
    }

    export interface IFOVData {
        me: IObject;
        area: Coord[];
        movable: boolean[];
        getObject(coord: Coord): IObject[];
        objects: IObject[];
        attackable: { [id: number]: boolean };
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

