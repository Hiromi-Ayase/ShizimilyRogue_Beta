module ShizimilyRogue.Common {
    export class Debug {
        static DirString = ["UP", "UP_RIGHT", "RIGHT", "DOWN_RIGHT", "DOWN", "DOWN_LEFT", "LEFT", "UP_LEFT"];
        static ActionString = ["Attack", "Use", "Throw", "Pick", "Place", "Die", "Status", "Fly", "Move", "Delete", "Swap", "Appear", "Set", "Fail", "None"];

        static textarea: HTMLInputElement = null;
        static result(action: Action): void {
            var targetList = "";
            var from = action.lastAction != null ? (" from " + action.lastAction.id) : "";
            action.targetObjects.forEach(target => targetList += Debug.obj(target) + " ")

            var message = "[" + action.id + from + "] "
                + Debug.obj(action.sender)
                + Debug.action(action)
                + "to:" + targetList
                + "";
            Debug.message(message);
        }

        private static obj(object: IObject): string {
            if (object == null) {
                return "(null)";
            } else {
                var turn = object.isUnit() ? (" turn:" + (<Common.IUnit>object).turn) : "";
                var coord = object.coord != null ? (" Coord:[" + object.coord.x + ", " + object.coord.y + "]") : "";
                return object.name + "(id:" + object.id + turn + " dir:" + Debug.DirString[object.dir] + coord + ") ";
            }
        }

        private static action(action: Action): string {
            var items = " items:[";
            if (action.targetItems != null) {
                action.targetItems.forEach(item => items += Debug.obj(item));
                items += "]";
            } else {
                items = "";
            }
            return Debug.ActionString[action.type] + "(sub:" + action.subType + " param:" + action.param + " end:" + action.end + items + ") "
        }

        static message(m: string): void {
            if (DEBUG) {
                if (Debug.textarea == null) {
                    Debug.textarea = (<HTMLInputElement>document.getElementById("debug"));
                    Debug.textarea.value = "";
                }
                Debug.textarea.value = m + "\n" + Debug.textarea.value;
            }
        }
        static clear(): void {
            Debug.textarea.value = "";
        }
    }
}