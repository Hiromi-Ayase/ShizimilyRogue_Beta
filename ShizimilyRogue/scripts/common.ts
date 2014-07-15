module ShizimilyRogue.Common {
    /** デバッグモード切り替え */
    export var DEBUG = false;

    /** プレイヤーのID */
    export var PLAYER_ID = 0;

    /** 各種パラメタ */
    export var Parameter = {
        /** 投げられる最大距離 */
        ThrowDistance: 10,
        /** 何ターンに1お腹がへるか */
        StomachDecrease: 10,
    };

    /** コンフィグ */
    export var Config = {
        /** メニューオープン時のキーロック開放処理フレーム数 */
        KEY_LOCK_RELEASE: 10,
        /** メッセージの表示スピード */
        MESSAGE_SPEED: 0.3,
        /** メッセージの自動非表示時間 */
        MESSAGE_FADEOUT: 5,
    };

    /** ドロップ位置の優先順位 */
    export var Drop: number[][] = [
        [0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1],
        [2, 0], [0, 2], [-2, 0], [0, -2], [2, 1], [1, 2], [-2, 1], [1, -2], [-1, 2], [2, -1], [-1, -2], [-2, -1],
        [2, 2], [2, -2], [-2, 2], [-2, -2]
    ];

    /** ダメージ計算式 */
    export var Damage = (atk: number, def: number) => {
        var damage = Math.floor(1 + atk * (0.875 + ROT.RNG.getUniform() * 1.20) - def);
        return damage < 0 ? 1 : damage;
    };

    /** お腹すいた時のダメージ量 */
    export var HungerDamage = (maxHp: number) => Math.floor(maxHp * 0.1);

    /** レイヤー */
    export enum Layer {
        Floor, Ground, Unit, Flying, Effect, MAX
    }

    /** 方向 */
    export enum DIR {
        UP, UP_RIGHT, RIGHT, DOWN_RIGHT, DOWN, DOWN_LEFT, LEFT, UP_LEFT
    }

    /** アイテム種別 */
    export enum ItemType {
        CPU, GraphicBoard, HDD, Memory, Sweet, DVD, Case, Application
    }

    /** ダンジョンのオブジェクトのタイプ */
    export enum DungeonObjectType {
        Null, Wall, Path, Room, Unit, Item
    }

    /** Actionの通知範囲 */
    export enum Target {
        Me, Next, Line, FarLine, Target, Item, System, Ground, Unit
    }

    /** Actionの種別 */
    export enum ActionType {
        Attack, Use, Throw, Pick, Place, Die, Status, Fly, Move, Delete, Swap, Drop, Set, Fail, None
    }

    /** ステータス変更Action種別 */
    export enum StatusActionType {
        Damage, Heal, Hunger, Full
    }

    /** 失敗Action種別 */
    export enum FailActionType {
        CaseOver
    }

    /** ユニットの状態 */
    export enum DungeonUnitState {
        Normal
    }

    /** ユニットの状態 */
    export enum ItemState {
        Normal
    }

    /** 終了ステータス */
    export enum EndState {
        None, Clear, Up, GameOver
    }

    /** ユニットのスピード */
    export enum Speed {
        NORMAL = 100,
        DOUBLE = 200,
        TRIPLE = 300,
    }

    /** 座標 */
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

    /**
     * アクション
     */
    export class Action {
        private static currentId = 1;

        /** アクションID */
        id: number;
        /** 終了ステータス None以外の場合終了 */
        end: EndState = EndState.None;
        /** 数値パラメタ */
        param: number = 0;
        /** アイテムパラメタ */
        targetItems: IItem[] = [];
        /** 座標パラメタ */
        coord: Common.Coord = null;
        /** サブタイプ */
        subType: number = 0;
        /** アイテム */
        item: IItem = null;
        /** Actionの送信先 targetTypeがTarget以外の時は自動設定される */
        targets: IObject[] = [];
        /** このアクションを起こす契機になったアクション */
        lastAction: Common.Action = null;
        /** このアクションの呼び出し元 自動設定される */
        sender: Common.IObject = null;
        /** 現在のターゲット番号 */
        targetIndex = -1;

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
        isDrop(): boolean { return this.type == ActionType.Drop; }
        isNone(): boolean { return this.type == ActionType.None; }
        isSet(): boolean { return this.type == ActionType.Set; }
        isSystem(): boolean { return this.targetType == Target.System; }

        /**
         * @return {Common.IObject} 現在のターゲット
         */
        get target(): Common.IObject {
            return this.targets[this.targetIndex];
        }

        /**
         * @constructor
         */
        constructor(
            public type: ActionType,
            public targetType: Target) {
            this.id = Action.currentId++;
        }

        /**
         * 移動アクション
         * <ul>
         * <li>現在の方向に向かって移動する
         * <li>システムアクション
         * </ul>
         * @return {Common.Action} アクション
         */
        static Move(): Common.Action {
            return new Action(ActionType.Move, Target.System);
        }

        /**
         * 攻撃アクション
         * <ul>
         * <li>現在の方向に向かって指定した攻撃力で攻撃
         * <li>隣接アクション
         * </ul>
         * @param {number} atk 攻撃力 paramに格納
         * @return {Common.Action} アクション
         */
        static Attack(atk: number): Common.Action {
            var action = new Action(ActionType.Attack, Target.Next);
            action.param = atk;
            return action;
        }

        /**
         * ステータス変更アクション
         * <ul>
         * <li>指定したステータスを変更
         * <li>ターゲット指定アクション
         * </ul>
         * @param {Common.IObject} target 変更対象 targetsに格納
         * @param {StatusActionType} type 変更するステータス subTypeに格納
         * @param {number} amount 変化量 paramに格納
         * @return {Common.Action} アクション
         */
        static Status(target: Common.IObject, type: StatusActionType, amount: number): Action {
            var action = new Action(ActionType.Status, Target.Target);
            action.targets = [target];
            action.subType = type;
            action.param = amount;
            return action;
        }

        /**
         * 死亡アクション
         * <ul>
         * <li>自分アクション
         * </ul>
         * @return {Common.Action} アクション
         */
        static Die(): Action {
            var action = new Action(ActionType.Die, Target.Me);
            return action;
        }

        /**
         * アイテム使用アクション
         * <ul>
         * <li>アイテムアクション
         * </ul>
         * @param {IItem} item 使用するアイテム itemに格納
         * @param {IItem[]} targetItems 合成等のアイテム(Default:[]) targetItemsに格納
         * @return {Common.Action} アクション
         */
        static Use(item: IItem, targetItems: IItem[] = []): Action {
            var action = new Action(ActionType.Use, Target.Item);
            action.item = item;
            action.targetItems = targetItems;
            return action;
        }

        /**
         * 投げるアクション
         * <ul>
         * <li>アイテムアクション
         * </ul>
         * @param {IItem} item 使用するアイテム itemに格納
         * @return {Common.Action} アクション
         */
        static Throw(item: IItem): Action {
            var action = new Action(ActionType.Throw, Target.Item);
            action.item = item;
            return action;
        }

        /**
         * 飛ぶアクション
         * <ul>
         * <li>ライン上アクション
         * </ul>
         * @param {Common.Coord} src 初期地点 coordに格納
         * @return {Common.Action} アクション
         */
        static Fly(src: Common.Coord): Action {
            var action = new Action(ActionType.Fly, Target.Line);
            action.coord = src;
            return action;
        }

        /**
         * 拾うアクション
         * <ul>
         * <li>Groundレイヤアクション
         * </ul>
         * @return {Common.Action} アクション
         */
        static Pick(): Action {
            var action = new Action(ActionType.Pick, Target.Ground);
            return action;
        }

        /**
         * オブジェクトの削除アクション
         * <ul>
         * <li>システムアクション
         * </ul>
         * @param {IObject} target 削除対象 targetsに格納
         * @return {Common.Action} アクション
         */
        static Delete(target: IObject): Common.Action {
            var action = new Action(ActionType.Delete, Target.System);
            action.targets = [target];
            return action;
        }

        /**
         * オブジェクトのドロップアクション
         * <ul>
         * <li>システムアクション
         * </ul>
         * @param {IObject} target ドロップするオブジェクト targetsに格納
         * @param {Common.Coord} coord ドロップ地点 coordに格納
         * @return {Common.Action} アクション
         */
        static Drop(target: IObject, coord: Coord): Common.Action {
            var action = new Action(ActionType.Drop, Target.System);
            action.targets = [target];
            action.coord = coord;
            return action;
        }

        /**
         * オブジェクトをセットするアクション
         * <ul>
         * <li>システムアクション
         * </ul>
         * @param {IObject} target セット対象 targetsに格納
         * @param {Common.Coord} coord セット地点 coordに格納
         * @return {Common.Action} アクション
         */
        static Set(target: IObject, coord: Coord): Common.Action {
            var action = new Action(ActionType.Set, Target.System);
            action.targets = [target];
            action.coord = coord;
            return action;
        }

        /**
         * アイテムを置くアクション
         * <ul>
         * <li>アイテムアクション
         * </ul>
         * @param {IItem} item 置くアイテム itemに格納
         * @return {Common.Action} アクション
         */
        static Place(item: IItem): Action {
            var action = new Action(ActionType.Place, Target.Item);
            action.item = item;
            return action;
        }

        /**
         * 場所の交換アクション
         * <ul>
         * <li>システムアクション
         * </ul>
         * @param {IObject} target0 交換対象1 targetsに格納
         * @param {IObject} target1 交換対象2 targetsに格納
         * @return {Common.Action} アクション
         */
        static Swap(target0: IObject, target1: IObject): Action {
            var action = new Action(ActionType.Swap, Target.System);
            action.targets = [target0, target1];
            return action;
        }

        /**
         * 何もしないアクション
         * <ul>
         * <li>自分アクション
         * </ul>
         * @return {Common.Action} アクション
         */
        static None(): Action {
            return new Action(ActionType.None, Target.Me);
        }

        /**
         * 失敗アクション
         * <ul>
         * <li>アイテムアクション
         * </ul>
         * @param {Common.FailActionType} type 失敗タイプ subTypeに格納
         * @return {Common.Action} アクション
         */
        static Fail(type: Common.FailActionType): Action {
            var action = new Action(ActionType.Fail, Target.System);
            action.subType = type;
            return action;
        }
    }

    /**
     * 各座標の情報
     */
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

    /**
     * マップオブジェクトインターフェース
     */
    export interface IObject {
        id: number;
        category: number;
        cell: ICell;
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

    /**
     * ユニットオブジェクトインターフェース
     */
    export interface IUnit extends IObject {
        weapon: Common.IItem;
        guard: Common.IItem;
        arrow: Common.IItem;
        accessory: Common.IItem;

        getSpeed(): number;

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

    /**
     * アイテムオブジェクトインターフェース
     */
    export interface IItem extends IObject {
        status: ItemState;
        unknownName: string;
        num: number;
        innerItems: IItem[];
        commands(): string[];
        select(n: number, items?: Common.IItem[]): Common.Action;
    }

    /**
     * 視界情報インターフェース
     */
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
    /**
     * ゲームの開始
     */
    export function start() {
        window.onload = function (e) {
            window.focus();
            var game = new ShizimilyRogue.Controller.Game();
            game.start();
        };
    }
}

