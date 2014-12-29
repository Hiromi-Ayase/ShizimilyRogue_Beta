module ShizimilyRogue.Model.Data {

    /**
     * ショートケーキ
     */
    class ShortCake extends Item {
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
    class Ice extends Item {
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
    class MeltedIce extends Item {
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
    class Cookie extends Item {
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
    class Banana_Sleep extends Item {
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
    class Banana_Mustard extends Item {
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
    class Banana_EyeWash extends Item {
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
    class Banana_Frozen extends Item {
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
     * Core i7 Extreme
     */
    class Core_i7_Extreme extends Weapon {
        baseParam = 100;
        baseName = "Core i7 Extreme";
        isHeavy = true;
    }

    /**
     * Core i7
     */
    class Core_i7 extends Weapon {
        baseParam = 70;
        baseName = "Core i7";
    }

    /**
     * Core i5
     */
    class Core_i5 extends Weapon {
        baseParam = 30;
        baseName = "Core i5";
    }

    /**
     * Core i3
     */
    class Core_i3 extends Weapon {
        baseParam = 0;
        baseName = "Core i3";
    }

    /**
     * GeForce GTX Titan
     */
    class GeForceGTX_Titan extends Guard {
        baseName = "GeForce GTX Titan";
        baseParam = 100;
        utuParam = 90;
        isHeavy = true;
    }

    /**
     * GeForce GTX 780 Ti
     */
    class GeForceGTX_780Ti extends Guard {
        baseName = "GeForce GTX 780Ti";
        baseParam = 70;
        utuParam = 60;
    }

    /**
     * GeForce GT 620
     */
    class GeForceGT_620 extends Guard {
        baseName = "GeForce GT 620";
        baseParam = 30;
        utuParam = 0;
    }

    /**
     * Radeon R9 295X2
     */
    class Radeon_R9_295X2 extends Guard {
        baseName = "Radeon R9 295X2";
        baseParam = 90;
        utuParam = 100;
        isHeavy = true;
    }

    /**
     * Radeon R8 280
     */
    class Radeon_R8_280 extends Guard {
        baseName = "Radeon R8 280";
        baseParam = 60;
        utuParam = 70;
    }

    /**
     * Radeon HD 6670
     */
    class Radeon_HD_6670 extends Guard {
        baseName = "Radeon HD 6670";
        baseParam = 0;
        utuParam = 30;
    }

    /**
     * 子守唄のDVD(部屋の敵が寝る)
     */
    class SleepingDVD extends DVD {
        constructor() {
            super("子守唄のDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            //var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Sleep);
            action.sender = unit;
            return [];
        }
    }

    /**
     * ロックDVD フロアの敵が10ターン混乱する
     */
    class RockDVD extends DVD {
        constructor() {
            super("ロックのDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            //var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Confuse);
            action.sender = unit;
            return [];
        }
    }

    /**
     * リア充のDVD フロアの敵に100の爆発ダメージ
     */
    class RealJuDVD extends DVD {
        constructor() {
            super("リア充なDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            //var action: Common.Action = Common.Action.Skill(Common.Target.RoomUnit, Common.SkillType.Blast);
            action.sender = unit;
            return [];
        }
    }

    /**
     * 意識の高いDVD(グラボ編) 装備中の防具の強さがあがる
     */
    class HighAwarenessDVD_Guard extends DVD {
        constructor() {
            super("意識の高いDVD(グラボ編)");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [];
        }
    }

    /**
     * 意識の高いDVD(CPU編) 装備中の武器の強さがあがる
     */
    class HighAwarenessDVD_Weapon extends DVD {
        constructor() {
            super("意識の高いDVD(CPU編)");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [];
        }
    }

    /**
     * DVD_R他のDVDをコピーできる
     */
    class DVD_R extends DVD {
        constructor() {
            super("DVD_R");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [];
        }
    }

    /**
     * お宝鑑定団のDVD アイテムを識別できる
     */
    class Wealth_DVD extends DVD {
        constructor() {
            super("お宝鑑定団のDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [];
        }
    }

    /**
     * フォーマットDVD HDDの空き容量を100GB増やす
     */
    class Format_DVD extends DVD {
        constructor() {
            super("フォーマットDVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [];
        }
    }

    /**
     * PC再起動DVD メモリの空き容量をMAXにする
     */
    class Restart_DVD extends DVD {
        constructor() {
            super("PC再起動DVD");
        }
        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            unit.takeInventory(this);
            /* 未実装 */
            action.sender = unit;
            return [];
        }
    }

    /**
     * 場所替えアプリ
     */
    class Swap_SDCard extends SDCard {
        constructor() {
            super("場所替えアプリ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
            /* 未実装 */
            return [];
        }
    }

    /**
     * 引き寄せアプリ
     */
    class Pull_SDCard extends SDCard {
        constructor() {
            super("引き寄せアプリ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            /* 未実装 */
            return [];
        }
    }

    /**
     * 吹き飛ばしアプリ
     */
    class Blow_SDCard extends SDCard {
        constructor() {
            super("吹き飛ばしアプリ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            /* 未実装 */
            return [];
        }
    }

    /**
     * 封印アプリ
     */
    class Seal_SDCard extends SDCard {
        constructor() {
            super("封印アプリ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            /* 未実装 */
            return [];
        }
    }

    /**
     * 身代わりアプリ
     */
    class Sacrifice_SDCard extends SDCard {
        constructor() {
            super("身代わりアプリ");
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            /* 未実装 */
            return [];
        }
    }

    /**
     * HDD
     */
    export class HDD extends Item {
        size: number;

        constructor() {
            super(Common.ItemType.HDD, "HDD");
            this.size = Math.floor(ROT.RNG.getUniform() * 5000) + 200;
        }

        get name(): string {
            return "HDD" + " [" + (this.size) + "GB]";
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[]{
            /* 未実装 */
            return [];
        }
    }

    /**
     * Memory
     */
    class Memory extends Item {
        size: number;

        constructor() {
            super(Common.ItemType.Memory, "Memory");
            this.size = Math.floor(ROT.RNG.getUniform() * 5000) + 200;
        }

        get name(): string {
            return "Memory" + " [" + (this.size) + "MB]";
        }

        use(action: Common.Action, unit: Common.IUnit): Common.Action[] {
            /* 未実装 */
            return [];
        }
    }

    /**
     * PCケース
     */
    class PC_Case extends Case {
        constructor() {
            super("PCケース");
        }
    }

    /**
     * フルタワーPCケース
     */
    class FullTower_Case extends Case {
        constructor() {
            super("フルタワーPCケース");
        }
    }

    /**
     * キューブケース
     */
    class Cube_Case extends Case {
        constructor() {
            super("キューブケース");
        }
    }

    /** お菓子一覧 */
//    var SWEET_LIST = [ShortCake, Ice, MeltedIce, Cookie, Banana_Sleep, Banana_Mustard, Banana_EyeWash, Banana_Frozen];
    var SWEET_LIST = [ShortCake];
    /** DVD一覧 */
    var DVD_LIST = [SleepingDVD, RockDVD, RealJuDVD, HighAwarenessDVD_Guard, HighAwarenessDVD_Weapon, DVD_R, Wealth_DVD, Format_DVD, Restart_DVD];
    /** SDCard一覧 */
    var SDCard_LIST = [Swap_SDCard, Pull_SDCard, Blow_SDCard, Seal_SDCard, Sacrifice_SDCard];
    /** CPU一覧 */
    var CPU_LIST = [Core_i7_Extreme, Core_i7, Core_i5, Core_i3];
    /** グラボ一覧 */
    var GPU_LIST = [GeForceGTX_Titan, GeForceGTX_780Ti, GeForceGT_620, Radeon_R9_295X2, Radeon_R8_280, Radeon_HD_6670];
    /** ケース一覧 */
    var Case_LIST = [PC_Case, FullTower_Case, Cube_Case];


    /**
     * アイテム生成クラス
     */
    export class ItemFactory {
        /**
         * ランダムにお菓子を生成する
         * @return {Common.Item} お菓子
         */
        static getSweet(): Common.IItem {
            var n = Math.floor(ROT.RNG.getUniform() * SWEET_LIST.length);
            return new SWEET_LIST[n];
        }

        /**
         * ランダムにDVDを生成する
         * @return {Common.Item} DVD
         */
        static getDVD(): Common.IItem {
            var n = Math.floor(ROT.RNG.getUniform() * DVD_LIST.length);
            return new DVD_LIST[n];
        }

        /**
         * ランダムにSDCardを生成する
         * @return {Common.Item} SDCard
         */
        static getSDCard(): Common.IItem {
            var n = Math.floor(ROT.RNG.getUniform() * SDCard_LIST.length);
            return new SDCard_LIST[n];
        }

        /**
         * ランダムにグラボを生成する
         * @return {Common.Item} グラボ
         */
        static getGPU(): Common.IItem {
            var n = Math.floor(ROT.RNG.getUniform() * GPU_LIST.length);
            return new GPU_LIST[n];
        }

        /**
         * ランダムにCPUを生成する
         * @return {Common.Item} CPU
         */
        static getCPU(): Common.IItem {
            var n = Math.floor(ROT.RNG.getUniform() * CPU_LIST.length);
            return new CPU_LIST[n];
        }

        /**
         * ランダムにケースを生成する
         * @return {Common.Item} Case
         */
        static getCase(): Common.IItem {
            var n = Math.floor(ROT.RNG.getUniform() * Case_LIST.length);
            return new Case_LIST[n];
        }

        /**
         * HDDを生成する
         * @return {Common.Item} HDD
         */
        static getHDD(): Common.IItem {
            return new HDD();
        }

        /**
         * Memoryを生成する
         * @return {Common.Item} Memory
         */
        static getMemory(): Common.IItem {
            return new Memory();
        }

        /**
         * ランダムにアイテムを生成する
         * @return {Common.Item} Memory
         */
        static getItem(): Common.IItem {
            // 0:お菓子 1:DVD 2:SDCard 3:GPU 4:CPU 5:Case 6:HDD 7:Memory
            var n = Math.floor(ROT.RNG.getUniform() * 8);
            switch (n) {
                case 0:
                    return ItemFactory.getSweet();
                case 1:
                    return ItemFactory.getDVD();
                case 2:
                    return ItemFactory.getSDCard();
                case 3:
                    return ItemFactory.getGPU();
                case 4:
                    return ItemFactory.getCPU();
                case 5:
                    return ItemFactory.getCase();
                case 6:
                    return ItemFactory.getHDD();
                case 7:
                    return ItemFactory.getMemory();
            }
        }
    }

}

