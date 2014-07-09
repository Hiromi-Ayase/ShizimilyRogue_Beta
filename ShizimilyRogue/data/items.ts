module ShizimilyRogue.Model.Data {
    export class Item implements IItemData {
        type: DataType = DataType.Item;
        public commands: Common.ActionType[] = [
            Common.ActionType.Use,
            Common.ActionType.Throw,
        ];

        constructor(
            public category: number,
            public name: string,
            public num: number = 1) {
        }
        event(me: Common.IItem, result: Common.IResult): Common.Action {
            var unit = <Common.IUnit>result.object;
            if (result.action.isPick()) {
                unit.inventory.push(me);
                return Common.Action.Delete(me);
            } else if (result.action.isUse()) {
                Item.consume(unit, me);
            } else if (result.action.isThrow()) {
                Item.consume(unit, me);
                me.dir = unit.dir;
                me.coord = unit.coord;
                var action = Common.Action.Fly(unit.coord);
                return action;
            }
            return null;
        }

        private static consume(unit: Common.IUnit, item: Common.IItem) {
            for (var i = 0; i < unit.inventory.length; i++) {
                if (unit.inventory[i].id == item.id) {
                    unit.inventory.splice(i, 1);
                    break;
                }
            }
        }
    }

    export class Sweet extends Item {
        constructor() {
            super(Common.ItemType.Food, "スイーツ");
        }

        event(me: Common.IItem, result: Common.IResult): Common.Action {
            var action = super.event(me, result);
            var item = result.action.item;
            var unit = <Common.IUnit>result.object;

            if (result.action.isUse()) {
                action = Common.Action.Status(unit, Common.StatusActionType.Heal, 100);
            }
            return action;
        }
    }
}
