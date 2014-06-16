module ShizimilyRogue.Model.Data {

    export class Enemy implements Common.IEnemyData {
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

        static CANDIDATE = [
            [Common.DIR.UP, Common.DIR.UP_RIGHT, Common.DIR.UP_LEFT, Common.DIR.RIGHT, Common.DIR.LEFT],
            [Common.DIR.UP_RIGHT, Common.DIR.RIGHT, Common.DIR.UP, Common.DIR.DOWN_RIGHT, Common.DIR.UP_LEFT],
            [Common.DIR.RIGHT, Common.DIR.DOWN_RIGHT, Common.DIR.UP_RIGHT, Common.DIR.DOWN, Common.DIR.UP],
            [Common.DIR.DOWN_RIGHT, Common.DIR.DOWN, Common.DIR.RIGHT, Common.DIR.DOWN_LEFT, Common.DIR.UP_RIGHT],
            [Common.DIR.DOWN, Common.DIR.DOWN_LEFT, Common.DIR.DOWN_RIGHT, Common.DIR.LEFT, Common.DIR.RIGHT],
            [Common.DIR.DOWN_LEFT, Common.DIR.LEFT, Common.DIR.DOWN, Common.DIR.UP_LEFT, Common.DIR.DOWN_RIGHT],
            [Common.DIR.LEFT, Common.DIR.UP_LEFT, Common.DIR.DOWN_LEFT, Common.DIR.UP, Common.DIR.DOWN],
            [Common.DIR.UP_LEFT, Common.DIR.UP, Common.DIR.LEFT, Common.DIR.UP_RIGHT, Common.DIR.DOWN_LEFT],
        ];

        private lastDir: number = 0;
        private lastPlayer: number[];
        public phase(fov: Common.IFOVData): Common.Action {
            // 移動AI
            var dir: number = null;
            var enter: number[][] = [];
            var player: number[] = null;
            var me: number[] = fov.coord.place;
            var inRoom = fov.getObject(me, Common.Layer.Floor).type == Common.DungeonObjectType.Room;

            if (!inRoom) {
                for (var i = 0; i < fov.area.length; i++) {
                    var place = fov.area[i];
                    if (fov.getObject(place, Common.Layer.Unit).id == Common.PLAYER_ID) {
                        player = place;
                    }
                }
                if (player != null) {
                    dir = Enemy.getDir(me, player, fov.movable);
                } else if (fov.movable[this.lastDir]) {
                    dir = this.lastDir;
                }
            } else {
                // プレイヤーの位置と出入口を探す
                for (var i = 0; i < fov.area.length; i++) {
                    var place = fov.area[i];
                    if (fov.getObject(place, Common.Layer.Unit).id == Common.PLAYER_ID) {
                        player = place;
                    } else if (fov.getObject(place, Common.Layer.Floor).type == Common.DungeonObjectType.Path) {
                        enter.push(place);
                    }
                }

                if (player != null) {
                    dir = Enemy.getDir(me, player, fov.movable);
                } else if (enter.length > 0) {
                    var id = Math.floor(enter.length * ROT.RNG.getUniform());
                    dir = Enemy.getDir(me, enter[id], fov.movable);
                }
            }
            if (dir == null) {
                var dirs: number[] = [];
                fov.movable.map((value, index, array) => {
                    if (value) dirs.push(index);
                });
                dir = Math.floor(dirs.length * ROT.RNG.getUniform());
            }
            this.lastDir = dir;
            return new Common.MoveAction(dir);
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
