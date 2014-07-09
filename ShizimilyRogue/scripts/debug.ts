module ShizimilyRogue.Common {
    export class Debug {
        static DirString = ["UP", "UP_RIGHT", "RIGHT", "DOWN_RIGHT", "DOWN", "DOWN_LEFT", "LEFT", "UP_LEFT"];
        static ActionString = ["Attack", "Use", "Throw", "Pick", "Place", "Die", "Status", "Fly", "Move", "Delete", "Swap", "Appear", "Set", "Fail", "None"];

        static textarea: HTMLInputElement = null;
        static result(result: IResult): void {
            var targetList = "";
            var from = result.action.resultId >= 0 ? (" from " + result.action.resultId) : "";
            result.targets.forEach(target => targetList += Debug.obj(target) + " ")

            var message = "[" + result.id + from + "] "
                + Debug.obj(result.object)
                + Debug.action(result.action)
                + "to:" + targetList
                + "";
            Debug.message(message);
        }

        private static obj(object: IObject): string {
            if (object == null)
                return "(null)";
            else
                return object.name + "(id:" + object.id + " dir:" + Debug.DirString[object.dir] + " [" + object.coord.x + ", " + object.coord.y + "]) "
        }

        private static action(action: Action): string {
            var items = " items:[";
            if (action.targetItems != null) {
                action.targetItems.forEach(item => items += Debug.obj(item));
                items += "]";
            } else {
                items = "";
            }
            var target = action.targetObject != null ? " target:" + Debug.obj(action.targetObject) : "";
            return Debug.ActionString[action.type] + "(sub:" + action.subType + " param:" + action.param + " end:" + action.end + items + target + ") "
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