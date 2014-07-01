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
        use: (unit: Common.IObject, command: number, items: Common.IItem[]) => Common.Action;
    }

    export class Sweet extends Item {
        constructor() {
            super(Common.ItemType.Food, "スイーツ");
        }

        public use = (unit: Common.IObject, command: number, items: Common.IItem[]) => {
            var action = new Common.Action(Common.ActionType.Heal, [100]);
            return action;
        }
    }
}
