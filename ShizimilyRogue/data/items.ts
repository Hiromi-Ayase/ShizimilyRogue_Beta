module ShizimilyRogue.Model.Data {


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

    /**
     * PCケース
     */
    export class Case extends Item {
        maxItems = Math.floor(ROT.RNG.getUniform() * 6);

        constructor() {
            super(Common.ItemType.Case, "PCケース");
        }

        commands(): string[] {
            var list = ["見る", "入れる", "投げる"];
            if (!this.cell.ground.isItem()) {
                list.push("置く");
            }
            return list;
        }

        get name(): string{
            return "PCケース" + " [" + (this.maxItems - this.innerItems.length) + "]";
        }

        select(n: number, items: Common.IItem[]): Common.Action {
            switch (n) {
                case 0:
                    return Common.Action.Use(this, items);
                case 1:
                    return Common.Action.Use(this, items);
                case 2:
                    return Common.Action.Throw(this);
                case 3:
                    return Common.Action.Place(this);
            }
        }

        use(me: Common.IItem, action: Common.Action, unit: Common.IUnit): Common.Action[]{
            var targetItems = action.targetItems;
            var type = action.subType;
            if (this.isInserted(targetItems[0])) {
                if (this.innerItems.length + targetItems.length <= this.maxItems) {
                    targetItems.forEach(item => {
                        this.takeItem(item);
                        unit.addInventory(item);
                    });
                } else {
                    return [Common.Action.Fail(Common.FailActionType.CaseOver)];
                }
            } else {
                if (this.innerItems.length + targetItems.length <= this.maxItems) {
                    targetItems.forEach(item => {
                        if (item != me) {
                            unit.takeInventory(item);
                            this.addItem(item);
                        }
                    });
                } else {
                    return [Common.Action.Fail(Common.FailActionType.CaseOver)];
                }
            }
            return [];
        }

        private addItem(item: Common.IItem): boolean {
            if (this.innerItems.length < this.maxItems) {
                this.innerItems.push(item);
                return true;
            } else {
                return false;
            }
        }

        private takeItem(item: Common.IItem): boolean {
            for (var i = 0; i < this.innerItems.length; i++) {
                if (this.innerItems[i].id == item.id) {
                    this.innerItems.splice(i, 1);
                    return true;
                }
            }
            return false;
        }

        private isInserted(item: Common.IItem): boolean {
            for (var i = 0; i < this.innerItems.length; i++) {
                if (this.innerItems[i].id == item.id) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * CPU
     */
    export class CPU extends Item {
        constructor() {
            super(Common.ItemType.Case, "CPU");
        }
        use(me: Common.IItem, action: Common.Action, unit: Common.IUnit): Common.Action[]{
            var player = <Common.IUnit>action.sender;
            player.weapon = me;
            return [];
        }
    }
}
