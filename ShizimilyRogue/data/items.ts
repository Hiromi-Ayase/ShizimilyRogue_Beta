module ShizimilyRogue.Model.Data {
    export class Item implements IItemData {
        type: DataType = DataType.Item;
        public commands: Common.ActionType[] = [
            Common.ActionType.Use,
            Common.ActionType.Throw,
            Common.ActionType.Place,
        ];

        constructor(
            public category: number,
            public name: string,
            public num: number = 1) {
        }
        event(me: Common.IItem, action: Common.Action): Common.Action[] {
            var unit = <Common.IUnit>action.sender;
            if (action.isPick()) {
                unit.inventory.push(me);
                return [Common.Action.Delete(me)];
            } else if (action.isPlace()) {
                unit.takeInventory(me);
                return [Common.Action.Drop(me, unit.coord)];
            } else if (action.isUse()) {
                return this.use(me, action, unit);
            } else if (action.isThrow()) {
                unit.takeInventory(me);
                me.dir = unit.dir;
                me.coord = unit.coord;
                var action = Common.Action.Fly(unit.coord);
                return [action];
            }
            return [];
        }

        use(me: Common.IItem, action: Common.Action, unit: Common.IUnit): Common.Action[] {
            return [];
        }
    }

    export class Sweet extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "スイーツ");
        }

        use(me: Common.IItem, action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(me);
            var action = Common.Action.Status(unit, Common.StatusActionType.Heal, 100);
            return [action];
        }
    }

    export class Case extends Item {
        maxItems = Math.floor(ROT.RNG.getUniform() * 6);
        items: Common.IItem[] = [];

        constructor() {
            super(Common.ItemType.Case, "PCケース");
        }

        use(me: Common.IItem, action: Common.Action, unit: Common.IUnit): Common.Action[] {
            var targetItems = action.targetItems;
            var type = action.subType;
            if (this.isInserted(targetItems[0])) {
                if (this.items.length + targetItems.length <= this.maxItems) {
                    targetItems.forEach(item => {
                        this.takeItem(item);
                        unit.addInventory(item);
                    });
                } else {
                    return [Common.Action.Fail(Common.FailActionType.CaseOver)];
                }
            } else {
                if (this.items.length + targetItems.length <= this.maxItems) {
                    targetItems.forEach(item => {
                        unit.takeInventory(item);
                        this.addItem(item);
                    });
                } else {
                    return [Common.Action.Fail(Common.FailActionType.CaseOver)];
                }
            }
            return [];
        }

        private isInserted(item: Common.IItem): boolean {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].id == item.id) {
                    return true;
                }
            }
            return false;
        }

        addItem(item: Common.IItem): boolean {
            if (this.items.length < this.maxItems) {
                this.items.push(item);
                return true;
            } else {
                return false;
            }
        }

        takeItem(item: Common.IItem): boolean {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].id == item.id) {
                    this.items.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
    }
}
