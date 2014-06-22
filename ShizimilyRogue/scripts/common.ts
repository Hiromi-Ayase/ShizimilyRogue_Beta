module ShizimilyRogue.Common {
    export var DEBUG = false;
    export var PLAYER_ID = 0;
    export var NULL_ID = -1;

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
        Move, Attack, Use, Input, Throw, // 能動的アクション
        Die, Recieve, HpChange, Swap, Blown,// 受動的アクション
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
        private _layer: number;
        private _x: number;
        private _y: number;

        get layer(): number { return this._layer; }
        get x(): number { return this._x; }
        get y(): number { return this._y; }
        get place(): number[] { return [this._x, this._y]; } 

        constructor(x: number, y: number, layer: number) {
            this._x = x;
            this._y = y;
            this._layer = layer;
        }
    }
    
    export class Action {
        obj: IObject;
        dir: DIR; 
        type: ActionType;
        target1: IObject[];
        target2: IObject[];
        amount: number;

        constructor(obj: IObject, type: ActionType, dir?: DIR) {
            this.obj = obj;
            this.type = type;
            this.dir = dir;
        }
    }

    export interface IObject {
        id: number;
        type: DungeonObjectType;
        coord: Coord;
    }

    export interface IUnit extends IObject {
        unitId: number;
        dir: number;
        speed: Speed;
        state: DungeonUnitState;
        name: string;
        phase: (fov: Common.IFOVData) => Common.Action;
        event: (results: Common.Action[]) => void;
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

    export interface IItem extends IObject {
        name: string;
        num: number;
        itemId: number;
    }

    export interface IFOVData {
        me: IUnit;
        area: number[][];
        movable: boolean[];
        getObject(place: number[], Layer: Layer): IObject;
        units: IUnit[];
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

