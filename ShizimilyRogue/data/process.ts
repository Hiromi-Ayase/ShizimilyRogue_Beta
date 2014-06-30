module ShizimilyRogue.Model {
    export class Process {
        public static process(dungeonManager: DungeonManager, object: Common.IObject, action: Common.Action): Result {
            var result: Result = null;
            var getMap = dungeonManager.getMap();
            if (action.type == Common.ActionType.Move) {
                var dir = action.params[0];
                var dst = Process.getDst(object, dir);
                if (dungeonManager.moveObject(object, dir)) {
                    result = new Result(object, action, [object]);
                }
            } else if (action.type == Common.ActionType.Attack) {
                var dir = action.params[0];
                var dst = Process.getDst(object, dir);
                var target = getMap(dst.x, dst.y)[Common.Layer.Unit];
                if (target.type == Common.DungeonObjectType.Unit) {
                    result = new Result(object, action, [target]);
                }
            } else if (action.type == Common.ActionType.Pick) {
                var item = getMap(object.coord.x, object.coord.y)[Common.Layer.Ground];
                if (item.type == Common.DungeonObjectType.Item) {
                    dungeonManager.removeObject(item);
                    result = new Result(object, action, [object]);
                }
            } else if (action.type == Common.ActionType.Damage) {
                result = new Result(object, action, [object]);
            } else if (action.type == Common.ActionType.Die) {
                dungeonManager.removeObject(object);
                result = new Result(object, action, []);
            } else if (action.type == Common.ActionType.Use) {

            }
            return result;
        }

        private static getDir(myCoord: Common.Coord, yourCoord: Common.Coord): number {
            var diffX = yourCoord.x - myCoord.x;
            var diffY = yourCoord.y - myCoord.y;
            if (diffX == 0 && diffY > 0) {
                return Common.DIR.DOWN;
            } else if (diffX == 0 && diffY < 0) {
                return Common.DIR.UP;
            } else if (diffX > 0 && diffY == 0) {
                return Common.DIR.RIGHT;
            } else if (diffX < 0 && diffY == 0) {
                return Common.DIR.LEFT;
            }
            return null;
        }

        private static getDst(obj: Common.IObject, dir: number): Common.Coord {
            var x = obj.coord.x + ROT.DIRS[8][dir][0];
            var y = obj.coord.y + ROT.DIRS[8][dir][1];
            return new Common.Coord(x, y);
        }
    }
}
