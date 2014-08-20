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
     * からし入りバナナ(炎がはける）
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
     * 目薬入りバナナ(罠が見えるようになる)
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
     * 凍ったバナナ(10ターン気絶)
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
     * Core i7 Extreme
     */
    export class Core_i7_Extreme extends Weapon {
        baseParam = 100;
        baseName = "Core i7 Extreme";
        isHeavy = true;
    }

    /**
     * Core i7
     */
    export class Core_i7 extends Weapon {
        baseParam = 70;
        baseName = "Core i7";
    }

    /**
     * Core i5
     */
    export class Core_i5 extends Weapon {
        baseParam = 30;
        baseName = "Core i5";
    }

    /**
     * Core i3
     */
    export class Core_i3 extends Weapon {
        baseParam = 0;
        baseName = "Core i3";
    }

    /**
     * GeForce GTX Titan
     */
    export class GeForceGTX_Titan extends Guard {
        baseName = "GeForce GTX Titan";
        baseParam = 100;
        utuParam = 90;
        isHeavy = true;
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
        isHeavy = true;
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
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Sleep);
            action.sender = unit;
            return [action];
        }
    }

    /**
     * ロックDVD フロアの敵が10ターン混乱する
     */
    export class RockDVD extends DVD {
        constructor() {
            super("ロックのDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Confuse);
            action.sender = unit;
            return [action];
        }
    }

    /**
     * リア充のDVD フロアの敵に100の爆発ダメージ
     */
    export class RealJuDVD extends DVD {
        constructor() {
            super("リア充なDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Blast);
            action.sender = unit;
            return [action];
        }
    }

    /**
     * 意識の高いDVD(グラボ編) 装備中の防具の強さがあがる
     */
    export class HighAwarenessDVD_Guard extends DVD {
        constructor() {
            super("意識の高いDVD(グラボ編)");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [action];
        }
    }

    /**
     * 意識の高いDVD(CPU編) 装備中の武器の強さがあがる
     */
    export class HighAwarenessDVD_Weapon extends DVD {
        constructor() {
            super("意識の高いDVD(CPU編)");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [action];
        }
    }

    /**
     * DVD_R他のDVDをコピーできる
     */
    export class DVD_R extends DVD {
        constructor() {
            super("DVD_R");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [action];
        }
    }

    /**
     * お宝鑑定団のDVD アイテムを識別できる
     */
    export class Wealth_DVD extends DVD {
        constructor() {
            super("お宝鑑定団のDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [action];
        }
    }

    /**
     * フォーマットDVD HDDの空き容量を100GB増やす
     */
    export class Format_DVD extends DVD {
        constructor() {
            super("フォーマットDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [action];
        }
    }

    /**
     * PC再起動DVD メモリの空き容量をMAXにする
     */
    export class Restart_DVD extends DVD {
        constructor() {
            super("PC再起動DVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [action];
        }
    }
}
