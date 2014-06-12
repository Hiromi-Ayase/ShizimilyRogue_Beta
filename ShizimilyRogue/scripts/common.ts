module ShizimilyRogue.Common {
    export var PLAYER_ID = 0;

    export enum DungeonObjectType {
        Null, Wall, Path, Room, Player, Enemy
    }

    // 4:Effect レイヤ  
    // 3:Flying レイヤ Flying Player
    // 2:Unit レイヤ  Player Mob
    // 1:Ground レイヤ  ITEM ENTRANCE
    // 0:Floor レイヤ   PATH ROOM ITEM ENTERANCE 
    export enum Layer {
        Floor, Ground, Unit, Flying, Effect
    }

    export enum DIR {
        UP, UP_RIGHT, RIGHT, DOWN_RIGHT, DOWN, DOWN_LEFT, LEFT, UP_LEFT
    }

    export enum ActionType {
        Move, Attack, Use, Throw
    }

    export enum ResultType {
        Move, Attack, Use, Input, Throw, Damage, Die, Recieve, None
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
        private _layer: number;
        private _x: number;
        private _y: number;
        private _index: number;

        get layer(): number { return this._layer; }
        get x(): number { return this._x; }
        get y(): number { return this._y; }
        get index(): number { return this._index; }

        constructor(x: number, y: number, layer: number, index: number) {
            this._x = x;
            this._y = y;
            this._layer = layer;
            this._index = index;
        }
    }
    
    export class Action {
        dir: DIR;
        type: ActionType;
        item1: IItem;
        item2: IItem;

        constructor(type: ActionType, dir: DIR) {
            this.type = type;
            this.dir = dir;
        }
    }

    export class MoveAction extends Action {
        constructor(dir: number) {
            super(ActionType.Move, dir);
        }
    }
    
    export class AttackAction extends Action {
        constructor(dir: number) {
            super(ActionType.Attack, dir);
        }
    }

    export class UseAction extends Action {
        constructor(dir: number, item1: IItem, item2: IItem = null) {
            super(ActionType.Use, dir);
            this.item1 = item1;
            this.item2 = item2;
        }
    }

    export class ThrowAction extends Action {
        constructor(dir: number, item: IItem) {
            super(ActionType.Throw, dir);
            this.item1 = item;
        }
    }

    export class Result {
        id: number;
        dir: DIR; 
        type: ResultType;
        item1: IItem;
        item2: IItem;
        amount: number;

        constructor(id: number, type: ResultType, dir: DIR) {
            this.id = id;
            this.type = type;
            this.dir = dir;
        }

        static fromAction(id: number, action: Action, amount: number = null ): Result {
            var type: ResultType;
            switch (action.type) {
                case ActionType.Attack:
                    type = ResultType.Attack;
                    break;
                case ActionType.Move:
                    type = ResultType.Move;
                    break;
                case ActionType.Use:
                    type = ResultType.Use;
                    break;
                case ActionType.Throw:
                    type = ResultType.Throw;
                    break;
            }
            var result = new Result(id, type, action.dir);
            result.item1 = action.item1;
            result.item2 = action.item2;
            result.amount = amount;
            return result;
        }
    }

    export interface IUnit {
        id: number;
        dir: number;
        speed: Speed;
        state: DungeonUnitState;
        name: string;
        type: DungeonObjectType;
        coord: Coord;
    }

    export interface IPlayer extends IUnit {
        lv: number;
        hp: number;
        maxHp: number;
        atk: number;
        def: number;

        currentExp: number;
        stomach: number;
        maxStomach: number;
        inventory: IItem[];
    }

    export interface IItem {
        id: number;
        name: string;
        num: number;
    }

    export interface IEnemyData {
        name: string;
        speed: Common.Speed;
        maxHp: number;
        atk: number;
        def: number;
        exp: number;
        drop: IItem;
        dropProbability: number;
        awakeProbabilityWhenAppear: number;
        awakeProbabilityWhenEnterRoom: number;
        awakeProbabilityWhenNeighbor: number
    }
}

module ShizimilyRogue {
    export function start() {
        window.onload = function (e) {
            var game = new ShizimilyRogue.Controller.Game();
            game.start();
        };
    }
}

