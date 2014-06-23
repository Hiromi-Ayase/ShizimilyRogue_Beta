module ShizimilyRogue.Model.Data {

    export class Enemy implements IEnemyData {
        unitId = 1;
        name = null;
        speed = Common.Speed.NORMAL;
        maxHp = 100;
        atk = 100;
        def = 100;
        exp = 100;
        drop = null;
        dropProbability = 10;
        awakeProbabilityWhenAppear = 100;
        awakeProbabilityWhenEnterRoom = 100;
        awakeProbabilityWhenNeighbor = 100;

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

        private lastMe: number[] = null;
        private lastPlayer: number[] = null;
        public phase = (fov: Common.IFOVData): Common.Action => {
            var me = fov.me.coord.place;
            var player: number[] = null;
            var action: Common.Action = null;
            if (Common.PLAYER_ID in fov.objects) {
                player = fov.objects[Common.PLAYER_ID].coord.place;
            }

            if (player != null) {
                if (fov.attackable[Common.PLAYER_ID]) {
                    var dir = Enemy.getAttackDir(fov.me.coord.place, player);
                    action = new Common.Action(Common.ActionType.Attack, [dir]);
                }
            }

            if (action == null) {
                var dir = Enemy.move(me, this.lastPlayer, this.lastMe, fov);
                if (dir != null)
                    action = new Common.Action(Common.ActionType.Move, [dir]);
            }

            if (action == null) {
                this.lastPlayer = null;
                var dirs: number[] = [];
                fov.movable.map((value, index, array) => {
                    if (value) dirs.push(index);
                });
                var dir = Math.floor(dirs.length * ROT.RNG.getUniform());
                action = new Common.Action(Common.ActionType.Attack, [dir]);
            }
            this.lastPlayer = player;
            this.lastMe = me;
            return action;
        }

        public event = (results: Common.IResult[]): void => {
            this.lastPlayer = null;
            for (var i = 0; i < results.length; i++) {
                if (results[i].object.id == Common.PLAYER_ID) {
                    this.lastPlayer = results[i].object.coord.place;
                    break;
                }
            }
        }

        private static getAttackDir(src: number[], dst: number[], neighbor: boolean = true): number {
            var diffX = dst[0] - src[0];
            var diffY = dst[1] - src[1];

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
        
        private static move(me: number[], player: number[], lastMe: number[], fov: Common.IFOVData): number {
            // 移動AI
            var dir: number = null;
            var inRoom = fov.getObject(me, Common.Layer.Floor).type == Common.DungeonObjectType.Room;

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
                    var enter: number[][] = [];
                    // 出入口を探す
                    for (var i = 0; i < fov.area.length; i++) {
                        var place = fov.area[i];
                        if (fov.getObject(place, Common.Layer.Floor).type == Common.DungeonObjectType.Path) {
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

        private static getDir(me: number[], target: number[], movable: boolean[]): number {
            var vecX = target[0] - me[0];
            var vecY = target[1] - me[1];

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
        name = "Ignore";
    }
}
