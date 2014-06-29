module ShizimilyRogue.Common {
    export var DEBUG = false;
    export var PLAYER_ID = 0;
    export var NULL_ID = -1;

    // ダメージ計算式
    export var Damage = (atk: number, def: number) => {
        var damage = Math.floor(1 + atk * (0.875 + ROT.RNG.getUniform() * 0.25) - def);
        return damage < 0 ? 1 : damage;
    };
    
        // igu--
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

    export enum DungeonObjectType {
        Null, Wall, Path, Room, Unit, Item
    }

    export enum ActionType {
        Move, Attack, Use, Input, Throw, Pick, // 能動的アクション
        Die, Recieve, Damage, Heal, Swap, Blown,// 受動的アクション
        AddObject, None
    }

    export enum DungeonUnitState {
        Normal
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
        constructor(
            public type: Common.ActionType,
            public params?: number[],
            public objects?: IObject[]) { }

        static Move(dir: number): Common.Action {
            return new Action(ActionType.Move, [dir]);
        }

        static Attack(dir: number): Common.Action {
            return new Action(ActionType.Attack, [dir]);
        }

        static Damage(amount: number): Common.Action {
            return new Action(ActionType.Move, [amount]);
        }

        static Die(): Common.Action {
            return new Action(ActionType.Die, []);
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
    }

    export interface IUnit extends IObject {
        lv: number;
        hp: number;
        maxHp: number;
        atk: number;
        def: number;

        dir: number;
        speed: Speed;
        state: DungeonUnitState;
        name: string;
    }

    export interface IPlayer extends IUnit {
        currentExp: number;
        stomach: number;
        maxStomach: number;
        inventory: IItem[];
    }

    export interface IItem extends IObject {
        name: string;
        num: number;
    }

    export interface IFOVData {
        me: IUnit;
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

