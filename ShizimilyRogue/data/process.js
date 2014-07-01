var ShizimilyRogue;
(function (ShizimilyRogue) {
    (function (Model) {
        var Process = (function () {
            function Process() {
            }
            Process.end = function () {
            };

            Process.process = function (dungeonManager, object, action) {
                var result = null;

                /*
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
                result = new Result(object, action, [item]);
                }
                } else if (action.type == Common.ActionType.Damage) {
                result = new Result(object, action, [object]);
                } else if (action.type == Common.ActionType.Die) {
                result = new Result(object, action, []);
                if (object.id == Common.PLAYER_ID) {
                result.action.end = Common.EndState.GameOver;
                } else {
                dungeonManager.removeObject(object);
                }
                } else if (action.type == Common.ActionType.Use) {
                result = new Result(object, action, [object]);
                }
                */
                return result;
            };

            Process.getDir = function (myCoord, yourCoord) {
                var diffX = yourCoord.x - myCoord.x;
                var diffY = yourCoord.y - myCoord.y;
                if (diffX == 0 && diffY > 0) {
                    return 4 /* DOWN */;
                } else if (diffX == 0 && diffY < 0) {
                    return 0 /* UP */;
                } else if (diffX > 0 && diffY == 0) {
                    return 2 /* RIGHT */;
                } else if (diffX < 0 && diffY == 0) {
                    return 6 /* LEFT */;
                }
                return null;
            };

            Process.getDst = function (obj, dir) {
                var x = obj.coord.x + ROT.DIRS[8][dir][0];
                var y = obj.coord.y + ROT.DIRS[8][dir][1];
                return new ShizimilyRogue.Common.Coord(x, y);
            };
            return Process;
        })();
        Model.Process = Process;
    })(ShizimilyRogue.Model || (ShizimilyRogue.Model = {}));
    var Model = ShizimilyRogue.Model;
})(ShizimilyRogue || (ShizimilyRogue = {}));
//# sourceMappingURL=process.js.map
