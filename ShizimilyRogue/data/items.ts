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
     * ショートケーキ
     */
    export class ShortCake extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "ショートケーキ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Full, 100);
            return [action];
        }
    }

    /**
     * アイス
     */
    export class Ice extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "アイス");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Comfort, 100);
            return [action];
        }
    }

    /**
     * 溶けたアイス
     */
    export class MeltedIce extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "溶けたアイス");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Utsu, 10);
            return [action];
        }
    }

    /**
     * クッキー
     */
    export class Cookie extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "クッキー");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Full, 5);
            return [action];
        }
    }

    /**
     * 睡眠薬入りバナナ
     */
    export class Banana_Sleep extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "睡眠薬入りバナナ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Sleep, 10);
            return [action];
        }
    }

    /**
     * からし入りバナナ
     */
    export class Banana_Mustard extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "からし入りバナナ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            return [action];
        }
    }


    /**
     * 目薬入りバナナ
     */
    export class Banana_EyeWash extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "目薬入りバナナ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            return [action];
        }
    }


    /**
     * 凍ったバナナ
     */
    export class Banana_Frozen extends Item {
        constructor() {
            super(Common.ItemType.Sweet, "凍ったバナナ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action = Common.Action.Status(unit, Common.StatusActionType.Senseless, 10);
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
     * GeForce GTX Titan
     */
    export class GeForceGTX_Titan extends Guard {
        baseName = "GeForce GTX Titan";
        baseParam = 100;
        utuParam = 90;
    }

    /**
     * GeForce GTX 780 Ti
     */
    export class GeForceGTX_780Ti extends Guard {
        baseName = "GeForce GTX 780Ti";
        baseParam = 70;
        utuParam = 60;
    }

    /**
     * GeForce GT 620
     */
    export class GeForceGT_620 extends Guard {
        baseName = "GeForce GT 620";
        baseParam = 30;
        utuParam = 0;
    }

    /**
     * Radeon R9 295X2
     */
    export class Radeon_R9_295X2 extends Guard {
        baseName = "Radeon R9 295X2";
        baseParam = 90;
        utuParam = 100;
    }

    /**
     * Radeon R8 280
     */
    export class Radeon_R8_280 extends Guard {
        baseName = "Radeon R8 280";
        baseParam = 60;
        utuParam = 70;
    }

    /**
     * Radeon HD 6670
     */
    export class Radeon_HD_6670 extends Guard {
        baseName = "Radeon HD 6670";
        baseParam = 0;
        utuParam = 30;
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

    /**
     * 子守唄のDVD(部屋の敵が寝る)
     */
    export class SleepingDVD extends DVD {
        constructor() {
            super("子守唄のDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
            unit.takeInventory(this);
            var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Sleep);
            action.sender = unit;
            return [action];
        }
    }
}
