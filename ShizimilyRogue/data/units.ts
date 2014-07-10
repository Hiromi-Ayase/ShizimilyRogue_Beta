module ShizimilyRogue.Model.Data {

    export class UnitData implements IUnitData {
        type: DataType = DataType.Unit;
        category: number = 0;
        dir: Common.DIR = 0;
        lv: number = 1;
        state: Common.DungeonUnitState = Common.DungeonUnitState.Normal;
        maxHp: number = 100;
        atk: number = 100;
        def: number = 100;
        hp: number = this.maxHp;
        speed: Common.Speed = Common.Speed.NORMAL;
        turn: number = 0;
        inventory: Common.IItem[] = [];
        maxInventory = 10;
        currentExp: number = 0;
        stomach: number = 100;
        maxStomach: number = 100;

        phase(fov: Common.IFOVData): Common.Action[] {
            return [];
        }

        event(me: UnitController, action: Common.Action): Common.Action[] {
            if (action.isAttack()) {
                if (action.sender.isUnit()) {
                    var attacker = <Common.IUnit>action.sender;
                    var damage = Common.Damage(action.param, this.def);
                    return [Common.Action.Status(me.object, Common.StatusActionType.Damage, damage)];
                }
            } else if (action.isFly()) {
                if (action.sender.isItem()) {
                    return [Common.Action.Use(<Common.IItem>action.sender)];
                }
            } else if (action.isStatus()) {
                return this.statusChange(action);
            } else if (action.isDie()) {
                var action = Common.Action.Delete(me.object);
                if (action.sender.isPlayer()) {
                    action.end = Common.EndState.GameOver;
                }
                return [action];
            }
            return [];
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
        }
    }

    export class PlayerData extends UnitData {
        atk = 10;
        event(me: UnitController, action: Common.Action): Common.Action[] {
            var ret = super.event(me, action);
            if (action.isMove()) {
                if (me.cell.isItem()) {
                    return [Common.Action.Pick()];
                }
            }
            return ret;
        }

        phase(fov: Common.IFOVData): Common.Action[] {
            if (this.turn % Common.Parameter.StomachDecrease == 0) {

            }
            return [];
        }

        constructor(public name: string) {
            super(name);
            this.maxHp = 10000;
            this.hp = 10000;
        }
    }


    export class Enemy extends UnitData implements IEnemyData {
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
        public phase(fov: Common.IFOVData): Common.Action[] {
            var me = fov.me.coord;
            var player:Common.Coord = null;
            var action: Common.Action = null;
            for (var i = 0; i < fov.objects.length; i++) {
                if (fov.objects[i].isPlayer()) {
                    player = fov.objects[i].coord;
                    break;
                }
            }

            if (player != null) {
                // 視界内にプレイヤーがいた
                if (fov.isAttackable(Common.PLAYER_ID)) {
                    this.dir = Enemy.getAttackDir(fov.me.coord, player);
                    action = Common.Action.Attack(this.atk);
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

        public event(me: UnitController, action: Common.Action): Common.Action[] {
            var ret = super.event(me, action);
            var fov = me.getFOV();
            fov.objects.forEach(obj => {
                if (obj.isPlayer()) {
                    this.lastPlayer = obj.coord;
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

    export class Ignore extends Enemy {
        category = 1;
        constructor() {
            super("いぐー");
        }
    }
}
