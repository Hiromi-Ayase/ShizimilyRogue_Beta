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

        lastDir = 0;
        public phase(fov: Common.IFOVData): Common.Action {
            // 移動AI
            var dir: number = null;
            var enter: number[][] = [];
            var player: number[] = null;
            var me: number[] = fov.coord.place;
            var inRoom = fov.getObject(me, Common.Layer.Floor).type == Common.DungeonObjectType.Room;

            for (var i = 0; i < fov.area.length; i++) {
                var place = fov.area[i];
                if (fov.getObject(place, Common.Layer.Unit).id == Common.PLAYER_ID) {
                    player = place;
                } else if (fov.getObject(place, Common.Layer.Floor).type == Common.DungeonObjectType.Path) {
                    enter.push(place);
                }
            }
            dir = Math.floor(fov.movable.length * ROT.RNG.getUniform());
            return new Common.MoveAction(fov.movable[dir]);
        }

        private static getDir(me:number[], target:number[], movable: number[]): number {
            return 1;
        }
    }

    export class Ignore extends Enemy {
        name = "Ignore";
    }
}
