module ShizimilyRogue.Model.Data {
    export class Item implements IItemData {
        public commands: Common.ActionType[] = [
            Common.ActionType.Use,
            Common.ActionType.Throw,
        ];

        constructor(
            public category: number,
            public name: string,
            public num: number = 1) {
        }
        use(action: Common.Action): Common.Action {
            return null;
        }
    }

    export class Sweet extends Item {
        constructor() {
            super(Common.ItemType.Food, "スイーツ");
        }

        use(action: Common.Action): Common.Action {
            var action = Common.Action.Heal(100);
            return action;
        }
    }
}
