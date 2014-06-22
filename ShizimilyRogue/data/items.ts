﻿module ShizimilyRogue.Model.Data {
    export class Item implements IItemData {
        constructor(
            public targetType: TargetType,
            public itemId: number,
            public name: string,
            public num: number) {
        }
        use: (unit: Common.IObject[]) => Common.Action[];
    }

    export class Sweet extends Item {
        constructor() {
            super(TargetType.Me, 0, "スイーツ", 1);
        }

        use = (objects: Common.IObject[]): Common.Action[] => {
            var actions: Common.Action[] = [];
            objects.forEach(obj => {
                var action = new Common.Action(obj, Common.ActionType.HpChange);
                action.amount = 100;
                actions.push(action);
            });
            return actions;
        }
    }
}