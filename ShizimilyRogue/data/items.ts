module ShizimilyRogue.Model.Data {
    /**
     * アイテムデータ
     */
    export class Item implements IItemData {
        type: DataType = DataType.Item;
        innerItems: Common.IItem[] = [];
        status: Common.ItemState = Common.ItemState.Normal;
        unknownName: string = null;

        /**
         * @constructor
         */
        constructor(
            public category: number,
            public name: string,
            public num: number = 1) {
        }

        /**
         * コマンドリストの取得
         * @param {Common.IFOVData} fov 司会情報
         * @return {string[]} コマンドリスト
         */
        commands(me: Common.IItem): string[]{
            var list = ["使う", "投げる"];
            if (!me.cell.ground.isItem()) {
                list.push("置く");
            }
            return list;
        }

        /**
         * 
         * @param {Common.IItem} me 自分自身
         * @param {number} n 選択番号
         */
        select(me: Common.IItem, n: number, items: Common.IItem[]): Common.Action {
            switch(n) {
                case 0:
                    return Common.Action.Use(me);
                case 1:
                    return Common.Action.Throw(me);
                case 2:
                    return Common.Action.Place(me);
            }
        }

        event(me: Common.IItem, action: Common.Action): Common.Action[]{
            var unit = <Common.IUnit>action.sender;
            if (action.isPick()) {
                unit.inventory.push(me);
                return [Common.Action.Delete(me)];
            } else if (action.isPlace()) {
                unit.takeInventory(me);
                return [Common.Action.Drop(me, unit.cell.coord)];
            } else if (action.isUse()) {
                return this.use(me, action, unit);
            } else if (action.isThrow()) {
                unit.takeInventory(me);
                me.dir = unit.dir;
                me.cell.coord = unit.cell.coord;
                var action = Common.Action.Fly(unit.cell.coord);
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

    /**
     * PCケース
     */
    export class Case extends Item {
        maxItems = Math.floor(ROT.RNG.getUniform() * 6);

        constructor() {
            super(Common.ItemType.Case, "PCケース");
        }

        commands(me: Common.IItem): string[] {
            var list = ["見る", "入れる", "投げる"];
            if (!me.cell.ground.isItem()) {
                list.push("置く");
            }
            return list;
        }

        get name(): string{
            return "PCケース" + " [" + (this.maxItems - this.innerItems.length) + "]";
        }

        select(me: Common.IItem, n: number, items: Common.IItem[]): Common.Action {
            switch (n) {
                case 0:
                    return Common.Action.Use(me, items);
                case 1:
                    return Common.Action.Use(me, items);
                case 2:
                    return Common.Action.Throw(me);
                case 3:
                    return Common.Action.Place(me);
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
