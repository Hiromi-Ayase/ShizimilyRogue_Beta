module ShizimilyRogue.Model.Data {

    /**
     * お菓子
     */
    export class Sweet extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "スイーツ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Heal, 100);
            return [action];
        }
    }

    /**
     * PCケース
     */
    export class Case extends Item {
        maxItems = Math.floor(ROT.RNG.getUniform() * 6);
        baseName = "PCケース";
        innerItems = [];

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
            return this.baseName + " [" + (this.maxItems - this.innerItems.length) + "]";
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

        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
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
                        if (item != this) {
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
            if (this.innerItems.length < this.maxItems && item.category != Common.ItemType.Case) {
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
     * Pentium
     */
    export class Pentium extends Weapon {
        baseParam = 1000;
        plus = Math.floor(ROT.RNG.getUniform() * 4);
        baseName = "Pentium";
    }

    /**
     * GeForce
     */
    export class GeForce extends Guard {
        baseParam = 1000;
        plus = Math.floor(ROT.RNG.getUniform() * 4);
        baseName = "GeForce";
    }

    /**
     * DVD
     */
    export class DVD extends Item {
        constructor(name: string) {
            super(Common.ItemType.DVD, name);
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
            unit.takeInventory(this);
            return [action];
        }
    }

    /**
     * SDCard
     */
    export class SDCard extends Item {
        num: number;

        constructor(name: string) {
            super(Common.ItemType.DVD, name);
            this.num = Math.floor(ROT.RNG.getUniform() * 5) + 2;
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
            this.num--;
            return [action];
        }
    }


    export class SleepingDVD extends DVD {
        constructor() {
            super("子守唄のDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
            unit.takeInventory(this);
            var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Sleep);
            return [action];
        }
    }
}
